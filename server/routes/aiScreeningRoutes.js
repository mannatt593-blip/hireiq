const express = require("express");

const {
  screenApplication,
  getApplicationScreening,
} = require("../controllers/aiScreeningController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post(
  "/screen/:applicationId",
  screenApplication
);

router.get(
  "/screen/:applicationId",
  getApplicationScreening
);

module.exports = router;