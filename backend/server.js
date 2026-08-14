const express = require("express");
const cors = require("cors");
const path = require("path"); 
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const quizRoutes = require("./routes/quizRoutes");
const questionRoutes = require("./routes/questionRoutes");
const submitQuizRoute = require("./routes/submitQuizRoute");
const resultRoutes = require("./routes/resultRoutes");
const instructorRoutes = require("./routes/instructorRoutes");
const gradingRoutes = require("./routes/gradingRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const exportRoutes = require("./routes/exportRoutes");
const quizManagementRoutes = require("./routes/quizManagementRoutes");
const quizSetManagementRoutes = require("./routes/quizSetManagementRoutes");
const studentDashboardRoutes = require("./routes/studentDashboardRoutes");
const quizSetRoutes = require("./routes/quizSetRoutes");
const materialRoutes = require("./routes/materialRoutes");
const quizAssignmentRoutes = require("./routes/quizAssignmentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/submitQuiz", submitQuizRoute);
app.use("/api/results", resultRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/grading", gradingRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/quiz-management", quizManagementRoutes);
app.use("/api/quiz-set-management", quizSetManagementRoutes);
app.use("/api/student-dashboard", studentDashboardRoutes);
app.use("/api/quizsets", quizSetRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/quiz-assignments", quizAssignmentRoutes);

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
