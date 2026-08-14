const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {

  const sql = `
    SELECT *
    FROM quiz_sets
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(result);

  });

});

router.post("/", (req, res) => {

  const {
    course_id,
    title,
    difficulty
  } = req.body;

  db.query(
    `
    INSERT INTO quiz_sets
    (
      course_id,
      title,
      difficulty
    )
    VALUES
    (?,?,?)
    `,
    [
      course_id,
      title,
      difficulty || "easy"
    ],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        quizSetId: result.insertId
      });

    }
  );

});

router.put("/:id", (req, res) => {

  const {
    title,
    difficulty
  } = req.body;

  db.query(
    `
    UPDATE quiz_sets
    SET
      title = ?,
      difficulty = ?
    WHERE id = ?
    `,
    [
      title,
      difficulty,
      req.params.id
    ],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        message: "Quiz Set Updated"
      });

    }
  );

});

router.delete("/:id", (req, res) => {

  db.query(
    `
    DELETE FROM quiz_sets
    WHERE id = ?
    `,
    [req.params.id],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        message: "Quiz Set Deleted"
      });

    }
  );

});

module.exports = router;