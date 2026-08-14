const express = require("express");
const router = express.Router();
const db = require("../db");
const { exec } = require("child_process");
const path = require("path");

router.post("/", (req, res) => {

    const {
        studentId,
        courseId,
        quizSetId,
        answers,
        attemptType = "normal"
    } = req.body;

    if (!studentId || !courseId || !answers) {
        return res.status(400).json({
            success: false,
            message: "Missing required data."
        });
    }

    if (attemptType === "recommended") {

        if (!quizSetId) {
            return res.status(400).json({
                success: false,
                message: "Quiz Set ID is required."
            });
        }

        const questionSql = `
            SELECT *
            FROM questions
            WHERE quiz_set_id = ?
            ORDER BY id ASC
        `;

        db.query(questionSql, [quizSetId], (err, questions) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to load questions."
                });
            }

            if (questions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No questions found."
                });
            }

            calculateAndSaveAttempt(
                studentId,
                courseId,
                quizSetId,
                answers,
                questions,
                "recommended",
                res
            );

        });

        return;
    }

    const questionSql = `
        SELECT
            q.*,
            qs.id AS quiz_set_id,
            qs.title AS quiz_set_title
        FROM questions q
        INNER JOIN quiz_sets qs
            ON qs.id = q.quiz_set_id
        WHERE qs.course_id = ?
        ORDER BY qs.id ASC, q.id ASC
    `;

    db.query(questionSql, [courseId], (err, questions) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to load course questions."
            });
        }

        if (questions.length === 0) {

            return res.status(404).json({
                success: false,
                message: "No questions found for this course."
            });

        }

        const quizSets = {};

        questions.forEach((question) => {

            const setId = question.quiz_set_id;

            if (!quizSets[setId]) {

                quizSets[setId] = {
                    quizSetId: setId,
                    quizSetTitle: question.quiz_set_title,
                    questions: []
                };

            }

            quizSets[setId].questions.push(question);

        });


        const setList = Object.values(quizSets);

        const savedAttempts = [];


        function processQuizSet(index) {

            if (index >= setList.length) {

                calculateOverallAndRecommendation(
                    studentId,
                    courseId,
                    savedAttempts,
                    res
                );

                return;
            }


            const currentSet = setList[index];

            calculateSetScore(
                currentSet.questions,
                answers
            ).then((setData) => {

                db.query(
                    `
                    INSERT INTO attempts
                    (
                        student_id,
                        quiz_set_id,
                        score,
                        mastery_status,
                        attempt_type
                    )
                    VALUES (?,?,?,?,?)
                    `,
                    [
                        studentId,
                        currentSet.quizSetId,
                        setData.percentage,
                        setData.mastered ? 1 : 0,
                        "normal"
                    ],
                    (err, result) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                success: false,
                                message: "Failed to save quiz attempt."
                            });

                        }

                        const attemptId = result.insertId;

                        savedAttempts.push({
                            attemptId,
                            quizSetId: currentSet.quizSetId,
                            quizSetTitle: currentSet.quizSetTitle,
                            score: setData.percentage
                        });

                        const answerPromises =
                            setData.evaluatedAnswers.map((answer) => {

                                return new Promise((resolve, reject) => {

                                    db.query(
                                        `
                                        INSERT INTO answers
                                        (
                                            attempt_id,
                                            question_id,
                                            student_answer,
                                            marks_awarded,
                                            is_correct
                                        )
                                        VALUES (?,?,?,?,?)
                                        `,
                                        [
                                            attemptId,
                                            answer.questionId,
                                            answer.studentAnswer,
                                            answer.marksAwarded,
                                            answer.isCorrect ? 1 : 0
                                        ],
                                        (err) => {

                                            if (err) {
                                                reject(err);
                                            } else {
                                                resolve();
                                            }

                                        }
                                    );

                                });

                            });


                        Promise.all(answerPromises)
                            .then(() => {

                                processQuizSet(index + 1);

                            })
                            .catch((err) => {

                                console.error(err);

                                return res.status(500).json({
                                    success: false,
                                    message: "Failed to save answers."
                                });

                            });

                    }
                );

            });

        }


        processQuizSet(0);

    });

});

function calculateSetScore(questions, answers) {

    return new Promise((resolve) => {

        let earnedMarks = 0;
        let totalMarks = 0;

        const topicErrors = {};
        const evaluatedAnswers = [];

        questions.forEach((q) => {

            const marks = Number(q.marks || 1);

            totalMarks += marks;

            const studentAnswer = (answers[q.id] || "")
                .toString()
                .trim()
                .toLowerCase();

            const correctAnswer = (q.correct_answer || "")
                .toString()
                .trim()
                .toLowerCase();

            const isCorrect =
                studentAnswer !== "" &&
                studentAnswer === correctAnswer;

            const marksAwarded =
                isCorrect ? marks : 0;

            earnedMarks += marksAwarded;

            if (!isCorrect) {

                const topic = q.topic || "General";

                topicErrors[topic] =
                    (topicErrors[topic] || 0) + 1;

            }

            evaluatedAnswers.push({

                questionId: q.id,

                studentAnswer:
                    answers[q.id] || "",

                marksAwarded,

                isCorrect

            });

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


        const mastered = percentage > 75;


        let weakTopic = "None";


        if (Object.keys(topicErrors).length > 0) {

            weakTopic =
                Object.keys(topicErrors).reduce((a, b) =>
                    topicErrors[a] >= topicErrors[b]
                        ? a
                        : b
                );

        }


        resolve({

            earnedMarks,

            totalMarks,

            percentage,

            mastered,

            weakTopic,

            evaluatedAnswers

        });

    });

}


function calculateOverallAndRecommendation(
    studentId,
    courseId,
    savedAttempts,
    res
) {

    const sql = `

        SELECT
            qs.id AS quiz_set_id,
            qs.title AS quiz_set,
            a.id AS attempt_id,
            a.score,
            a.created_at

        FROM quiz_sets qs

        LEFT JOIN attempts a
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
        sql,
        [studentId, courseId],
        (err, results) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to calculate overall score."
                });

            }

            const attemptedSets =
                results.filter(
                    row => row.attempt_id !== null
                );


            if (attemptedSets.length === 0) {

                return res.status(500).json({
                    success: false,
                    message:
                        "No quiz attempts found."
                });

            }

            const totalScore =
                attemptedSets.reduce(
                    (sum, row) =>
                        sum + Number(row.score || 0),
                    0
                );


            const overallScore =
                Number(
                    (
                        totalScore /
                        attemptedSets.length
                    ).toFixed(2)
                );

            const weakSets =
                attemptedSets
                    .filter(
                        row => Number(row.score) < 75
                    )
                    .sort((a, b) => {

                        const scoreDifference =
                            Number(a.score) -
                            Number(b.score);

                        if (scoreDifference !== 0) {
                            return scoreDifference;
                        }

                        return (
                            Number(a.quiz_set_id) -
                            Number(b.quiz_set_id)
                        );

                    });


            let recommendedQuiz = null;
            let recommendedQuizId = null;
            let recommendedLevel = null;
            let weakTopic = "None";


            if (weakSets.length > 0) {

                const weakest = weakSets[0];

                recommendedQuiz =
                    weakest.quiz_set;

                recommendedQuizId =
                    weakest.quiz_set_id;


                const weakScore =
                    Number(weakest.score);


                if (overallScore > 75) {

                    recommendedLevel = "Hard";

                }
                else if (weakScore > 50) {

                    recommendedLevel = "Medium";

                }
                else {

                    recommendedLevel = "Easy";

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
                    [weakest.attempt_id],
                    (topicErr, topicResult) => {

                        if (!topicErr &&
                            topicResult.length > 0) {

                            weakTopic =
                                topicResult[0].topic;

                        }


                        saveOverallRecommendation();

                    }
                );

            }
            else {

                recommendedLevel = "Hard";

                saveOverallRecommendation();

            }

           function saveOverallRecommendation() {

    const latestAttempt =
        attemptedSets.reduce(
            (latest, current) => {

                if (!latest) {
                    return current;
                }

                return
                    Number(current.attempt_id) >
                    Number(latest.attempt_id)
                        ? current
                        : latest;

            },
            null
        );


    if (!latestAttempt) {
        return sendResponse();
    }

    db.query(
        `
        SELECT id

        FROM recommendations

        WHERE attempt_id = ?

        ORDER BY id DESC

        LIMIT 1
        `,
        [
            latestAttempt.attempt_id
        ],
        (checkErr, existing) => {

            if (checkErr) {

                console.error(
                    "Recommendation lookup error:",
                    checkErr
                );

                return sendResponse();
            }

            if (existing.length > 0) {

                db.query(
                    `
                    UPDATE recommendations

                    SET
                        weak_topic = ?,
                        recommended_level = ?,
                        recommended_quiz = ?,
                        recommended_quiz_id = ?

                    WHERE id = ?
                    `,
                    [
                        weakTopic,
                        recommendedLevel,
                        recommendedQuiz,
                        recommendedQuizId,
                        existing[0].id
                    ],
                    (updateErr) => {

                        if (updateErr) {

                            console.error(
                                "Recommendation update error:",
                                updateErr
                            );

                        }

                        sendResponse();
                    }
                );

                return;
            }

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

                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    latestAttempt.attempt_id,
                    weakTopic,
                    recommendedLevel,
                    recommendedQuiz,
                    recommendedQuizId
                ],
                (insertErr) => {

                    if (insertErr) {

                        console.error(
                            "Recommendation insert error:",
                            insertErr
                        );

                    }

                    sendResponse();
                }
            );
        }
    );
}

            function sendResponse() {

                const latestAttempt =
                    attemptedSets.reduce(
                        (latest, current) => {

                            if (!latest) {
                                return current;
                            }

                            return
                                Number(current.attempt_id) >
                                Number(latest.attempt_id)
                                    ? current
                                    : latest;

                        },
                        null
                    );


                res.json({

                    success: true,

                    score: overallScore,

                    overallScore,

                    attemptId:
                        latestAttempt
                            ? latestAttempt.attempt_id
                            : null,

                    mastery:
                        overallScore > 75,

                    mastery_status:
                        overallScore > 75
                            ? "Mastered"
                            : overallScore >= 50
                                ? "Partially Mastered"
                                : "Not Mastered",

                    weakTopic,

                    recommendation: {

                        weak_topic: weakTopic,

                        recommended_level:
                            recommendedLevel,

                        recommended_quiz:
                            recommendedQuiz,

                        recommended_quiz_id:
                            recommendedQuizId

                    },

                    quizSets:
                        attemptedSets.map(set => ({

                            quiz_set_id:
                                set.quiz_set_id,

                            quiz_set:
                                set.quiz_set,

                            attempt_id:
                                set.attempt_id,

                            score:
                                Number(set.score)

                        }))

                });

            }

        }
    );

}

function calculateAndSaveAttempt(
    studentId,
    courseId,
    quizSetId,
    answers,
    questions,
    attemptType,
    res
) {

    calculateSetScore(
        questions,
        answers
    ).then((setData) => {

        db.query(
            `
            INSERT INTO attempts
            (
                student_id,
                quiz_set_id,
                score,
                mastery_status,
                attempt_type
            )
            VALUES (?,?,?,?,?)
            `,
            [
                studentId,
                quizSetId,
                setData.percentage,
                setData.mastered ? 1 : 0,
                attemptType
            ],
            (err, result) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message:
                            "Failed to save attempt."
                    });

                }


                const attemptId =
                    result.insertId;


                const answerPromises =
                    setData.evaluatedAnswers.map(
                        (answer) => {

                            return new Promise(
                                (resolve, reject) => {

                                    db.query(
                                        `
                                        INSERT INTO answers
                                        (
                                            attempt_id,
                                            question_id,
                                            student_answer,
                                            marks_awarded,
                                            is_correct
                                        )
                                        VALUES (?,?,?,?,?)
                                        `,
                                        [
                                            attemptId,
                                            answer.questionId,
                                            answer.studentAnswer,
                                            answer.marksAwarded,
                                            answer.isCorrect
                                                ? 1
                                                : 0
                                        ],
                                        (err) => {

                                            if (err) {
                                                reject(err);
                                            }
                                            else {
                                                resolve();
                                            }

                                        }
                                    );

                                }
                            );

                        }
                    );


                Promise.all(answerPromises)
                    .then(() => {

                        calculateOverallAndRecommendation(
                            studentId,
                            courseId,
                            [{
                                attemptId,
                                quizSetId,
                                score:
                                    setData.percentage
                            }],
                            res
                        );

                    })
                    .catch((err) => {

                        console.error(err);

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to save answers."
                        });

                    });

            }
        );

    });

}

module.exports = router;