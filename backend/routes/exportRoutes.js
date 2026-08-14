const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================================
// EXPORT STUDENT PERFORMANCE REPORT
// ======================================================
//
// CSV format:
//
// Student | Course | Overall Score | Mastery
//
// Overall Score:
//     Average of the LATEST attempt for each
//     quiz set belonging to the student + course.
//
// Mastery:
//     >75%       = Mastered
//     50-75%     = Partially Mastered
//     <50%       = Not Mastered
//
// IMPORTANT:
// If a student reattempts a recommended quiz,
// the latest attempt replaces the older attempt
// for that quiz set when calculating the overall score.
//
// ======================================================

router.get("/attempts", (req, res) => {

    const sql = `

        SELECT

            u.name AS student,

            c.title AS course,

            ROUND(
                AVG(a.score),
                2
            ) AS overall_score

        FROM attempts a


        INNER JOIN users u
            ON u.id = a.student_id


        INNER JOIN quiz_sets qs
            ON qs.id = a.quiz_set_id


        INNER JOIN courses c
            ON c.id = qs.course_id


        /* ==========================================
           ONLY THE LATEST ATTEMPT FOR EACH
           STUDENT + QUIZ SET
           ========================================== */

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


        /* ==========================================
           GROUP BY STUDENT + COURSE

           This produces one row per:

               Student + Course
           ========================================== */

        GROUP BY

            a.student_id,
            u.name,
            c.id,
            c.title


        ORDER BY

            u.name ASC,
            c.title ASC

    `;


    db.query(sql, (err, result) => {

        if (err) {

            console.error(
                "CSV export SQL error:",
                err
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to generate student performance report."
            });

        }


        // ==================================================
        // CSV HEADER
        // ==================================================

        let csv =
            "Student,Course,Overall Score,Mastery\n";


        // ==================================================
        // BUILD CSV ROWS
        // ==================================================

        result.forEach(row => {

            const score =
                Number(row.overall_score || 0);


            // ----------------------------------------------
            // MASTERY RULES
            // ----------------------------------------------

            let mastery;

            if (score > 75) {

                mastery = "Mastered";

            } else if (score >= 50) {

                mastery = "Partially Mastered";

            } else {

                mastery = "Not Mastered";

            }


            // ----------------------------------------------
            // Escape CSV values safely
            // ----------------------------------------------

            const student =
                String(row.student || "")
                    .replace(/"/g, '""');

            const course =
                String(row.course || "")
                    .replace(/"/g, '""');


            csv +=
                `"${student}",` +
                `"${course}",` +
                `${score.toFixed(2)}%,` +
                `"${mastery}"\n`;

        });


        // ==================================================
        // SEND CSV FILE
        // ==================================================

        res.header(
            "Content-Type",
            "text/csv; charset=utf-8"
        );

        res.attachment(
            "student-performance-report.csv"
        );

        res.send(csv);

    });

});


module.exports = router;