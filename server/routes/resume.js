const express = require("express");
const router = express.Router();
const {
  analyzeResume,
  getResumeHistory
} = require("../controllers/resumeController");

router.post("/analyze", analyzeResume);
router.get("/history/:userId", getResumeHistory);

module.exports = router;
