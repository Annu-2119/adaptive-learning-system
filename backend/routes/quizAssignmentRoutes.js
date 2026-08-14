const express = require("express");
const router = express.Router();
const db = require("../db");

// ======================================================
// GET ALL STUDENTS
// ======================================================

router.get("/students", (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            email
        FROM users
        WHERE role = 'student'
        ORDER BY name ASC
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.error(
                "GET STUDENTS ERROR:",
                err
            );

            return res.status(500).json({
                message: "Failed to load students."
            });
        }

        return res.json(result);

    });

});


// ======================================================
// PUBLISH QUIZ
//
// assignment_type:
//     all
//     selected
//
// selected:
//     student_ids: [1, 2, 5]
//
// all:
//     student_ids: []
//
// assigned_by:
//     instructor user ID
// ======================================================

router.post("/", (req, res) => {

    const {
        quiz_set_id,
        assignment_type,
        student_ids = [],
        assigned_by
    } = req.body;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (!quiz_set_id) {

        return res.status(400).json({
            message: "Quiz set ID is required."
        });

    }


    if (
        assignment_type !== "all" &&
        assignment_type !== "selected"
    ) {

        return res.status(400).json({
            message:
                "Assignment type must be 'all' or 'selected'."
        });

    }


    if (!assigned_by) {

        return res.status(400).json({
            message:
                "Instructor ID is required."
        });

    }


    if (
        assignment_type === "selected" &&
        (
            !Array.isArray(student_ids) ||
            student_ids.length === 0
        )
    ) {

        return res.status(400).json({
            message:
                "Please select at least one student."
        });

    }


    // ==================================================
    // CHECK INSTRUCTOR EXISTS
    // ==================================================

    db.query(
        `
        SELECT
            id,
            name,
            role
        FROM users
        WHERE id = ?
        `,
        [assigned_by],
        (err, instructorResult) => {

            if (err) {

                console.error(
                    "CHECK INSTRUCTOR ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Database error while checking instructor."
                });

            }


            if (
                !instructorResult ||
                instructorResult.length === 0
            ) {

                return res.status(400).json({
                    message:
                        "Instructor account was not found."
                });

            }


            // Optional safety check
            if (
                instructorResult[0].role !== "instructor" &&
                instructorResult[0].role !== "admin"
            ) {

                return res.status(403).json({
                    message:
                        "Only an instructor or administrator can publish quizzes."
                });

            }


            // ==================================================
            // CHECK QUIZ EXISTS
            // ==================================================

            db.query(
                `
                SELECT id
                FROM quiz_sets
                WHERE id = ?
                `,
                [quiz_set_id],
                (err, quizResult) => {

                    if (err) {

                        console.error(
                            "CHECK QUIZ ERROR:",
                            err
                        );

                        return res.status(500).json({
                            message:
                                "Database error."
                        });

                    }


                    if (
                        !quizResult ||
                        quizResult.length === 0
                    ) {

                        return res.status(404).json({
                            message:
                                "Quiz set not found."
                        });

                    }


                    // ==================================================
                    // CHECK SELECTED STUDENTS
                    // ==================================================

                    if (
                        assignment_type === "selected"
                    ) {

                        const placeholders =
                            student_ids
                                .map(() => "?")
                                .join(",");


                        db.query(
                            `
                            SELECT id
                            FROM users
                            WHERE role = 'student'
                            AND id IN (${placeholders})
                            `,
                            student_ids,
                            (studentErr, studentResult) => {

                                if (studentErr) {

                                    console.error(
                                        "CHECK STUDENTS ERROR:",
                                        studentErr
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Failed to validate selected students."
                                    });

                                }


                                if (
                                    studentResult.length !==
                                    student_ids.length
                                ) {

                                    return res.status(400).json({
                                        message:
                                            "One or more selected students are invalid."
                                    });

                                }


                                publishSelectedStudents();

                            }
                        );

                    } else {

                        publishToAllStudents();

                    }


                    // ==================================================
                    // PUBLISH TO ALL STUDENTS
                    // ==================================================

                    function publishToAllStudents() {

                        // Remove previous assignment
                        db.query(
                            `
                            DELETE FROM quiz_assignments
                            WHERE quiz_set_id = ?
                            `,
                            [quiz_set_id],
                            (deleteErr) => {

                                if (deleteErr) {

                                    console.error(
                                        "DELETE OLD ASSIGNMENT ERROR:",
                                        deleteErr
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Failed to update quiz assignment."
                                    });

                                }


                                db.query(
                                    `
                                    INSERT INTO quiz_assignments
                                    (
                                        quiz_set_id,
                                        assignment_type,
                                        student_id,
                                        assigned_by
                                    )
                                    VALUES
                                    (?, 'all', NULL, ?)
                                    `,
                                    [
                                        quiz_set_id,
                                        assigned_by
                                    ],
                                    (insertErr) => {

                                        if (insertErr) {

                                            console.error(
                                                "PUBLISH ALL ERROR:",
                                                insertErr
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Failed to publish quiz."
                                            });

                                        }


                                        return res.json({

                                            success: true,

                                            message:
                                                "Quiz published to all students.",

                                            assignment_type:
                                                "all",

                                            assigned_by:
                                                Number(assigned_by)

                                        });

                                    }
                                );

                            }
                        );

                    }


                    // ==================================================
                    // PUBLISH TO SELECTED STUDENTS
                    // ==================================================

                    function publishSelectedStudents() {

                        // Remove previous assignment
                        db.query(
                            `
                            DELETE FROM quiz_assignments
                            WHERE quiz_set_id = ?
                            `,
                            [quiz_set_id],
                            (deleteErr) => {

                                if (deleteErr) {

                                    console.error(
                                        "DELETE OLD ASSIGNMENT ERROR:",
                                        deleteErr
                                    );

                                    return res.status(500).json({
                                        message:
                                            "Failed to update quiz assignment."
                                    });

                                }


                                const values =
                                    student_ids.map(
                                        studentId => [
                                            quiz_set_id,
                                            "selected",
                                            studentId,
                                            assigned_by
                                        ]
                                    );


                                db.query(
                                    `
                                    INSERT INTO quiz_assignments
                                    (
                                        quiz_set_id,
                                        assignment_type,
                                        student_id,
                                        assigned_by
                                    )
                                    VALUES ?
                                    `,
                                    [values],
                                    (insertErr) => {

                                        if (insertErr) {

                                            console.error(
                                                "PUBLISH SELECTED ERROR:",
                                                insertErr
                                            );

                                            return res.status(500).json({
                                                message:
                                                    "Failed to publish quiz."
                                            });

                                        }


                                        return res.json({

                                            success: true,

                                            message:
                                                "Quiz published to selected students.",

                                            assignment_type:
                                                "selected",

                                            student_count:
                                                student_ids.length,

                                            assigned_by:
                                                Number(assigned_by)

                                        });

                                    }
                                );

                            }
                        );

                    }

                }
            );

        }
    );

});


// ======================================================
// GET ASSIGNMENT INFORMATION FOR A QUIZ
// ======================================================

router.get("/quiz/:quizSetId", (req, res) => {

    const quizSetId =
        req.params.quizSetId;


    const sql = `
        SELECT
            qa.id,
            qa.quiz_set_id,
            qa.assignment_type,
            qa.student_id,
            qa.assigned_by,
            u.name AS student_name,
            u.email AS student_email,
            instructor.name AS instructor_name,
            qa.created_at

        FROM quiz_assignments qa

        LEFT JOIN users u
            ON u.id = qa.student_id

        LEFT JOIN users instructor
            ON instructor.id = qa.assigned_by

        WHERE qa.quiz_set_id = ?

        ORDER BY
            u.name ASC
    `;


    db.query(
        sql,
        [quizSetId],
        (err, result) => {

            if (err) {

                console.error(
                    "GET QUIZ ASSIGNMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    message:
                        "Failed to load quiz assignment."
                });

            }


            return res.json(result);

        }
    );

});


module.exports = router;