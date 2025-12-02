const PracticeSession = require("../models/PracticeSession");
const Sentiment = require("sentiment");
const sentiment = new Sentiment();

const getNextQuestion = async (req, res) => {
  try {
    const { role = "General", index = 0 } = req.body || {};
    const questions = {
      "Software Engineer": [
        "Tell me about your most challenging technical problem and how you solved it.",
        "Describe your experience with system design.",
        "How do you approach code reviews?"
      ],
      "Product Manager": [
        "Tell me about a product you've worked on. How did you define success?",
        "Walk me through your approach to prioritizing features.",
        "How do you handle conflicting priorities between engineering and sales?"
      ],
      "General": [
        "Tell me about yourself.",
        "Why are you interested in this position?",
        "Describe a time you overcame a significant challenge.",
        "What are your greatest strengths?"
      ]
    };

    const list = questions[role] || questions["General"] || [];
    if (index >= list.length) return res.json({ ok: true, end: true });
    return res.json({ ok: true, question: list[index] });
  } catch (err) {
    console.error("getNextQuestion error", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
};

const analyzeAnswer = async (req, res) => {
  try {
    const { transcript = "", durationSec = 0, expressions = {} } = req.body || {};

    const fillerWords = ["um", "uh", "like", "you know", "actually", "so", "basically", "erm"];
    let fillerCount = 0;
    const lower = (transcript || "").toLowerCase();
    fillerWords.forEach(f => {
      const m = lower.match(new RegExp("\\b" + f + "\\b", "g"));
      if (m) fillerCount += m.length;
    });

    const words = (transcript.trim().length === 0) ? 0 : transcript.trim().split(/\s+/).length;
    const wpm = durationSec > 0 ? Math.round(words / (durationSec / 60)) : 0;

    const senti = sentiment.analyze(transcript || "");

    const idealWPM = 130;
    const wpmScore = Math.max(0, 100 - Math.abs(idealWPM - wpm) * 0.5);

    const fillerScore = Math.max(0, 100 - fillerCount * 10);

    let volumeScore = 100;
    const avgVolume = req.body.avgVolume || 0;
    if (avgVolume < 0.002) volumeScore = 50;
    else if (avgVolume < 0.01) volumeScore = 80;
    else if (avgVolume < 0.03) volumeScore = 95;
    else if (avgVolume < 0.08) volumeScore = 90;
    else volumeScore = 70;

    const happy = expressions.happy || 0;
    const neutral = expressions.neutral || 0;
    const sad = expressions.sad || 0;
    const angry = expressions.angry || 0;
    const exprRaw = (happy * 1.4 + neutral * 1.0) - (sad * 0.5 + angry * 0.6);
    let facialScore = Math.round(Math.min(1, Math.max(-1, exprRaw)) * 100);
    facialScore = Math.max(0, Math.min(100, facialScore));

    let toneScore = 50 + senti.score * 5;
    toneScore = Math.max(0, Math.min(100, Math.round(toneScore)));

    const communicationScore = Math.round(
      (wpmScore * 0.25) +
      (fillerScore * 0.20) +
      (volumeScore * 0.15) +
      (facialScore * 0.20) +
      (toneScore * 0.20)
    );

    const suggestions = [];
    if (wpm < 100) suggestions.push(`Speaking rate is ${wpm} WPM — aim for 110–150 WPM.`);
    if (wpm > 180) suggestions.push(`Speaking rate is ${wpm} WPM — slow down for clarity.`);
    if (fillerCount > 2) suggestions.push(`You used ${fillerCount} filler words — practice pausing instead.`);
    if (avgVolume < 0.005) suggestions.push("Speak closer to the mic or slightly louder.");
    if (facialScore < 40) suggestions.push("Smile more and maintain an open, engaged expression.");
    if (toneScore < 40) suggestions.push("Work on a more confident, neutral tone.");

    const strengths = [];
    if (facialScore > 60) strengths.push("Excellent facial engagement.");
    if (Math.abs(idealWPM - wpm) < 20) strengths.push("Good pacing and rhythm.");
    if (toneScore > 55) strengths.push("Professional and confident tone.");

    res.json({
      ok: true,
      meta: { words, durationSec, wpm, fillerCount, avgVolume },
      scores: {
        wpmScore: Math.round(wpmScore),
        fillerScore: Math.round(fillerScore),
        volumeScore,
        facialScore,
        toneScore,
        communicationScore
      },
      sentimentResult: senti,
      strengths,
      suggestions,
      expressions
    });
  } catch (err) {
    console.error("analyzeAnswer error", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
};

const savePracticeSession = async (req, res) => {
  try {
    const { userId, role, company, interviewType, persona, questions: questionData, overallScore } = req.body;

    const session = new PracticeSession({
      userId,
      role,
      company,
      interviewType,
      persona,
      questions: questionData || [],
      overallCommunicationScore: overallScore,
      duration: questionData?.reduce((acc, q) => acc + (q.duration || 0), 0) || 0,
      createdAt: new Date()
    });

    await session.save();
    res.json({ ok: true, sessionId: session._id });
  } catch (err) {
    console.error("savePracticeSession error", err);
    res.status(500).json({ ok: false, error: "Failed to save session" });
  }
};

const getPracticeHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const sessions = await PracticeSession.find({ userId }).sort({ createdAt: -1 }).limit(10);
    res.json({ ok: true, sessions });
  } catch (err) {
    console.error("getPracticeHistory error", err);
    res.status(500).json({ ok: false, error: "Failed to retrieve history" });
  }
};

module.exports = {
  getNextQuestion,
  analyzeAnswer,
  savePracticeSession,
  getPracticeHistory
};
