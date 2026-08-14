const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { name, email, role } = req.body;

  try {
    let password =
      role === "student"
        ? "student123"
        : "2113";

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql =
      "INSERT INTO users(name, email, password, role) VALUES (?, ?, ?, ?)";

    db.query(
      sql,
      [name, email, hashedPassword, role],
      (err, result) => {
        if (err) {
          console.error(err);

          return res.status(400).json({
            message: "Email already exists or registration failed",
          });
        }

        res.status(201).json({
          message: "Registration Successful",
          user: {
            id: result.insertId,
            name,
            email,
            role,
          },
        });
      }
    );
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  const sql =
    "SELECT * FROM users WHERE email = ?";

  db.query(sql, [email], async (err, result) => {
    if (err) {
      console.error(err);

      return res.status(500).json({
        message: "Database Error",
      });
    }

    if (result.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = result[0];

    const valid = await bcrypt.compare(
      password,
      user.password
    );

    if (!valid) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  });
};