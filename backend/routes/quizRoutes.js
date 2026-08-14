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
    ORDER BY qs.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Failed to load quiz sets.",
      });
    }

    res.json(result);
  });
});

router.post("/", (req, res) => {
  const { title, topic, difficulty, course_id } = req.body;

  if (!title || !topic || !difficulty || !course_id) {
    return res.status(400).json({
      success: false,
      message: "All fields are required.",
    });
  }

  const sql = `
    INSERT INTO quiz_sets
    (title, topic, difficulty, course_id)
    VALUES (?, ?, ?, ?)
  `;

  db.query(
    sql,
    [title, topic, difficulty, course_id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Failed to add quiz set.",
        });
      }

      res.json({
        success: true,
        id: result.insertId,
      });
    }
  );
});

router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title, topic, difficulty, course_id } = req.body;

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
    [title, topic, difficulty, course_id, id],
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
  db.query(
    "DELETE FROM quiz_sets WHERE id = ?",
    [req.params.id],
    (err) => {
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
    }
  );
});

router.get("/set/:id", (req, res) => {
  db.query(
    "SELECT * FROM quiz_sets WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Failed to load quiz set.",
        });
      }

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Quiz set not found.",
        });
      }

      res.json(result[0]);
    }
  );
});

router.get("/:courseId", (req, res) => {
  const { courseId } = req.params;

  db.query(
    "SELECT * FROM quiz_sets WHERE course_id = ?",
    [courseId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: "Failed to load quiz sets.",
        });
      }

      res.json(result);
    }
  );
});

module.exports = router;