const axios = require("axios");

const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";
const JUDGE0_BASE_URL = "https://judge0-ce.p.rapidapi.com";

const LANGUAGE_MAP = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  csharp: 51,
  ruby: 72,
  go: 60,
  rust: 73
};

async function executeCode(code, language, input = "", expectedOutput = "") {
  try {
    if (!JUDGE0_API_KEY) {
      return {
        status: "error",
        error: "Judge0 API key not configured",
        output: "",
        errorMessage: "Code execution service not available"
      };
    }

    const languageId = LANGUAGE_MAP[language.toLowerCase()] || 63;

    const createResponse = await axios.post(
      `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=false`,
      {
        source_code: code,
        language_id: languageId,
        stdin: input || "",
        expected_output: expectedOutput || ""
      },
      {
        headers: {
          "x-rapidapi-key": JUDGE0_API_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json"
        }
      }
    );

    const token = createResponse.data.token;

    await new Promise(resolve => setTimeout(resolve, 2000));

    const resultResponse = await axios.get(
      `${JUDGE0_BASE_URL}/submissions/${token}?base64_encoded=false`,
      {
        headers: {
          "x-rapidapi-key": JUDGE0_API_KEY,
          "x-rapidapi-host": "judge0-ce.p.rapidapi.com"
        }
      }
    );

    const submission = resultResponse.data;

    return {
      status: submission.status?.description || "Pending",
      output: submission.stdout || "",
      errorMessage: submission.stderr || submission.compile_output || "",
      executionTime: submission.time || 0,
      memoryUsed: submission.memory || 0,
      verdict: getVerdict(submission)
    };
  } catch (error) {
    console.warn("Code execution error (non-fatal):", error.message);
    return {
      status: "error",
      error: error.message,
      output: "",
      errorMessage: "Code execution failed"
    };
  }
}

function getVerdict(submission) {
  const status = submission.status?.description || "";
  if (status.includes("Accepted")) return "accepted";
  if (status.includes("Runtime")) return "runtime_error";
  if (status.includes("Compilation")) return "compilation_error";
  if (status.includes("Wrong")) return "wrong_answer";
  if (status.includes("Time")) return "time_limit";
  return "error";
}

async function analyzeComplexity(code) {
  return {
    timeComplexity: "O(n) — estimated",
    spaceComplexity: "O(1) — estimated",
    note: "For accurate complexity analysis, use specialized tools."
  };
}

module.exports = {
  executeCode,
  analyzeComplexity
};
