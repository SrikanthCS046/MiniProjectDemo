const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  transcript: String,
  durationSec: Number,
  words: Number,
  fillerCount: Number,
  avgVolume: Number,
  expressions: mongoose.Schema.Types.Mixed,
  scores: {
    communicationScore: Number,
    wpmScore: Number,
    volumeScore: Number,
    facialScore: Number,
    toneScore: Number
  },
  strengths: [String],
  suggestions: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Session", sessionSchema);
