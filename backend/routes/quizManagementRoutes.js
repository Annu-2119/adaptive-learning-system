const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const { quiz_set_id } = req.query;

  let sql = `
    SELECT
      q.id,
      q.question,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_answer,
      q.topic,
      q.quiz_set_id,
      qs.title AS quiz_title
    FROM questions q
    LEFT JOIN quiz_sets qs
      ON q.quiz_set_id = qs.id
  `;

  let params = [];

  if (quiz_set_id) {
    sql += " WHERE q.quiz_set_id = ?";
    params.push(quiz_set_id);
  }

  sql += " ORDER BY q.id DESC";

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("GET QUESTIONS ERROR:", err);
      return res.status(500).json({
        message: "Database error while fetching questions",
      });
    }

    res.json(result);
  });
});

router.get("/:id", (req, res) => {
  db.query(
    `
    SELECT *
    FROM questions
    WHERE id = ?
    `,
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Error fetching question",
        });
      }

      if (!result || result.length === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }

      res.json(result[0]);
    }
  );
});

router.post("/", (req, res) => {
  const {
    quiz_set_id,
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    topic = "General",
  } = req.body;

  if (
    !quiz_set_id ||
    !question?.trim() ||
    !option_a?.trim() ||
    !option_b?.trim() ||
    !option_c?.trim() ||
    !option_d?.trim() ||
    !correct_answer?.trim()
  ) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  db.query(
    `
    INSERT INTO questions
    (
      quiz_set_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      topic
    )
    VALUES (?,?,?,?,?,?,?,?)
    `,
    [
      quiz_set_id,
      question.trim(),
      option_a.trim(),
      option_b.trim(),
      option_c.trim(),
      option_d.trim(),
      correct_answer.trim(),
      topic.trim(),
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to create question",
        });
      }

      res.status(201).json({
        message: "Question created successfully",
        id: result.insertId,
      });
    }
  );
});

router.put("/:id", (req, res) => {
  const {
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_answer,
    topic,
  } = req.body;

  db.query(
    `
    UPDATE questions
    SET
      question = ?,
      option_a = ?,
      option_b = ?,
      option_c = ?,
      option_d = ?,
      correct_answer = ?,
      topic = ?
    WHERE id = ?
    `,
    [
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      topic,
      req.params.id,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to update question",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }

      res.json({
        message: "Question updated successfully",
      });
    }
  );
});

router.delete("/:id", (req, res) => {
  db.query(
    `
    DELETE FROM questions
    WHERE id = ?
    `,
    [req.params.id],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({
          message: "Failed to delete question",
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          message: "Question not found",
        });
      }

      res.json({
        message: "Question deleted successfully",
      });
    }
  );
});

module.exports = router;