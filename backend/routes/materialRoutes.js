const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/materials");
  },

  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
});

router.post("/", upload.single("file"), (req, res) => {
  const { title, course_id } = req.body;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const sql = `
    INSERT INTO course_materials
    (
      course_id,
      title,
      file_name,
      file_path
    )
    VALUES (?,?,?,?)
  `;

  db.query(
    sql,
    [
      course_id,
      title,
      req.file.originalname,
      req.file.filename,
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json(err);
      }

      res.json({
        success: true,
        message: "Material uploaded successfully.",
      });
    }
  );
});

router.get("/", (req, res) => {
  const sql = `
    SELECT
      cm.*,
      c.title AS course
    FROM course_materials cm
    JOIN courses c
      ON cm.course_id = c.id
    ORDER BY uploaded_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);

    res.json(result);
  });
});

router.get("/course/:courseId", (req, res) => {
  const { courseId } = req.params;

  db.query(
    `
    SELECT *
    FROM course_materials
    WHERE course_id = ?
    `,
    [courseId],
    (err, result) => {
      if (err) return res.status(500).json(err);

      res.json(result);
    }
  );
});

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM course_materials WHERE id=?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Material not found",
        });
      }

      const material = result[0];

      // Full path to uploaded file
      const filePath = path.join(
        __dirname,
        "../uploads/materials",
        material.file_path
      );

      // Delete file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete database record
      db.query(
        "DELETE FROM course_materials WHERE id=?",
        [id],
        (err2) => {
          if (err2) return res.status(500).json(err2);

          res.json({
            success: true,
            message: "Material deleted successfully",
          });
        }
      );
    }
  );
});

module.exports = router;