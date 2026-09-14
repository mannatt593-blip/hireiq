const express = require("express");

const {
  createCandidate,
  getCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/candidateController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createCandidate);
router.get("/", getCandidates);
router.get("/:id", getCandidateById);
router.put("/:id", updateCandidate);
router.delete("/:id", deleteCandidate);

module.exports = router;