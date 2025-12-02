const mongoose = require("mongoose");

const practiceSessionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  role: String,
  company: String,
  interviewType: { type: String, enum: ["behavioral", "technical"], default: "behavioral" },
  persona: String,
  questions: [{
    questionText: String,
    answer: String,
    duration: Number,
    wordCount: Number,
    fillerCount: Number,
    avgVolume: Number,
    expressions: mongoose.Schema.Types.Mixed,
    scores: {
      wpmScore: Number,
      fillerScore: Number,
      volumeScore: Number,
      facialScore: Number,
      toneScore: Number,
      communicationScore: Number
    }
  }],
  overallCommunicationScore: Number,
  strengths: [String],
  suggestions: [String],
  duration: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("PracticeSession", practiceSessionSchema);
