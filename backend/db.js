const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database Error:", err);
  } else {
    console.log("✅ MySQL Connected");
    console.log(`📚 Database: ${process.env.DB_NAME}`);
  }
});

module.exports = db;