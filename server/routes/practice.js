const express = require("express");
const router = express.Router();
const {
  getNextQuestion,
  analyzeAnswer,
  savePracticeSession,
  getPracticeHistory
} = require("../controllers/practiceController");

router.post("/next-question", getNextQuestion);
router.post("/analyze-answer", analyzeAnswer);
router.post("/save-session", savePracticeSession);
router.get("/history/:userId", getPracticeHistory);

module.exports = router;
