const express = require("express");
const cors = require("cors");
require("dotenv").config({ override: true });

const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const aiScreeningRoutes = require("./routes/aiScreeningRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const db = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;

/* =================================
   MIDDLEWARE
================================= */

app.use(cors());
app.use(express.json());

/* =================================
   ROUTES
================================= */

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/candidates", candidateRoutes);
app.use("/api/applications", applicationRoutes);
app.use(
  "/api/ai",
  aiScreeningRoutes
);
app.use("/api/resumes", resumeRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
/* =================================
   DATABASE TEST
================================= */

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");

    res.json({
      success: true,
      message: "PostgreSQL connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database test error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

/* =================================
   SERVER
================================= */

app.listen(PORT, () => {
  console.log(`HireIQ backend running on port ${PORT}`);
});