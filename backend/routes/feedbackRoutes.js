const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
  const { attemptId, message } = req.body;

  if (!attemptId || !message) {
    return res.status(400).json({
      success: false,
      message: "Missing feedback."
    });
  }

  db.query(
    "SELECT id FROM feedback WHERE attempt_id = ?",
    [attemptId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      if (rows.length > 0) {
        db.query(
          `
          UPDATE feedback
          SET instructor_feedback = ?
          WHERE attempt_id = ?
          `,
          [message, attemptId],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json(err);
            }

            res.json({
              success: true,
              message: "Feedback updated successfully."
            });
          }
        );
      }

      else {
        db.query(
          `
          INSERT INTO feedback
          (
            attempt_id,
            instructor_feedback
          )
          VALUES (?,?)
          `,
          [attemptId, message],
          (err) => {
            if (err) {
              console.error(err);
              return res.status(500).json(err);
            }

            res.json({
              success: true,
              message: "Feedback saved successfully."
            });
          }
        );
      }
    }
  );
});

module.exports = router;