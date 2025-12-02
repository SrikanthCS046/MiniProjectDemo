const ResumeAnalysis = require("../models/ResumeAnalysis");
const stringSimilarity = require("string-similarity");
const nlp = require("compromise");

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

const extractSkills = (text) => {
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
};

const analyzeResume = async (req, res) => {
  try {
    const { resumeText, jobDescription, userId } = req.body;

    if (!resumeText) {
      return res.status(400).json({ ok: false, error: "Resume text is required" });
    }

    const resumeLower = resumeText.toLowerCase();
    const jdLower = (jobDescription || "").toLowerCase();

    const resumeSkills = extractSkills(resumeText);
    const jobSkills = jobDescription ? extractSkills(jobDescription) : [];
    const missingSkills = jobSkills.filter(s => !resumeSkills.includes(s));

    let matchScore = stringSimilarity.compareTwoStrings(resumeLower, jdLower || resumeLower);
    const skillMatch = 1 - (missingSkills.length / Math.max(jobSkills.length, 1));
    matchScore = (matchScore + skillMatch) / 2;
    const atsScore = Math.round(matchScore * 100);

    let suggestions = [
      "Use measurable achievements in your experience section.",
      "Tailor skills to match job description keywords.",
      "Keep contact information as plain text for ATS compatibility.",
      "Use standard section headings (Experience, Skills, Education)."
    ];

    if (missingSkills.length) {
      suggestions.unshift(`Add these missing skills: ${missingSkills.slice(0, 5).join(", ")}`);
    }

    if (atsScore < 70) {
      suggestions.push("Include more relevant keywords from the job description to improve ATS score.");
    }

    if ((resumeText || "").length < 500) {
      suggestions.push("Expand your resume with more detailed descriptions of your achievements.");
    }

    const strengths = [];
    if (resumeSkills.length > 10) strengths.push("Strong skill coverage.");
    if (matchScore > 0.7) strengths.push("Good alignment with job requirements.");
    if (resumeText.includes("%") || resumeText.includes("$")) strengths.push("Good use of metrics and numbers.");

    const analysis = new ResumeAnalysis({
      userId,
      resumeText,
      jobDescription,
      resumeSkills,
      jobSkills,
      missingSkills,
      matchPercentage: Math.round(matchScore * 100),
      atsScore,
      suggestions,
      strengths
    });

    await analysis.save();

    res.json({
      ok: true,
      analysis: {
        resumeSkills,
        jobSkills,
        missingSkills,
        matchPercentage: Math.round(matchScore * 100),
        atsScore,
        suggestions,
        strengths
      }
    });
  } catch (err) {
    console.error("analyzeResume error", err);
    res.status(500).json({ ok: false, error: "Analysis failed" });
  }
};

const getResumeHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const analyses = await ResumeAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(5);
    res.json({ ok: true, analyses });
  } catch (err) {
    console.error("getResumeHistory error", err);
    res.status(500).json({ ok: false, error: "Failed to retrieve history" });
  }
};

module.exports = {
  analyzeResume,
  getResumeHistory,
  extractSkills
};
