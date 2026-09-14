const express = require("express");

const {
  createInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
} = require("../controllers/interviewController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createInterview);
router.get("/", getInterviews);
router.get("/:id", getInterviewById);
router.put("/:id", updateInterview);
router.delete("/:id", deleteInterview);

module.exports = router;