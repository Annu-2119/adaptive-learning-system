const express = require("express");
const router = express.Router();
const db = require("../db");


// ======================================================
// INSTRUCTOR - STUDENT PERFORMANCE
// ======================================================
//
// One row is returned for:
//
//     Student + Course
//
// Example:
//
//     Vaish + Software Engineering
//     Vaish + Data Analytics
//
// These are treated as separate performance records.
//
// Score:
//
//     Average of the latest attempt for every
//     quiz set belonging to that course.
//
// Example:
//
//     Set 1 = 100
//     Set 2 = 100
//     Set 3 = 100  <-- latest reattempt
//     Set 4 = 100
//     Set 5 = 0
//
//     Score = 80%
//
// Mastery:
//
//     >75%      = Mastered
//     50-75%    = Partially Mastered
//     <50%      = Not Mastered
//
// ======================================================

router.get("/attempts", (req, res) => {

    const sql = `

        SELECT

            u.name AS student_name,

            a.student_id,

            c.id AS course_id,

            c.title AS course,


            /* ==========================================
               NUMBER OF DIFFERENT QUIZ SETS ATTEMPTED

               A reattempt of the same quiz set does NOT
               increase this number.
               ========================================== */

            COUNT(DISTINCT qs.id) AS attempted_sets,


            /* ==========================================
               COURSE PERFORMANCE SCORE

               Only latest attempt for each student +
               quiz set reaches this AVG().
               ========================================== */

            ROUND(
                AVG(a.score),
                2
            ) AS score,


            /* ==========================================
               LATEST ATTEMPT DATE
               ========================================== */

            MAX(a.created_at) AS latest_created_at


        FROM attempts a


        INNER JOIN users u

            ON u.id = a.student_id


        INNER JOIN quiz_sets qs

            ON qs.id = a.quiz_set_id


        INNER JOIN courses c

            ON c.id = qs.course_id


        /* ==========================================
           LATEST ATTEMPT FOR EACH
           STUDENT + QUIZ SET
           ========================================== */

        INNER JOIN (

            SELECT

                student_id,
                quiz_set_id,
                MAX(id) AS latest_id

            FROM attempts

            GROUP BY

                student_id,
                quiz_set_id

        ) latest

            ON latest.latest_id = a.id


        GROUP BY

            u.id,
            u.name,

            a.student_id,

            c.id,
            c.title


        ORDER BY

            MAX(a.created_at) DESC,

            u.name ASC

    `;


    db.query(
        sql,
        (err, result) => {

            if (err) {

                console.error(
                    "Instructor performance SQL error:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to load student performance."

                });

            }


            if (!result || result.length === 0) {

                return res.json([]);

            }


            /* ==========================================
               BUILD INITIAL PERFORMANCE DATA
               ========================================== */

            const performance =
                result.map(row => {

                    const score =
                        Number(
                            row.score || 0
                        );


                    /* ==================================
                       MASTERY RULES

                       >75       Mastered
                       50-75     Partially Mastered
                       <50       Not Mastered
                       ================================== */

                    let mastery_status;


                    if (score > 75) {

                        mastery_status =
                            "Mastered";

                    } else if (score >= 50) {

                        mastery_status =
                            "Partially Mastered";

                    } else {

                        mastery_status =
                            "Not Mastered";

                    }


                    return {

                        student_name:
                            row.student_name,

                        student_id:
                            Number(
                                row.student_id
                            ),

                        course_id:
                            Number(
                                row.course_id
                            ),

                        course:
                            row.course,


                        attempted_sets:
                            Number(
                                row.attempted_sets || 0
                            ),


                        score,


                        mastery_status,


                        /* =================================
                           Recommendation fields
                           ================================= */

                        weak_topic:
                            null,

                        recommended_level:
                            null,

                        recommended_quiz:
                            null,

                        recommended_quiz_id:
                            null,


                        /* =================================
                           This ID will become the latest
                           course attempt ID.

                           Used by:

                           /instructor/grade/[attemptId]
                           ================================= */

                        id:
                            null,


                        feedback:
                            ""

                    };

                });


            // ==================================================
            // FIND LATEST ATTEMPT FOR EACH STUDENT + COURSE
            // ==================================================

            const latestCourseSql = `

                SELECT

                    a.student_id,

                    qs.course_id,

                    MAX(a.id) AS attempt_id

                FROM attempts a


                INNER JOIN quiz_sets qs

                    ON qs.id = a.quiz_set_id


                GROUP BY

                    a.student_id,
                    qs.course_id

            `;


            db.query(
                latestCourseSql,
                (latestErr, latestRows) => {

                    if (latestErr) {

                        console.error(
                            "Latest course attempt error:",
                            latestErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to load latest course attempts."

                        });

                    }


                    /* ======================================
                       ATTACH LATEST COURSE ATTEMPT ID
                       ====================================== */

                    performance.forEach(row => {

                        const latest =
                            latestRows.find(item =>

                                Number(
                                    item.student_id
                                ) ===
                                Number(
                                    row.student_id
                                )

                                &&

                                Number(
                                    item.course_id
                                ) ===
                                Number(
                                    row.course_id
                                )

                            );


                        if (latest) {

                            row.id =
                                Number(
                                    latest.attempt_id
                                );

                        }

                    });


                    // =========================================
                    // LOAD RECOMMENDATIONS
                    // =========================================

                    const recommendationSql = `

                        SELECT

                            a.student_id,

                            qs.course_id,

                            r.weak_topic,

                            r.recommended_level,

                            r.recommended_quiz,

                            r.recommended_quiz_id,

                            r.attempt_id,

                            r.id AS recommendation_id


                        FROM recommendations r


                        INNER JOIN attempts a

                            ON a.id = r.attempt_id


                        INNER JOIN quiz_sets qs

                            ON qs.id = a.quiz_set_id


                        INNER JOIN (

                            SELECT

                                a2.student_id,

                                qs2.course_id,

                                MAX(a2.id)
                                    AS latest_attempt_id

                            FROM attempts a2


                            INNER JOIN quiz_sets qs2

                                ON qs2.id =
                                   a2.quiz_set_id


                            GROUP BY

                                a2.student_id,

                                qs2.course_id

                        ) latest

                            ON latest.latest_attempt_id =
                               a.id


                        ORDER BY

                            r.id DESC

                    `;


                    db.query(
                        recommendationSql,
                        (recErr, recommendations) => {

                            if (recErr) {

                                console.error(
                                    "Recommendation lookup error:",
                                    recErr
                                );

                                /*
                                 * Do not fail the entire
                                 * Student Performance page
                                 * if recommendation data
                                 * has an issue.
                                 */

                                return loadFeedbackAndRespond(
                                    performance
                                );

                            }


                            /* ==================================
                               ATTACH RECOMMENDATION

                               The latest recommendation
                               for that student + course
                               is used.
                               ================================== */

                            performance.forEach(row => {

                                const rec =
                                    recommendations.find(
                                        item =>

                                            Number(
                                                item.student_id
                                            ) ===
                                            Number(
                                                row.student_id
                                            )

                                            &&

                                            Number(
                                                item.course_id
                                            ) ===
                                            Number(
                                                row.course_id
                                            )
                                    );


                                if (rec) {

                                    row.weak_topic =
                                        rec.weak_topic ||
                                        null;

                                    row.recommended_level =
                                        rec.recommended_level ||
                                        null;

                                    row.recommended_quiz =
                                        rec.recommended_quiz ||
                                        null;

                                    row.recommended_quiz_id =
                                        rec.recommended_quiz_id ||
                                        null;

                                }

                            });


                            loadFeedbackAndRespond(
                                performance
                            );

                        }
                    );


                    // =========================================
                    // FEEDBACK FUNCTION
                    // =========================================

                    function loadFeedbackAndRespond(
                        performanceData
                    ) {

                        const feedbackSql = `

                            SELECT

                                f.attempt_id,

                                f.instructor_feedback


                            FROM feedback f


                            INNER JOIN (

                                SELECT

                                    a.student_id,

                                    qs.course_id,

                                    MAX(a.id)
                                        AS latest_attempt_id

                                FROM attempts a


                                INNER JOIN quiz_sets qs

                                    ON qs.id =
                                       a.quiz_set_id


                                GROUP BY

                                    a.student_id,

                                    qs.course_id

                            ) latest

                                ON latest.latest_attempt_id =
                                   f.attempt_id


                            INNER JOIN (

                                SELECT

                                    attempt_id,

                                    MAX(id)
                                        AS latest_feedback_id

                                FROM feedback

                                GROUP BY
                                    attempt_id

                            ) lf

                                ON lf.latest_feedback_id =
                                   f.id

                        `;


                        db.query(
                            feedbackSql,
                            (
                                feedbackErr,
                                feedbackRows
                            ) => {

                                if (feedbackErr) {

                                    console.error(
                                        "Feedback lookup error:",
                                        feedbackErr
                                    );

                                    /*
                                     * Still return performance
                                     * data even if feedback
                                     * cannot be loaded.
                                     */

                                    return res.json(
                                        performanceData
                                    );

                                }


                                /* ==============================
                                   ATTACH LATEST FEEDBACK
                                   ============================== */

                                performanceData.forEach(
                                    row => {

                                        const feedback =
                                            feedbackRows.find(
                                                item =>

                                                    Number(
                                                        item.attempt_id
                                                    ) ===
                                                    Number(
                                                        row.id
                                                    )
                                            );


                                        if (feedback) {

                                            row.feedback =
                                                feedback
                                                    .instructor_feedback ||
                                                "";

                                        }

                                    }
                                );


                                return res.json(
                                    performanceData
                                );

                            }
                        );

                    }

                }
            );

        }
    );

});


module.exports = router;