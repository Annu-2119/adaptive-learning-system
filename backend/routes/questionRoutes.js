const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/course/:courseId", (req, res) => {
  const { courseId } = req.params;

  const sql = `
    SELECT q.*
    FROM questions q
    JOIN quiz_sets qs ON q.quiz_set_id = qs.id
    WHERE qs.course_id = ?
  `;

  db.query(sql, [courseId], (err, result) => {
    if (err) {
      console.error("GET /course error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(result);
  });
});

router.get("/quizset/:quizSetId", (req, res) => {
  const { quizSetId } = req.params;

  const sql = `
    SELECT *
    FROM questions
    WHERE quiz_set_id = ?
  `;

  db.query(sql, [quizSetId], (err, result) => {
    if (err) {
      console.error("GET /quizset error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(result);
  });
});

router.post("/", (req, res) => {
  const {
    quiz_set_id,
    question_text,
    question_type,
    correct_answer,
    marks,
    topic,
  } = req.body;

  if (!quiz_set_id || !question_text) {
    return res.status(400).json({
      error: "quiz_set_id and question_text are required",
    });
  }

  const sql = `
    INSERT INTO questions
    (quiz_set_id, question_text, question_type, correct_answer, marks, topic)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      quiz_set_id,
      question_text,
      question_type,
      correct_answer,
      marks,
      topic,
    ],
    (err, result) => {
      if (err) {
        console.error("POST /questions error:", err);
        return res.status(500).json({ error: "Database error" });
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

  const {
    question_text,
    question_type,
    correct_answer,
    marks,
    topic,
  } = req.body;

  const sql = `
    UPDATE questions
    SET
      question_text = ?,
      question_type = ?,
      correct_answer = ?,
      marks = ?,
      topic = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      question_text,
      question_type,
      correct_answer,
      marks,
      topic,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("PUT /questions error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({
        success: true,
        affectedRows: result.affectedRows,
      });
    }
  );
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM questions WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.error("DELETE /questions error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      res.json({
        success: true,
        affectedRows: result.affectedRows,
      });
    }
  );
});

module.exports = router;