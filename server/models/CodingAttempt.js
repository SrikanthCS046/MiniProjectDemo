const mongoose = require("mongoose");

const codingAttemptSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  problemId: String,
  problemTitle: String,
  problemDescription: String,
  language: String,
  code: String,
  status: { type: String, enum: ["pending", "accepted", "runtime_error", "compilation_error", "wrong_answer", "time_limit"], default: "pending" },
  verdict: String,
  output: String,
  expectedOutput: String,
  errorMessage: String,
  executionTime: Number,
  memoryUsed: Number,
  timeComplexity: String,
  spaceComplexity: String,
  suggestions: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CodingAttempt", codingAttemptSchema);
