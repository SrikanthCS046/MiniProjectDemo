const mongoose = require("mongoose");

const jobSearchSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  jobId: String,
  jobTitle: String,
  company: String,
  location: String,
  jobUrl: String,
  description: String,
  salary: String,
  jobType: String,
  postedDate: String,
  applicantCount: Number,
  matchScore: Number,
  saved: { type: Boolean, default: false },
  applied: { type: Boolean, default: false },
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("JobSearch", jobSearchSchema);
