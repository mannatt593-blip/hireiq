const express = require("express");

const {
  getDashboardAnalytics,
  getHiringTrends,
} = require("../controllers/analyticsController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", getDashboardAnalytics);

router.get("/hiring-trends", getHiringTrends);

module.exports = router;