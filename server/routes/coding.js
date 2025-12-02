const express = require("express");
const router = express.Router();
const {
  runCode,
  submitProblem,
  getAttemptHistory
} = require("../controllers/codingController");

router.post("/run", runCode);
router.post("/submit", submitProblem);
router.get("/history/:userId", getAttemptHistory);

module.exports = router;
