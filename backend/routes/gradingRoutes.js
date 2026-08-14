const express = require("express");
const router = express.Router();
const db = require("../db");
const { exec } = require("child_process");
const path = require("path");

router.get("/:attemptId", (req, res) => {

    const { attemptId } = req.params;

    const contextSql = `
        SELECT
            a.student_id,
            qs.course_id

        FROM attempts a

        INNER JOIN quiz_sets qs
            ON qs.id = a.quiz_set_id

        WHERE a.id = ?

        LIMIT 1
    `;

    db.query(
        contextSql,
        [attemptId],
        (err, context) => {

            if (err) {

                console.error(
                    "Grading context error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to find attempt."
                });
            }

            if (context.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Attempt not found."
                });
            }

            const studentId =
                context[0].student_id;

            const courseId =
                context[0].course_id;

            const sql = `
                SELECT

                    answers.id AS answer_id,

                    answers.attempt_id,

                    answers.student_answer,

                    answers.marks_awarded,

                    answers.is_correct,

                    questions.id AS question_id,

                    questions.question_text,

                    questions.question_type,

                    questions.correct_answer,

                    questions.marks,

                    questions.topic,

                    qs.id AS quiz_set_id,

                    qs.title AS quiz_set_title,

                    qs.difficulty

                FROM answers

                INNER JOIN questions
                    ON answers.question_id =
                       questions.id

                INNER JOIN quiz_sets qs
                    ON questions.quiz_set_id =
                       qs.id

                INNER JOIN (

                    SELECT
                        a2.quiz_set_id,
                        MAX(a2.id) AS latest_attempt_id

                    FROM attempts a2

                    INNER JOIN quiz_sets qs2
                        ON qs2.id = a2.quiz_set_id

                    WHERE
                        a2.student_id = ?

                        AND qs2.course_id = ?

                    GROUP BY
                        a2.quiz_set_id

                ) latest

                    ON latest.latest_attempt_id =
                       answers.attempt_id

                ORDER BY
                    qs.id ASC,
                    questions.id ASC
            `;

            db.query(
                sql,
                [
                    studentId,
                    courseId
                ],
                (answerErr, result) => {

                    if (answerErr) {

                        console.error(
                            "Grading answers error:",
                            answerErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to load answers."
                        });
                    }

                    return res.json(result);
                }
            );
        }
    );
});

router.post("/mark", (req, res) => {

    const {
        answerId,
        marks
    } = req.body;

    const correct =
        Number(marks) > 0 ? 1 : 0;

    db.query(
        `
        UPDATE answers

        SET
            marks_awarded = ?,
            is_correct = ?

        WHERE id = ?
        `,
        [
            marks,
            correct,
            answerId
        ],
        (err) => {

            if (err) {

                console.error(
                    "Manual marking error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to update marks."
                });
            }

            recalculateAttempt(
                answerId,
                res
            );
        }
    );
});

function recalculateAttempt(
    answerId,
    res
) {

    db.query(
        `
        SELECT

            ans.attempt_id,
            ans.marks_awarded,

            q.topic,
            q.marks

        FROM answers ans

        JOIN questions q
            ON ans.question_id = q.id

        WHERE ans.attempt_id =
        (
            SELECT attempt_id

            FROM answers

            WHERE id = ?

            LIMIT 1
        )
        `,
        [answerId],
        (err, rows) => {

            if (err) {

                console.error(
                    "Recalculate attempt error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to recalculate attempt."
                });
            }

            if (rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Attempt not found"
                });
            }

            let earnedMarks = 0;
            let totalMarks = 0;

            const topicTotal = {};
            const topicEarned = {};

            rows.forEach((row) => {

                earnedMarks +=
                    Number(
                        row.marks_awarded || 0
                    );

                totalMarks +=
                    Number(
                        row.marks || 0
                    );

                const topic =
                    row.topic || "Unknown";

                if (!topicTotal[topic]) {

                    topicTotal[topic] = 0;
                    topicEarned[topic] = 0;
                }

                topicTotal[topic] +=
                    Number(
                        row.marks || 0
                    );

                topicEarned[topic] +=
                    Number(
                        row.marks_awarded || 0
                    );
            });

            const percentage =
                totalMarks === 0
                    ? 0
                    : Number(
                        (
                            (earnedMarks / totalMarks) *
                            100
                        ).toFixed(2)
                    );

            const mastered =
                percentage > 75 ? 1 : 0;

            let weakTopic = "None";
            let lowestPercentage = 101;

            Object.keys(topicTotal).forEach(
                (topic) => {

                    const topicScore =
                        topicTotal[topic] === 0
                            ? 0
                            : (
                                topicEarned[topic] /
                                topicTotal[topic]
                            ) * 100;

                    if (
                        topicScore <
                        lowestPercentage
                    ) {

                        lowestPercentage =
                            topicScore;

                        weakTopic =
                            topic;
                    }
                }
            );

            const attemptId =
                rows[0].attempt_id;

            db.query(
                `
                UPDATE attempts

                SET
                    score = ?,
                    mastery_status = ?,
                    earned_marks = ?,
                    total_marks = ?

                WHERE id = ?
                `,
                [
                    percentage,
                    mastered,
                    earnedMarks,
                    totalMarks,
                    attemptId
                ],
                (err2) => {

                    if (err2) {

                        console.error(
                            "Attempt update error:",
                            err2
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to update attempt."
                        });
                    }

                    runDecisionTree(
                        attemptId,
                        percentage,
                        mastered,
                        weakTopic,
                        res
                    );
                }
            );
        }
    );
}

function runDecisionTree(
    attemptId,
    score,
    mastered,
    weakTopic,
    res
) {

    const scriptPath = path.join(
        __dirname,
        "../../ml-engine/recommendation.py"
    );

    exec(
        `python "${scriptPath}" ${score} ${mastered} "${weakTopic}"`,
        (error, stdout, stderr) => {

            if (error) {

                console.error(
                    "Decision tree error:",
                    error
                );

                if (stderr) {
                    console.error(
                        "Decision tree stderr:",
                        stderr
                    );
                }

                return res.json({
                    success: true,
                    attemptId,
                    score,
                    mastered,
                    message:
                        "Marks updated but recommendation failed."
                });
            }

            try {

                const recommendation =
                    JSON.parse(stdout);

                updateRecommendation(
                    attemptId,
                    recommendation,
                    score,
                    mastered,
                    res
                );

            } catch (err) {

                console.error(
                    "Recommendation JSON error:",
                    err
                );

                console.error(
                    "Python output:",
                    stdout
                );

                return res.json({
                    success: true,
                    attemptId,
                    score,
                    mastered,
                    message:
                        "Marks updated."
                });
            }
        }
    );
}

function updateRecommendation(
    attemptId,
    recommendation,
    score,
    mastered,
    res
) {

    db.query(
        `
        SELECT
            qs.course_id

        FROM attempts a

        JOIN quiz_sets qs
            ON a.quiz_set_id = qs.id

        WHERE a.id = ?

        LIMIT 1
        `,
        [attemptId],
        (err, result) => {

            if (err) {

                console.error(
                    "Course lookup error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to find course."
                });
            }

            if (result.length === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Attempt not found"
                });
            }

            const courseId =
                result[0].course_id;

            db.query(
                `
                SELECT DISTINCT
                    qs.id,
                    qs.title

                FROM quiz_sets qs

                INNER JOIN questions q
                    ON q.quiz_set_id = qs.id

                WHERE
                    qs.course_id = ?

                    AND q.topic = ?

                    AND qs.difficulty = ?

                LIMIT 1
                `,
                [
                    courseId,
                    recommendation.weak_topic,
                    recommendation.recommended_level
                ],
                (err, quizResult) => {

                    if (err) {

                        console.error(
                            "Recommended quiz lookup error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to find recommended quiz."
                        });
                    }

                    let quizId = null;

                    let quizTitle =
                        recommendation.recommended_quiz;

                    if (
                        quizResult.length > 0
                    ) {

                        quizId =
                            quizResult[0].id;

                        quizTitle =
                            quizResult[0].title;
                    }

                    db.query(
                        `
                        SELECT
                            id

                        FROM recommendations

                        WHERE attempt_id = ?

                        LIMIT 1
                        `,
                        [attemptId],
                        (err, existing) => {

                            if (err) {

                                console.error(
                                    "Recommendation check error:",
                                    err
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Failed to check recommendation."
                                });
                            }

                            if (
                                existing.length > 0
                            ) {

                                db.query(
                                    `
                                    UPDATE recommendations

                                    SET
                                        weak_topic = ?,
                                        recommended_level = ?,
                                        recommended_quiz = ?,
                                        recommended_quiz_id = ?

                                    WHERE attempt_id = ?
                                    `,
                                    [
                                        recommendation.weak_topic,
                                        recommendation.recommended_level,
                                        quizTitle,
                                        quizId,
                                        attemptId
                                    ],
                                    (err) => {

                                        if (err) {

                                            console.error(
                                                "Recommendation update error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                success: false,
                                                message:
                                                    "Failed to update recommendation."
                                            });
                                        }

                                        return res.json({

                                            success: true,

                                            attemptId,

                                            score,

                                            mastered,

                                            recommendation: {

                                                weak_topic:
                                                    recommendation.weak_topic,

                                                recommended_level:
                                                    recommendation.recommended_level,

                                                recommended_quiz:
                                                    quizTitle,

                                                recommended_quiz_id:
                                                    quizId
                                            },

                                            message:
                                                "Marks updated successfully."
                                        });
                                    }
                                );

                            }

                            else {

                                db.query(
                                    `
                                    INSERT INTO recommendations
                                    (
                                        attempt_id,
                                        weak_topic,
                                        recommended_level,
                                        recommended_quiz,
                                        recommended_quiz_id
                                    )

                                    VALUES
                                    (?, ?, ?, ?, ?)
                                    `,
                                    [
                                        attemptId,
                                        recommendation.weak_topic,
                                        recommendation.recommended_level,
                                        quizTitle,
                                        quizId
                                    ],
                                    (err) => {

                                        if (err) {

                                            console.error(
                                                "Recommendation insert error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                success: false,
                                                message:
                                                    "Failed to save recommendation."
                                            });
                                        }

                                        return res.json({

                                            success: true,

                                            attemptId,

                                            score,

                                            mastered,

                                            recommendation: {

                                                weak_topic:
                                                    recommendation.weak_topic,

                                                recommended_level:
                                                    recommendation.recommended_level,

                                                recommended_quiz:
                                                    quizTitle,

                                                recommended_quiz_id:
                                                    quizId
                                            },

                                            message:
                                                "Marks updated successfully."
                                        });
                                    }
                                );
                            }
                        }
                    );
                }
            );
        }
    );
}


module.exports = router;