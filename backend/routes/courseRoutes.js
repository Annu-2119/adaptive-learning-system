const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {

    db.query(
        `
        SELECT *
        FROM courses
        ORDER BY id DESC
        `,
        (err, result) => {

            if (err) {

                console.error(
                    "GET courses error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to load courses."
                });
            }

            res.json(result);

        }
    );

});

router.post("/", (req, res) => {

    const {
        title,
        description
    } = req.body;


    if (!title || !title.trim()) {

        return res.status(400).json({
            success: false,
            message:
                "Course title is required."
        });
    }


    db.query(
        `
        INSERT INTO courses
        (
            title,
            description
        )

        VALUES (?, ?)
        `,
        [
            title.trim(),
            description || ""
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "POST course error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to create course."
                });
            }


            res.status(201).json({
                success: true,
                message:
                    "Course created successfully.",
                id: result.insertId
            });

        }
    );

});

router.put("/:id", (req, res) => {

    const {
        title,
        description
    } = req.body;


    if (!title || !title.trim()) {

        return res.status(400).json({
            success: false,
            message:
                "Course title is required."
        });
    }


    db.query(
        `
        UPDATE courses

        SET
            title = ?,
            description = ?

        WHERE id = ?
        `,
        [
            title.trim(),
            description || "",
            req.params.id
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "PUT course error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to update course."
                });
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Course not found."
                });
            }


            res.json({
                success: true,
                message:
                    "Course updated successfully."
            });

        }
    );

});

router.delete("/:id", (req, res) => {

    db.query(
        `
        DELETE FROM courses
        WHERE id = ?
        `,
        [req.params.id],
        (err, result) => {

            if (err) {

                console.error(
                    "DELETE course error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to delete course."
                });
            }


            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Course not found."
                });
            }


            res.json({
                success: true,
                message:
                    "Course deleted successfully."
            });

        }
    );

});


module.exports = router;