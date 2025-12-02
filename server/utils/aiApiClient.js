const axios = require("axios");

const HF_API_KEY = process.env.HF_API_KEY || "hf_nKXXXXXXXXXXXXXX";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || ""; // Optional for rapid-api
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY || "";

const HF_BASE_URL = "https://api-inference.huggingface.co/models";

async function analyzeEmotions(text) {
  try {
    const response = await axios.post(
      `${HF_BASE_URL}/j-hartmann/emotion-english-distilroberta-base`,
      { inputs: text },
      { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
    );
    return response.data?.[0] || [];
  } catch (error) {
    console.warn("Emotion analysis failed (non-fatal):", error.message);
    return [];
  }
}

async function extractKeywords(text) {
  try {
    const response = await axios.post(
      `${HF_BASE_URL}/yanekyuk/bert-keyword-extractor`,
      { inputs: text },
      { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
    );
    return response.data?.[0]?.map(item => item.word) || [];
  } catch (error) {
    console.warn("Keyword extraction failed (non-fatal):", error.message);
    return [];
  }
}

async function summarizeText(text) {
  try {
    const response = await axios.post(
      `${HF_BASE_URL}/facebook/bart-large-cnn`,
      { inputs: text, parameters: { max_length: 130, min_length: 30, do_sample: false } },
      { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
    );
    return response.data?.[0]?.summary_text || "";
  } catch (error) {
    console.warn("Summarization failed (non-fatal):", error.message);
    return "";
  }
}

async function analyzeZeroShot(text, categories) {
  try {
    const response = await axios.post(
      `${HF_BASE_URL}/facebook/zero-shot-classification`,
      { inputs: text, parameters: { candidate_labels: categories } },
      { headers: { Authorization: `Bearer ${HF_API_KEY}` } }
    );
    return response.data || {};
  } catch (error) {
    console.warn("Zero-shot classification failed (non-fatal):", error.message);
    return {};
  }
}

module.exports = {
  analyzeEmotions,
  extractKeywords,
  summarizeText,
  analyzeZeroShot
};
