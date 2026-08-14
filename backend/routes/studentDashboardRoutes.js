const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:studentId", (req, res) => {
    const { studentId } = req.params;

    const sql = `
        SELECT
            c.id AS course_id,
            c.title AS course,

            qs.id AS quiz_set_id,
            qs.title AS quiz_set,

            a.id AS attempt_id,
            a.score,
            a.mastery_status,
            a.created_at,

            r.weak_topic,
            r.recommended_level,
            r.recommended_quiz,
            r.recommended_quiz_id,

            f.instructor_feedback AS feedback

        FROM attempts a

        INNER JOIN (
            SELECT
                quiz_set_id,
                MAX(id) AS latest_attempt
            FROM attempts
            WHERE student_id = ?
            GROUP BY quiz_set_id
        ) latest
            ON latest.latest_attempt = a.id

        INNER JOIN quiz_sets qs
            ON qs.id = a.quiz_set_id

        INNER JOIN courses c
            ON c.id = qs.course_id

        LEFT JOIN recommendations r
            ON r.attempt_id = a.id
            AND r.id = (
                SELECT MAX(r2.id)
                FROM recommendations r2
                WHERE r2.attempt_id = a.id
            )

        LEFT JOIN feedback f
            ON f.attempt_id = a.id
            AND f.id = (
                SELECT MAX(f2.id)
                FROM feedback f2
                WHERE f2.attempt_id = a.id
            )

        WHERE a.student_id = ?

        ORDER BY
            c.id ASC,
            qs.id ASC
    `;

    db.query(
        sql,
        [studentId, studentId],
        (err, results) => {

            if (err) {
                console.error(
                    "Dashboard SQL Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to load dashboard."
                });
            }

            const courses = {};

            results.forEach((row) => {

                if (!courses[row.course_id]) {

                    courses[row.course_id] = {
                        course_id: row.course_id,
                        course: row.course,
                        quizSets: [],
                        latestAttempt: row
                    };

                }

                courses[row.course_id]
                    .quizSets
                    .push(row);

                if (
                    new Date(row.created_at) >
                    new Date(
                        courses[row.course_id]
                            .latestAttempt
                            .created_at
                    )
                ) {
                    courses[row.course_id]
                        .latestAttempt = row;
                }
            });

            const dashboard =
                Object.values(courses).map(
                    (course) => {

                        const totalScore =
                            course.quizSets.reduce(
                                (sum, quiz) => {

                                    return (
                                        sum +
                                        Number(
                                            quiz.score || 0
                                        )
                                    );

                                },
                                0
                            );

                        const overallScore =
                            course.quizSets.length > 0
                                ? Number(
                                    (
                                        totalScore /
                                        course.quizSets.length
                                    ).toFixed(2)
                                )
                                : 0;

                        let masteryLabel;
                        let badgeColor;

                        if (overallScore > 75) {

                            masteryLabel =
                                "Mastered";

                            badgeColor =
                                "green";

                        }
                        else if (
                            overallScore >= 50
                        ) {

                            masteryLabel =
                                "Partially Mastered";

                            badgeColor =
                                "blue";

                        }
                        else {

                            masteryLabel =
                                "Not Mastered";

                            badgeColor =
                                "red";
                        }

                        let recommendedLevel;

                        if (overallScore > 75) {

                            recommendedLevel =
                                "Hard";

                        }
                        else if (
                            overallScore >= 50
                        ) {

                            recommendedLevel =
                                "Medium";

                        }
                        else {

                            recommendedLevel =
                                "Easy";
                        }

                        const weakQuizzes =
                            course.quizSets
                                .filter(
                                    (quiz) =>
                                        Number(
                                            quiz.score || 0
                                        ) < 75
                                )
                                .sort(
                                    (a, b) => {

                                        const scoreDifference =
                                            Number(
                                                a.score || 0
                                            ) -
                                            Number(
                                                b.score || 0
                                            );

                                        if (
                                            scoreDifference !== 0
                                        ) {
                                            return scoreDifference;
                                        }

                                        return (
                                            Number(
                                                a.quiz_set_id
                                            ) -
                                            Number(
                                                b.quiz_set_id
                                            )
                                        );
                                    }
                                );


                        let recommendedQuiz = null;
                        let recommendedQuizId = null;
                        let weakTopic = null;


                        if (
                            weakQuizzes.length > 0
                        ) {

                            const weakestQuiz =
                                weakQuizzes[0];

                            recommendedQuiz =
                                weakestQuiz.quiz_set;

                            recommendedQuizId =
                                weakestQuiz.quiz_set_id;

                            weakTopic =
                                weakestQuiz.weak_topic ||
                                null;
                        }

                        if (
                            weakQuizzes.length === 0
                        ) {

                            recommendedQuiz =
                                null;

                            recommendedQuizId =
                                null;

                            weakTopic =
                                null;
                        }


                        const latest =
                            course.latestAttempt;


                        return {

                            course_id:
                                course.course_id,

                            course:
                                course.course,

                            score:
                                overallScore,

                            progress:
                                overallScore,

                            mastery_status:
                                masteryLabel,

                            mastery_label:
                                masteryLabel,

                            mastery_badge:
                                badgeColor,

                            weak_topic:
                                weakTopic,

                            recommended_level:
                                recommendedLevel,

                            recommended_quiz:
                                recommendedQuiz,

                            recommended_quiz_id:
                                recommendedQuizId,

                            attempt_id:
                                latest
                                    ? latest.attempt_id
                                    : null,

                            feedback:
                                latest
                                    ? latest.feedback
                                    : null,

                            created_at:
                                latest
                                    ? latest.created_at
                                    : null,

                            quizSets:
                                course.quizSets.map(
                                    (quiz) => ({

                                        quiz_set_id:
                                            quiz.quiz_set_id,

                                        quiz_set:
                                            quiz.quiz_set,

                                        attempt_id:
                                            quiz.attempt_id,

                                        score:
                                            Number(
                                                quiz.score || 0
                                            )
                                    })
                                )
                        };
                    }
                );

            return res.json({
                success: true,
                dashboard
            });
        }
    );
});

module.exports = router;