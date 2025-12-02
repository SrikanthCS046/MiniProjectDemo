const CodingAttempt = require("../models/CodingAttempt");
const { executeCode, analyzeComplexity } = require("../utils/codeExecutor");

const runCode = async (req, res) => {
  try {
    const { code, language, input = "", expectedOutput = "", userId } = req.body;

    if (!code || !language) {
      return res.status(400).json({ ok: false, error: "Code and language are required" });
    }

    const result = await executeCode(code, language, input, expectedOutput);

    const attempt = new CodingAttempt({
      userId,
      code,
      language,
      status: result.verdict || "error",
      output: result.output,
      expectedOutput,
      errorMessage: result.errorMessage,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
      verdict: result.verdict
    });

    await attempt.save();

    res.json({
      ok: true,
      result: {
        ...result,
        attemptId: attempt._id
      }
    });
  } catch (err) {
    console.error("runCode error", err);
    res.status(500).json({ ok: false, error: "Code execution failed" });
  }
};

const submitProblem = async (req, res) => {
  try {
    const { code, language, problemId, problemTitle, problemDescription, userId, input, expectedOutput } = req.body;

    const result = await executeCode(code, language, input, expectedOutput);

    const complexity = await analyzeComplexity(code);

    const attempt = new CodingAttempt({
      userId,
      problemId,
      problemTitle,
      problemDescription,
      code,
      language,
      status: result.verdict,
      verdict: result.verdict,
      output: result.output,
      expectedOutput,
      errorMessage: result.errorMessage,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
      timeComplexity: complexity.timeComplexity,
      spaceComplexity: complexity.spaceComplexity,
      suggestions: result.verdict === "accepted"
        ? ["Solution accepted! Consider optimizing for better performance."]
        : ["Debug the error and try again."]
    });

    await attempt.save();

    res.json({
      ok: true,
      attempt,
      result
    });
  } catch (err) {
    console.error("submitProblem error", err);
    res.status(500).json({ ok: false, error: "Submission failed" });
  }
};

const getAttemptHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const attempts = await CodingAttempt.find({ userId }).sort({ createdAt: -1 }).limit(20);
    res.json({ ok: true, attempts });
  } catch (err) {
    console.error("getAttemptHistory error", err);
    res.status(500).json({ ok: false, error: "Failed to retrieve attempts" });
  }
};

module.exports = {
  runCode,
  submitProblem,
  getAttemptHistory
};
