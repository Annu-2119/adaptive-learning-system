const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const sql = `
    SELECT
      qs.id,
      qs.title,
      qs.topic,
      qs.difficulty,
      qs.course_id,
      c.title AS course
    FROM quiz_sets qs
    JOIN courses c
      ON qs.course_id = c.id
    ORDER BY c.title, qs.id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "Failed to load quiz sets.",
      });
    }

    res.json(results);
  });
});

router.post("/", (req, res) => {
  const {
    title,
    topic,
    difficulty,
    course_id,
  } = req.body;

  if (!title || !topic || !difficulty || !course_id) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  const sql = `
    INSERT INTO quiz_sets
    (
      title,
      topic,
      difficulty,
      course_id
    )
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      title,
      topic,
      difficulty,
      course_id,
    ],
    (err, result) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          success: false,
          message: "Failed to create quiz set.",
        });
      }

      res.json({
        success: true,
        message: "Quiz set created successfully.",
        id: result.insertId,
      });
    }
  );
});

router.put("/:id", (req, res) => {
  const { id } = req.params;

  const {
    title,
    topic,
    difficulty,
    course_id,
  } = req.body;

  if (!title || !topic || !difficulty || !course_id) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  const sql = `
    UPDATE quiz_sets
    SET
      title = ?,
      topic = ?,
      difficulty = ?,
      course_id = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      title,
      topic,
      difficulty,
      course_id,
      id,
    ],
    (err) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          success: false,
          message: "Failed to update quiz set.",
        });
      }

      res.json({
        success: true,
        message: "Quiz set updated successfully.",
      });
    }
  );
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const checkSql = `
    SELECT COUNT(*) AS total
    FROM questions
    WHERE quiz_set_id = ?
  `;

  db.query(checkSql, [id], (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "Failed to check quiz set.",
      });
    }

    if (result[0].total > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete this quiz set because it contains questions.",
      });
    }

    const deleteSql = `
      DELETE FROM quiz_sets
      WHERE id = ?
    `;

    db.query(deleteSql, [id], (err) => {
      if (err) {
        console.error(err);

        return res.status(500).json({
          success: false,
          message: "Failed to delete quiz set.",
        });
      }

      res.json({
        success: true,
        message: "Quiz set deleted successfully.",
      });
    });
  });
});

module.exports = router;