const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  resumeText: String,
  jobDescription: String,
  resumeSkills: [String],
  jobSkills: [String],
  missingSkills: [String],
  matchPercentage: Number,
  atsScore: Number,
  suggestions: [String],
  strengths: [String],
  improvementAreas: [String],
  experienceHighlights: [String],
  educationHighlights: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
