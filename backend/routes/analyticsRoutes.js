const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================================
// INSTRUCTOR ANALYTICS
// ======================================================
//
// DEFINITIONS
//
// totalStudents
//     = unique students who submitted at least one quiz.
//
// totalAttempts
//     = EVERY actual quiz submission.
//
// averageScore
//     = average of the latest attempt for each
//       student + quiz set.
//
// MASTERY DISTRIBUTION
//     = calculated at STUDENT + COURSE level.
//
//     >75%      = Mastered
//     50-75%    = Partially Mastered
//     <50%      = Not Mastered
//
// IMPORTANT:
//
// A student is NOT counted once for every quiz set
// in the mastery pie chart.
//
// Instead, each student contributes ONE mastery result
// for each course they have attempted.
//
// Example:
//
// Student A - SE = 80%
// Student B - DA = 60%
//
// Result:
//
// Mastered           = 1
// Partially Mastered = 1
// Not Mastered       = 0
//
// Pie chart:
//
// Mastered           = 50%
// Partially Mastered = 50%
// Not Mastered       = 0%
//
// ======================================================

router.get("/", (req, res) => {

    const sql = `

        SELECT

            /* ==========================================
               TOTAL UNIQUE STUDENTS
               ========================================== */

            (
                SELECT COUNT(DISTINCT student_id)
                FROM attempts
            ) AS totalStudents,


            /* ==========================================
               TOTAL ACTUAL QUIZ SUBMISSIONS

               Every row in attempts represents one
               submitted quiz.

               Example:

               Student 1 normal       = 1
               Student 1 recommended  = 1
               Student 2 normal       = 1

               Total = 3
               ========================================== */

            (
                SELECT COUNT(*)
                FROM attempts
            ) AS totalAttempts,


            /* ==========================================
               OVERALL AVERAGE SCORE

               First get the latest attempt for every:

                   student + quiz set

               Then average those latest scores.
               ========================================== */

            (
                SELECT
                    ROUND(
                        AVG(latest_attempt.score),
                        2
                    )

                FROM (

                    SELECT
                        a.student_id,
                        a.quiz_set_id,
                        a.score

                    FROM attempts a

                    INNER JOIN (

                        SELECT
                            student_id,
                            quiz_set_id,
                            MAX(id) AS latest_attempt_id

                        FROM attempts

                        GROUP BY
                            student_id,
                            quiz_set_id

                    ) latest

                        ON latest.latest_attempt_id = a.id

                ) latest_attempt
            ) AS averageScore,


            /* ==========================================
               MASTERED STUDENTS

               IMPORTANT:

               Calculate the overall score for each:

                   student + course

               THEN count students whose overall score
               is >75%.

               Each student/course is counted once.
               ========================================== */

            (
                SELECT COUNT(*)

                FROM (

                    SELECT
                        student_id,
                        course_id,

                        ROUND(
                            AVG(score),
                            2
                        ) AS overall_score

                    FROM (

                        SELECT
                            a.student_id,
                            qs.course_id,
                            a.quiz_set_id,
                            a.score

                        FROM attempts a

                        INNER JOIN quiz_sets qs
                            ON qs.id = a.quiz_set_id

                        INNER JOIN (

                            SELECT
                                student_id,
                                quiz_set_id,
                                MAX(id) AS latest_attempt_id

                            FROM attempts

                            GROUP BY
                                student_id,
                                quiz_set_id

                        ) latest

                            ON latest.latest_attempt_id = a.id

                    ) latest_sets

                    GROUP BY
                        student_id,
                        course_id

                    HAVING
                        overall_score > 75

                ) mastered
            ) AS masteredCount,


            /* ==========================================
               PARTIALLY MASTERED

               50% - 75%

               75% IS INCLUDED HERE.

               >75 = Mastered
               50-75 = Partially Mastered
               <50 = Not Mastered
               ========================================== */

            (
                SELECT COUNT(*)

                FROM (

                    SELECT
                        student_id,
                        course_id,

                        ROUND(
                            AVG(score),
                            2
                        ) AS overall_score

                    FROM (

                        SELECT
                            a.student_id,
                            qs.course_id,
                            a.quiz_set_id,
                            a.score

                        FROM attempts a

                        INNER JOIN quiz_sets qs
                            ON qs.id = a.quiz_set_id

                        INNER JOIN (

                            SELECT
                                student_id,
                                quiz_set_id,
                                MAX(id) AS latest_attempt_id

                            FROM attempts

                            GROUP BY
                                student_id,
                                quiz_set_id

                        ) latest

                            ON latest.latest_attempt_id = a.id

                    ) latest_sets

                    GROUP BY
                        student_id,
                        course_id

                    HAVING
                        overall_score >= 50
                        AND overall_score <= 75

                ) partially_mastered
            ) AS partiallyMasteredCount,


            /* ==========================================
               NOT MASTERED

               <50%
               ========================================== */

            (
                SELECT COUNT(*)

                FROM (

                    SELECT
                        student_id,
                        course_id,

                        ROUND(
                            AVG(score),
                            2
                        ) AS overall_score

                    FROM (

                        SELECT
                            a.student_id,
                            qs.course_id,
                            a.quiz_set_id,
                            a.score

                        FROM attempts a

                        INNER JOIN quiz_sets qs
                            ON qs.id = a.quiz_set_id

                        INNER JOIN (

                            SELECT
                                student_id,
                                quiz_set_id,
                                MAX(id) AS latest_attempt_id

                            FROM attempts

                            GROUP BY
                                student_id,
                                quiz_set_id

                        ) latest

                            ON latest.latest_attempt_id = a.id

                    ) latest_sets

                    GROUP BY
                        student_id,
                        course_id

                    HAVING
                        overall_score < 50

                ) not_mastered
            ) AS notMasteredCount,


            /* ==========================================
               RECOMMENDATIONS

               Counts recommendation records.

               Every recommendation generated by the
               recommendation system is counted.
               ========================================== */

            (
                SELECT COUNT(*)
                FROM recommendations
            ) AS recommendations

    `;


    db.query(sql, (err, result) => {

        if (err) {

            console.error(
                "Analytics SQL Error:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to load analytics."
            });
        }


        const row = result[0] || {};


        const masteredCount =
            Number(
                row.masteredCount || 0
            );

        const partiallyMasteredCount =
            Number(
                row.partiallyMasteredCount || 0
            );

        const notMasteredCount =
            Number(
                row.notMasteredCount || 0
            );


        return res.json({

            totalStudents:
                Number(
                    row.totalStudents || 0
                ),

            totalAttempts:
                Number(
                    row.totalAttempts || 0
                ),

            averageScore:
                Number(
                    row.averageScore || 0
                ),

            masteredCount,

            partiallyMasteredCount,

            notMasteredCount,

            /*
             * Compatibility with existing frontend.
             *
             * weakCount means students who are
             * not fully mastered.
             */

            weakCount:
                partiallyMasteredCount +
                notMasteredCount,

            recommendations:
                Number(
                    row.recommendations || 0
                )

        });

    });

});


// ======================================================
// STUDENT SCORE ANALYTICS
// ======================================================
//
// Returns ONE overall score for each student.
//
// The calculation:
//
// 1. Get latest attempt for every student + quiz set.
//
// 2. Group those latest quiz-set scores by:
//       student + course
//
// 3. Calculate the average.
//
// Example:
//
// Student A:
//
// Set 1 = 100
// Set 2 = 80
// Set 3 = 60
//
// Overall = 80%
//
// ======================================================

router.get("/scores", (req, res) => {

    const sql = `

        SELECT

            u.name AS student,

            ROUND(
                AVG(latest_sets.score),
                2
            ) AS score

        FROM users u

        INNER JOIN (

            /* ==========================================
               LATEST ATTEMPT FOR EACH STUDENT + QUIZ SET
               ========================================== */

            SELECT

                a.student_id,

                qs.course_id,

                a.quiz_set_id,

                a.score

            FROM attempts a

            INNER JOIN quiz_sets qs

                ON qs.id = a.quiz_set_id

            INNER JOIN (

                SELECT

                    student_id,
                    quiz_set_id,
                    MAX(id) AS latest_attempt_id

                FROM attempts

                GROUP BY

                    student_id,
                    quiz_set_id

            ) latest

                ON latest.latest_attempt_id = a.id

        ) latest_sets

            ON latest_sets.student_id = u.id


        /* ==========================================
           ONE SCORE PER STUDENT

           If a student has multiple courses, this
           averages their latest quiz-set scores
           across the courses they attempted.
           ========================================== */

        GROUP BY

            u.id,
            u.name


        ORDER BY

            u.name ASC

    `;


    db.query(sql, (err, result) => {

        if (err) {

            console.error(
                "Score analytics error:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to load score data."
            });
        }


        return res.json(

            result.map(row => ({

                student:
                    row.student,

                score:
                    Number(
                        row.score || 0
                    )

            }))

        );

    });

});


module.exports = router;
