const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:attemptId", (req, res) => {

    const { attemptId } = req.params;

    const courseSql = `
        SELECT
            a.student_id,
            c.id AS course_id,
            c.title AS course
        FROM attempts a
        INNER JOIN quiz_sets qs
            ON qs.id = a.quiz_set_id
        INNER JOIN courses c
            ON c.id = qs.course_id
        WHERE a.id = ?
    `;

    db.query(
        courseSql,
        [attemptId],
        (err, courseResult) => {

            if (err) {
                console.error("Course query error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to find course."
                });
            }

            if (courseResult.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Attempt not found."
                });
            }

            const studentId =
                courseResult[0].student_id;

            const courseId =
                courseResult[0].course_id;

            const courseName =
                courseResult[0].course;

            const attemptsSql = `

                SELECT
                    qs.id AS quiz_set_id,
                    qs.title AS quiz_set,

                    a.id AS attempt_id,
                    a.score,
                    a.mastery_status,
                    a.created_at

                FROM quiz_sets qs

                INNER JOIN attempts a
                    ON a.id = (

                        SELECT MAX(a2.id)

                        FROM attempts a2

                        WHERE a2.student_id = ?
                        AND a2.quiz_set_id = qs.id

                    )

                WHERE qs.course_id = ?

                ORDER BY qs.id ASC

            `;

            db.query(
                attemptsSql,
                [studentId, courseId],
                (err, attempts) => {

                    if (err) {
                        console.error(
                            "Attempts query error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to load course attempts."
                        });
                    }

                    const totalScore =
                        attempts.reduce(
                            (sum, attempt) => {

                                return (
                                    sum +
                                    Number(
                                        attempt.score || 0
                                    )
                                );

                            },
                            0
                        );


                    const overallScore =
                        attempts.length > 0
                            ? Number(
                                (
                                    totalScore /
                                    attempts.length
                                ).toFixed(2)
                            )
                            : 0;

                    const weakQuizzes =
                        attempts
                            .filter(
                                attempt =>
                                    Number(
                                        attempt.score || 0
                                    ) < 75
                            )
                            .sort((a, b) => {

                                const scoreA =
                                    Number(
                                        a.score || 0
                                    );

                                const scoreB =
                                    Number(
                                        b.score || 0
                                    );

                                if (
                                    scoreA !== scoreB
                                ) {

                                    return (
                                        scoreA -
                                        scoreB
                                    );

                                }

                                return (
                                    Number(
                                        a.quiz_set_id
                                    ) -
                                    Number(
                                        b.quiz_set_id
                                    )
                                );

                            });

                    let recommendedQuiz = null;

                    let recommendedQuizId = null;


                    if (
                        weakQuizzes.length > 0
                    ) {

                        const weakest =
                            weakQuizzes[0];


                        recommendedQuiz =
                            weakest.quiz_set;


                        recommendedQuizId =
                            weakest.quiz_set_id;

                    }

                    let recommendedLevel;


                    if (overallScore > 75) {

                        recommendedLevel = "Hard";

                    }
                    else if (overallScore >= 50) {

                        recommendedLevel = "Medium";

                    }
                    else {

                        recommendedLevel = "Easy";

                    }

                    let masteryStatus;


                    if (overallScore > 75) {

                        masteryStatus =
                            "Mastered";

                    }
                    else if (overallScore >= 50) {

                        masteryStatus =
                            "Partially Mastered";

                    }
                    else {

                        masteryStatus =
                            "Not Mastered";

                    }

                    const weakAttemptId =
                        weakQuizzes.length > 0
                            ? weakQuizzes[0].attempt_id
                            : null;


                    if (!weakAttemptId) {

                        loadAllAnswers(
                            attempts,
                            "None"
                        );

                        return;

                    }


                    db.query(
                        `
                        SELECT
                            q.topic,
                            COUNT(*) AS error_count

                        FROM answers ans

                        INNER JOIN questions q
                            ON q.id = ans.question_id

                        WHERE ans.attempt_id = ?

                        AND ans.is_correct = 0

                        GROUP BY q.topic

                        ORDER BY error_count DESC

                        LIMIT 1
                        `,
                        [weakAttemptId],
                        (topicErr, topicResult) => {

                            let weakTopic = "None";


                            if (
                                !topicErr &&
                                topicResult.length > 0
                            ) {

                                weakTopic =
                                    topicResult[0].topic;

                            }


                            loadAllAnswers(
                                attempts,
                                weakTopic
                            );

                        }
                    );

                    function loadAllAnswers(
                        latestAttempts,
                        weakTopic
                    ) {

                        const attemptIds =
                            latestAttempts.map(
                                attempt =>
                                    attempt.attempt_id
                            );


                        if (
                            attemptIds.length === 0
                        ) {

                            sendResult(
                                latestAttempts,
                                [],
                                weakTopic
                            );

                            return;

                        }


                        const placeholders =
                            attemptIds
                                .map(() => "?")
                                .join(",");


                        const answersSql = `

                            SELECT

                                ans.attempt_id,

                                qs.id AS quiz_set_id,

                                qs.title AS quiz_set,

                                q.question_text,

                                q.correct_answer,

                                q.marks,

                                ans.student_answer,

                                ans.marks_awarded,

                                ans.is_correct

                            FROM answers ans

                            INNER JOIN questions q
                                ON q.id =
                                    ans.question_id

                            INNER JOIN quiz_sets qs
                                ON qs.id =
                                    q.quiz_set_id

                            WHERE ans.attempt_id
                                IN (${placeholders})

                            ORDER BY
                                qs.id ASC,
                                q.id ASC

                        `;


                        db.query(
                            answersSql,
                            attemptIds,
                            (answerErr, allAnswers) => {

                                if (answerErr) {

                                    console.error(
                                        "Answers query error:",
                                        answerErr
                                    );

                                    return res.status(
                                        500
                                    ).json({
                                        success: false,
                                        message:
                                            "Failed to load question review."
                                    });

                                }


                                sendResult(
                                    latestAttempts,
                                    allAnswers,
                                    weakTopic
                                );

                            }
                        );

                    }

                    function sendResult(
                        latestAttempts,
                        allAnswers,
                        weakTopic
                    ) {

                        db.query(
                            `
                            SELECT
                                f.instructor_feedback
                                    AS feedback

                            FROM feedback f

                            INNER JOIN attempts a
                                ON a.id =
                                    f.attempt_id

                            INNER JOIN quiz_sets qs
                                ON qs.id =
                                    a.quiz_set_id

                            WHERE a.student_id = ?

                            AND qs.course_id = ?

                            ORDER BY a.id DESC

                            LIMIT 1
                            `,
                            [
                                studentId,
                                courseId
                            ],
                            (feedbackErr, feedbackResult) => {

                                const feedback =
                                    !feedbackErr &&
                                    feedbackResult.length > 0
                                        ? feedbackResult[0].feedback
                                        : null;

                                return res.json({

                                    success: true,

                                    course:
                                        courseName,

                                    course_id:
                                        courseId,

                                    score:
                                        overallScore,

                                    overallScore:
                                        overallScore,

                                    mastered:
                                        overallScore > 75,

                                    mastery_status:
                                        masteryStatus,

                                    weak_topic:
                                        weakTopic,

                                    recommended_level:
                                        recommendedLevel,

                                    recommended_quiz:
                                        recommendedQuiz,

                                    recommended_quiz_id:
                                        recommendedQuizId,

                                    feedback,

                                    quizSets:
                                        latestAttempts.map(
                                            attempt => ({

                                                quiz_set_id:
                                                    attempt.quiz_set_id,

                                                quiz_set:
                                                    attempt.quiz_set,

                                                attempt_id:
                                                    attempt.attempt_id,

                                                score:
                                                    Number(
                                                        attempt.score || 0
                                                    )

                                            })
                                        ),

                                    answers:
                                        allAnswers

                                });

                            }
                        );

                    }

                }
            );

        }

    );

});


module.exports = router;
