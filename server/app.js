require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { createWorker } = require("tesseract.js");
const stringSimilarity = require("string-similarity");
const nlp = require("compromise");
const Sentiment = require("sentiment");
const sentiment = new Sentiment();

const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const nodeNotifier = require("node-notifier");

const ExpressError = require("../utils/ExpressError.js");
const WrapAsync = require("../utils/WrapAsync.js");

const Feedback = require("../model/feedback.js");
const UserLogin = require("../model/login.js");
const User = require("../model/userAccount.js");
const Session = require("../model/session.js");

const practiceRoutes = require("./routes/practice");
const resumeRoutes = require("./routes/resume");
const jobRoutes = require("./routes/jobs");
const codingRoutes = require("./routes/coding");

let questions = {};
try {
  const qpath = path.join(__dirname, "../questions", "roles.json");
  if (fs.existsSync(qpath)) {
    questions = JSON.parse(fs.readFileSync(qpath, "utf8"));
    console.log("Loaded questions from ./questions/roles.json");
  } else {
    questions = {
      "Software Engineer": [
        "Explain a time you solved a complex coding problem.",
        "How do you ensure code quality in a team project?",
        "Describe a tradeoff you made in a recent design."
      ],
      "Product Manager": [
        "Describe a product you launched and the metrics you tracked.",
        "How do you prioritize roadmap items?"
      ],
      "General": [
        "Tell me about yourself.",
        "Describe a challenging situation you resolved."
      ]
    };
    console.log("Using built-in fallback questions.");
  }
} catch (err) {
  console.error("Error loading questions file:", err);
  questions = {
    "General": ["Tell me about yourself.", "Why should we hire you?"]
  };
}

const app = express();
const PORT = process.env.PORT || 8080;

app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));
app.use(methodOverride("_method"));
app.use(bodyParser.json());

nodeNotifier.notify({ appID: "GrowAi" });

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

require("../config/passport")(passport);
app.use(session({
  secret: process.env.SESSION_SECRET || "defaultsecret",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const mongoURL = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/GrowAi";
async function main() {
  await mongoose.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true });
}
main().then(() => console.log("Connected to MongoDB")).catch((e) => console.error("MongoDB connection error:", e));

const feedbackSchema = require("../feedbackSchema.js");
const loginSchema = require("../loginSchema.js");
const userAccountSchema = require("../userAccountSchema.js");

let validateUserAccount = (req, res, next) => {
  const { error } = userAccountSchema.validate(req.body);
  if (error) throw new ExpressError(400, error.details.map(el => el.message));
  next();
};
let validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) throw new ExpressError(400, error.details.map(el => el.message));
  next();
};
let validateFeedback = (req, res, next) => {
  const { error } = feedbackSchema.validate(req.body);
  if (error) throw new ExpressError(400, error.details.map(el => el.message));
  next();
};

const skillsDatabase = [
  "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "php", "go", "swift", "kotlin",
  "html", "css", "react", "angular", "vue.js", "svelte", "bootstrap", "tailwind css",
  "node.js", "express", "django", "flask", "spring boot", "ruby on rails", "asp.net",
  "mongodb", "mysql", "postgresql", "sqlite", "redis", "oracle",
  "aws", "azure", "google cloud", "docker", "kubernetes", "jenkins", "git", "github", "gitlab",
  "communication", "teamwork", "leadership", "problem-solving", "time management", "adaptability",
  "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
  "agile", "scrum", "sql", "api", "rest", "graphql", "microservices"
];

function extractSkills(text) {
  const doc = nlp(text || "");
  const nouns = doc.nouns().out('array');
  const extracted = [];
  nouns.forEach(noun => {
    const bestMatch = skillsDatabase.reduce((best, skill) => {
      const similarity = stringSimilarity.compareTwoStrings((noun || "").toLowerCase(), skill);
      return similarity > best.similarity ? { skill, similarity } : best;
    }, { skill: null, similarity: 0 });
    if (bestMatch.similarity > 0.6) extracted.push(bestMatch.skill);
  });
  return [...new Set(extracted)];
}

app.get("/home", WrapAsync(async (req, res) => {
  const feedback = await Feedback.find();
  res.render("home.ejs", { feedback });
}));
app.get("/login", (req, res) => res.render("login", { error: req.query.error }));
app.get("/createAccount", (req, res) => res.render("createAccount.ejs"));
app.post("/createAccount", validateUserAccount, WrapAsync(async (req, res) => {
  const user = new User(req.body.user);
  await user.save();
  res.redirect("/login");
}));
app.post("/login", validateLogin, WrapAsync(async (req, res) => {
  const { email, pass } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.redirect("/login?error=User doesn't exist");
  if (user.password !== pass) return res.redirect("/login?error=Incorrect password");
  return res.redirect("/home");
}));
app.get("/dashboard", (req, res) => res.render("dashboard.ejs"));
app.get("/problem-set", (req, res) => res.render("problemSet.ejs"));
app.get("/Gowthami", (req, res) => res.render("Gowthami.ejs"));
app.get("/profile", (req, res) => res.render("profile.ejs"));
app.get("/feedback", (req, res) => res.render("feedback.ejs"));

const DEFAULT_ROLES = Object.keys(questions);
const DEFAULT_COMPANIES = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Netflix", "Adobe", "Tesla", "IBM", "Intel"];
app.get("/practice", (req, res) => {
  res.render("practice.ejs", {
    roles: DEFAULT_ROLES,
    companies: DEFAULT_COMPANIES
  });
});

app.post("/next-question", (req, res) => {
  try {
    const { role = "General", index = 0 } = req.body || {};
    const list = questions[role] || questions["General"] || [];
    if (index >= list.length) return res.json({ ok: true, end: true });
    return res.json({ ok: true, question: list[index] });
  } catch (err) {
    console.error("next-question error", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
});

app.post("/analyze-answer", (req, res) => {
  try {
    const { answer = "", durationSec = 0 } = req.body || {};
    const fillerWords = ["um", "uh", "like", "you know", "actually", "so", "basically"];
    let fillerCount = 0;
    const lower = (answer || "").toLowerCase();
    fillerWords.forEach(f => {
      const m = lower.match(new RegExp("\\b" + f + "\\b", "g"));
      if (m) fillerCount += m.length;
    });
    const words = (answer.trim().length === 0) ? 0 : answer.trim().split(/\s+/).length;
    const wpm = durationSec > 0 ? Math.round(words / (durationSec / 60)) : 0;
    const senti = sentiment.analyze(answer || "");
    return res.json({
      ok: true,
      meta: { words, durationSec, wpm, fillerCount, sentimentScore: senti.score }
    });
  } catch (err) {
    console.error("analyze-answer error", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
});

app.post("/api/practice/analyze", async (req, res) => {
  try {
    const body = req.body || {};
    const transcript = (body.transcript || "").trim();
    const durationSec = Number(body.durationSec) || 0;
    const words = Number(body.words) || (transcript ? transcript.split(/\s+/).length : 0);
    const fillerCount = Number(body.fillerCount) || 0;
    const avgVolume = Number(body.avgVolume) || 0;
    const expressions = body.expressions || {};

    const minutes = Math.max(durationSec / 60, 1 / 60);
    const wpm = Math.round(words / minutes);
    const idealWPM = 130;
    const wpmScore = Math.max(0, 100 - Math.abs(idealWPM - wpm));

    const fillerPenalty = Math.max(0, 100 - fillerCount * 8);

    let volumeScore = 100;
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
    let exprScore = Math.round(Math.min(1, Math.max(-1, exprRaw)) * 100);
    const facialScore = Math.max(0, Math.min(100, exprScore));

    const sentimentResult = sentiment.analyze(transcript || "");
    let toneScore = 50 + sentimentResult.score * 5;
    toneScore = Math.max(0, Math.min(100, Math.round(toneScore)));

    const commScore = Math.round(
      (wpmScore * 0.25) +
      (fillerPenalty * 0.20) +
      (volumeScore * 0.15) +
      (facialScore * 0.20) +
      (toneScore * 0.20)
    );

    const suggestions = [];
    if (wpm < 100) suggestions.push(`Your speaking rate is ${wpm} WPM — consider increasing to ~110–150 WPM.`);
    if (wpm > 180) suggestions.push(`Your speaking rate is ${wpm} WPM — slow down and pause for clarity.`);
    if (fillerCount > 2) suggestions.push(`You used ${fillerCount} filler words — practice pausing instead of saying 'um' or 'like'.`);
    if (avgVolume < 0.005) suggestions.push("You're a bit quiet — speak closer to the mic or slightly louder.");
    if (facialScore < 40) suggestions.push("Try smiling and keeping an open expression to appear more engaged.");
    if (toneScore < 40) suggestions.push("Work on a more neutral/positive tone to come across confident.");

    const strengths = [];
    if (facialScore > 60) strengths.push("Good facial engagement.");
    if (Math.abs(idealWPM - wpm) < 20) strengths.push("Good pacing.");
    if (toneScore > 55) strengths.push("Neutral/positive tone.");

    try {
      if (Session) {
        const doc = new Session({
          transcript,
          durationSec,
          words,
          fillerCount,
          avgVolume,
          expressions,
          scores: { communicationScore: commScore, wpmScore, volumeScore, facialScore, toneScore },
          strengths,
          suggestions
        });
        await doc.save();
      }
    } catch (err) {
      console.warn("Failed to save session (non-fatal):", err.message || err);
    }

    return res.json({
      ok: true,
      meta: { words, durationSec, wpm, fillerCount, avgVolume },
      scores: { wpmScore: Math.round(wpmScore), fillerPenalty: Math.round(fillerPenalty), volumeScore: Math.round(volumeScore), facialScore, toneScore, communicationScore: commScore },
      sentimentResult,
      strengths,
      suggestions,
      expressions
    });

  } catch (err) {
    console.error("practice analyze error", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
});

app.post("/final-summary", (req, res) => {
  try {
    const { allAnswers = [] } = req.body || {};
    let totalScore = 0, totalFiller = 0;
    allAnswers.forEach(a => {
      totalScore += Number(a.sentimentScore || 0);
      totalFiller += Number(a.fillerCount || 0);
    });

    const strengths = [];
    const weaknesses = [];
    if (totalScore > 0) strengths.push("Generally positive tone");
    else weaknesses.push("Work on a more positive/confident tone");

    if (totalFiller < 3) strengths.push("Low filler word usage");
    else weaknesses.push("Reduce filler words (um / uh / like)");

    weaknesses.push("Structure answers using STAR (Situation, Task, Action, Result)");

    return res.json({
      ok: true,
      strengths,
      weaknesses,
      tips: [
        "Use STAR to structure behavioral answers.",
        "Record yourself and target reducing fillers.",
        "Quantify achievements (numbers) in answers where possible."
      ]
    });
  } catch (err) {
    console.error("final-summary error", err);
    return res.status(500).json({ ok: false, error: "server error" });
  }
});

app.get("/resume-analysis", (req, res) => res.render("resume", { error: null, resumeSkills: null, jdSkills: null, missingSkills: null, atsScore: null, suggestions: null }));

app.post("/resume-analysis", upload.single("resume"), WrapAsync(async (req, res) => {
  const jd = req.body.jd || "";
  const resumeFile = req.file;
  if (!resumeFile) {
    return res.render("resume", { error: "Please upload a resume file.", resumeSkills: null, jdSkills: null, missingSkills: null, atsScore: null, suggestions: null });
  }

  let resumeText = "";
  const mimeType = resumeFile.mimetype;
  const ext = path.extname(resumeFile.originalname).toLowerCase();

  try {
    if (mimeType === 'application/pdf' || ext === '.pdf') {
      const pdfData = await pdfParse(resumeFile.buffer);
      resumeText = pdfData.text || "";
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx') {
      const result = await mammoth.convertToText({ buffer: resumeFile.buffer });
      resumeText = result.value || "";
    } else if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.tiff'].includes(ext)) {
      const worker = createWorker();
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data } = await worker.recognize(resumeFile.buffer);
      resumeText = data.text || "";
      await worker.terminate();
    } else {
      return res.render("resume", { error: "Unsupported file format. Use PDF/DOCX/PNG/JPG.", resumeSkills: null, jdSkills: null, missingSkills: null, atsScore: null, suggestions: null });
    }

    if (!resumeText || resumeText.trim().length === 0) {
      return res.render("resume", { error: "Couldn't extract text from file. Try another file.", resumeSkills: null, jdSkills: null, missingSkills: null, atsScore: null, suggestions: null });
    }

    const resumeLower = resumeText.toLowerCase();
    const jdLower = (jd || "").toLowerCase();

    const resumeSkills = extractSkills(resumeText);
    const jdSkills = jd ? extractSkills(jd) : [];
    const missingSkills = jdSkills.filter(s => !resumeSkills.includes(s));

    let matchScore = stringSimilarity.compareTwoStrings(resumeLower, jdLower || resumeLower);
    const skillMatch = 1 - (missingSkills.length / Math.max(jdSkills.length, 1));
    matchScore = (matchScore + skillMatch) / 2;
    const atsScore = Math.round(matchScore * 100);

    let suggestions = [
      'Use measurable achievements in Experience.',
      'Tailor skills to match job description keywords.',
      'Keep contact info as plain text for ATS.'
    ];
    if (missingSkills.length) suggestions.unshift(`Add missing skills: ${missingSkills.join(", ")}`);
    if (atsScore < 70) suggestions.push("Include more relevant keywords from JD to improve ATS score.");
    if ((resumeText || "").length < 500) suggestions.push("Expand resume details to better show experience.");

    return res.render("resume", { error: null, resumeSkills, jdSkills, missingSkills, atsScore, suggestions });
  } catch (err) {
    console.error("resume-analysis error", err);
    return res.render("resume", { error: "Error processing resume. Try again.", resumeSkills: null, jdSkills: null, missingSkills: null, atsScore: null, suggestions: null });
  }
}));

app.post("/feedback", validateFeedback, WrapAsync(async (req, res) => {
  const { rating, comment } = req.body.feedback;
  const newFeedback = new Feedback({ rating, comment, createdAt: new Date() });
  await newFeedback.save();
  res.redirect("/home");
}));

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => { res.redirect("/home"); });

app.use("/api/practice", practiceRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/coding", codingRoutes);

app.use((err, req, res, next) => {
  console.error("Global error:", err);
  const { status = 500, message = "Something went wrong" } = err || {};
  res.status(status);
  if (req.path.startsWith("/api") || req.xhr) {
    return res.json({ ok: false, error: message });
  }
  res.render("error.ejs", { message });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
