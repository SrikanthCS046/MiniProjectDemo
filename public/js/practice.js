// practice-client.js - Complete Yoodli-style interview system
// Place in /public/js/

// ==========================================
// STATE MANAGEMENT
// ==========================================
const state = {
  isRunning: false,
  currentQuestionIndex: 0,
  role: "Software Engineer",
  company: "Google",
  persona: "Manager",
  interviewType: "Behavioral",
  
  // Audio tracking
  audioContext: null,
  analyser: null,
  mediaRecorder: null,
  audioChunks: [],
  volumeSamples: [],
  
  // Transcript tracking
  recognition: null,
  currentTranscript: "",
  questionStartTime: null,
  
  // Expression tracking
  expressionHistory: [],
  detectionInterval: null,
  
  // Session data
  allAnswers: [],
  currentAnswer: {
    question: "",
    transcript: "",
    startTime: null,
    expressions: {},
    fillerCount: 0,
    words: 0
  }
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const elements = {
  video: document.getElementById("video"),
  startBtn: document.getElementById("startBtn"),
  stopBtn: document.getElementById("stopBtn"),
  roleSelect: document.getElementById("role"),
  companySelect: document.getElementById("company"),
  personaSelect: document.getElementById("persona"),
  interviewTypeSelect: document.getElementById("rolePlay"),
  exprSummary: document.getElementById("exprSummary"),
  audioSummary: document.getElementById("audioSummary"),
  liveTranscript: document.getElementById("liveTranscript"),
  captureTranscriptBtn: document.getElementById("captureTranscriptBtn"),
  resultsArea: document.getElementById("resultsArea"),
  commScore: document.getElementById("commScore"),
  strengthsList: document.getElementById("strengthsList"),
  suggestionsList: document.getElementById("suggestionsList"),
  fullJson: document.getElementById("fullJson"),
  questionProgress: document.getElementById("questionProgress"),
  questionNum: document.getElementById("questionNum"),
  currentQuestion: document.getElementById("currentQuestion"),
  timer: document.getElementById("timer"),
  progressFill: document.getElementById("progressFill"),
  questionOverlay: document.getElementById("questionOverlay"),
  modalQuestion: document.getElementById("modalQuestion"),
  closeModalBtn: document.getElementById("closeModalBtn")
};

// ==========================================
// INITIALIZATION
// ==========================================
async function init() {
  console.log("Initializing interview system...");
  
  // Load face-api models
  await loadFaceModels();
  
  // Setup camera
  await startCamera();
  
  // Setup speech recognition
  setupSpeechRecognition();
  
  // Event listeners
  elements.startBtn.addEventListener("click", startInterview);
  elements.stopBtn.addEventListener("click", stopInterview);
  elements.captureTranscriptBtn.addEventListener("click", toggleTranscript);
  elements.closeModalBtn.addEventListener("click", closeQuestionModal);
  
  console.log("System ready!");
}

// ==========================================
// FACE-API SETUP
// ==========================================
async function loadFaceModels() {
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    await faceapi.nets.faceExpressionNet.loadFromUri("/models");
    console.log("✅ Face detection models loaded");
  } catch (err) {
    console.error("❌ Failed to load face models:", err);
  }
}

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 420, height: 300 }, 
      audio: true 
    });
    elements.video.srcObject = stream;
    
    // Setup audio analysis
    setupAudioAnalysis(stream);
    
    console.log("✅ Camera started");
  } catch (err) {
    console.error("❌ Camera error:", err);
    alert("Please allow camera and microphone access");
  }
}

function setupAudioAnalysis(stream) {
  state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  state.analyser = state.audioContext.createAnalyser();
  const source = state.audioContext.createMediaStreamSource(stream);
  source.connect(state.analyser);
  state.analyser.fftSize = 256;
  
  // Setup media recorder for potential playback
  state.mediaRecorder = new MediaRecorder(stream);
  state.mediaRecorder.ondataavailable = (e) => state.audioChunks.push(e.data);
}

// ==========================================
// SPEECH RECOGNITION SETUP
// ==========================================
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech recognition not supported");
    return;
  }
  
  state.recognition = new SpeechRecognition();
  state.recognition.continuous = true;
  state.recognition.interimResults = true;
  state.recognition.lang = 'en-US';
  
  state.recognition.onresult = (event) => {
    let interim = "";
    let final = "";
    
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcript + " ";
      } else {
        interim += transcript;
      }
    }
    
    if (final) {
      state.currentTranscript += final;
      state.currentAnswer.transcript += final;
    }
    
    // Update live display
    elements.liveTranscript.textContent = state.currentTranscript + interim;
  };
  
  state.recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
  };
  
  state.recognition.onend = () => {
    if (state.isRunning) {
      // Restart if still in session
      state.recognition.start();
    }
  };
}

// ==========================================
// FACE EXPRESSION DETECTION
// ==========================================
function startFaceDetection() {
  state.detectionInterval = setInterval(async () => {
    try {
      const detections = await faceapi
        .detectAllFaces(elements.video)
        .withFaceLandmarks()
        .withFaceExpressions();
      
      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        state.expressionHistory.push(expressions);
        
        // Keep only last 30 samples (3 seconds at 100ms interval)
        if (state.expressionHistory.length > 30) {
          state.expressionHistory.shift();
        }
        
        // Update display
        updateExpressionDisplay(expressions);
      }
    } catch (err) {
      console.error("Face detection error:", err);
    }
  }, 100);
}

function updateExpressionDisplay(expressions) {
  const happy = (expressions.happy * 100).toFixed(0);
  const neutral = (expressions.neutral * 100).toFixed(0);
  const sad = (expressions.sad * 100).toFixed(0);
  
  elements.exprSummary.textContent = 
    `Expressions: happy ${happy}% neutral ${neutral}% sad ${sad}%`;
}

function stopFaceDetection() {
  if (state.detectionInterval) {
    clearInterval(state.detectionInterval);
    state.detectionInterval = null;
  }
}

// ==========================================
// AUDIO VOLUME TRACKING
// ==========================================
function startVolumeTracking() {
  const trackVolume = () => {
    if (!state.isRunning) return;
    
    const dataArray = new Uint8Array(state.analyser.frequencyBinCount);
    state.analyser.getByteFrequencyData(dataArray);
    
    const sum = dataArray.reduce((a, b) => a + b, 0);
    const avg = sum / dataArray.length;
    const normalized = avg / 255;
    
    state.volumeSamples.push(normalized);
    
    // Update display
    elements.audioSummary.textContent = 
      `Audio RMS: ${normalized.toFixed(4)}`;
    
    requestAnimationFrame(trackVolume);
  };
  
  trackVolume();
}

// ==========================================
// INTERVIEW FLOW
// ==========================================
async function startInterview() {
  state.isRunning = true;
  state.currentQuestionIndex = 0;
  state.allAnswers = [];
  
  // Get selections
  state.role = elements.roleSelect.value;
  state.company = elements.companySelect.value;
  state.persona = elements.personaSelect.value;
  state.interviewType = elements.interviewTypeSelect.value;
  
  // UI updates
  elements.startBtn.disabled = true;
  elements.stopBtn.disabled = false;
  elements.resultsArea.style.display = "none";
  
  // Start tracking
  startFaceDetection();
  startVolumeTracking();
  
  if (state.recognition) {
    state.recognition.start();
  }
  
  // Start recording
  if (state.mediaRecorder) {
    state.audioChunks = [];
    state.mediaRecorder.start();
  }
  
  console.log("🎬 Interview started");
  
  // Ask first question
  await askNextQuestion();
}

async function askNextQuestion() {
  try {
    const response = await fetch("/next-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: state.role,
        index: state.currentQuestionIndex
      })
    });
    
    const data = await response.json();
    
    if (data.end) {
      console.log("📝 All questions completed");
      await finishInterview();
      return;
    }
    
    // Setup for new question
    state.currentAnswer = {
      question: data.question,
      transcript: "",
      startTime: Date.now(),
      expressions: {},
      fillerCount: 0,
      words: 0
    };
    
    state.currentTranscript = "";
    state.volumeSamples = [];
    state.expressionHistory = [];
    
    // Display question in modal
    console.log("❓ Question:", data.question);
    showQuestionModal(data.question);
    
    // Auto-advance after 2 minutes (optional)
    setTimeout(() => {
      if (state.isRunning && state.currentTranscript.split(/\s+/).length < 10) {
        console.log("⏱️ Time limit reached, moving to next question");
        submitCurrentAnswer();
      }
    }, 120000); // 2 minutes
    
  } catch (err) {
    console.error("Error fetching question:", err);
  }
}

async function submitCurrentAnswer() {
  if (!state.isRunning) return;
  
  // Stop timer
  stopQuestionTimer();
  
  // Calculate metrics
  const durationSec = (Date.now() - state.currentAnswer.startTime) / 1000;
  const transcript = state.currentAnswer.transcript.trim();
  const words = transcript ? transcript.split(/\s+/).length : 0;
  
  // Filler words detection
  const fillerWords = ["um", "uh", "like", "you know", "actually", "so", "basically"];
  let fillerCount = 0;
  const lower = transcript.toLowerCase();
  fillerWords.forEach(f => {
    const matches = lower.match(new RegExp("\\b" + f + "\\b", "g"));
    if (matches) fillerCount += matches.length;
  });
  
  // Average volume
  const avgVolume = state.volumeSamples.length > 0
    ? state.volumeSamples.reduce((a, b) => a + b, 0) / state.volumeSamples.length
    : 0;
  
  // Average expressions
  const avgExpressions = {};
  if (state.expressionHistory.length > 0) {
    const keys = Object.keys(state.expressionHistory[0]);
    keys.forEach(key => {
      const sum = state.expressionHistory.reduce((acc, exp) => acc + exp[key], 0);
      avgExpressions[key] = sum / state.expressionHistory.length;
    });
  }
  
  // Save answer
  const answerData = {
    question: state.currentAnswer.question,
    transcript,
    durationSec,
    words,
    fillerCount,
    avgVolume,
    expressions: avgExpressions
  };
  
  state.allAnswers.push(answerData);
  
  console.log("💾 Answer saved:", answerData);
  
  // Move to next question
  state.currentQuestionIndex++;
  
  // Small delay before next question
  setTimeout(() => {
    if (state.isRunning) {
      askNextQuestion();
    }
  }, 1000);
}

async function stopInterview() {
  // Submit current answer if any
  if (state.currentTranscript.trim().length > 0) {
    await submitCurrentAnswer();
  }
  
  await finishInterview();
}

async function finishInterview() {
  state.isRunning = false;
  
  // Stop tracking
  stopFaceDetection();
  
  if (state.recognition) {
    state.recognition.stop();
  }
  
  if (state.mediaRecorder && state.mediaRecorder.state !== "inactive") {
    state.mediaRecorder.stop();
  }
  
  // UI updates
  elements.startBtn.disabled = false;
  elements.stopBtn.disabled = true;
  
  console.log("🏁 Interview finished");
  
  // Analyze all answers
  await analyzeSession();
}

// ==========================================
// ANALYSIS & RESULTS
// ==========================================
async function analyzeSession() {
  if (state.allAnswers.length === 0) {
    alert("No answers recorded. Please try again.");
    return;
  }
  
  try {
    // Aggregate all answers for final analysis
    const aggregated = {
      transcript: state.allAnswers.map(a => a.transcript).join(" "),
      durationSec: state.allAnswers.reduce((sum, a) => sum + a.durationSec, 0),
      words: state.allAnswers.reduce((sum, a) => sum + a.words, 0),
      fillerCount: state.allAnswers.reduce((sum, a) => sum + a.fillerCount, 0),
      avgVolume: state.allAnswers.reduce((sum, a) => sum + a.avgVolume, 0) / state.allAnswers.length,
      expressions: {}
    };
    
    // Average expressions across all answers
    const allKeys = state.allAnswers.length > 0 ? Object.keys(state.allAnswers[0].expressions || {}) : [];
    allKeys.forEach(key => {
      const sum = state.allAnswers.reduce((acc, a) => acc + (a.expressions[key] || 0), 0);
      aggregated.expressions[key] = sum / state.allAnswers.length;
    });
    
    const response = await fetch("/api/practice/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aggregated)
    });
    
    const result = await response.json();
    
    if (result.ok) {
      displayResults(result);
    } else {
      throw new Error(result.error || "Analysis failed");
    }
    
  } catch (err) {
    console.error("Analysis error:", err);
    alert("Failed to analyze session. Check console for details.");
  }
}

function displayResults(result) {
  // Show results area
  elements.resultsArea.style.display = "block";
  
  // Communication score
  elements.commScore.textContent = result.scores.communicationScore || "—";
  
  // Strengths
  elements.strengthsList.innerHTML = "";
  (result.strengths || []).forEach(str => {
    const li = document.createElement("li");
    li.textContent = str;
    elements.strengthsList.appendChild(li);
  });
  
  // Suggestions
  elements.suggestionsList.innerHTML = "";
  (result.suggestions || []).forEach(sug => {
    const li = document.createElement("li");
    li.textContent = sug;
    elements.suggestionsList.appendChild(li);
  });
  
  // Full JSON
  elements.fullJson.textContent = JSON.stringify(result, null, 2);
  
  // Scroll to results
  elements.resultsArea.scrollIntoView({ behavior: "smooth" });
}

// ==========================================
// TRANSCRIPT TOGGLE
// ==========================================
function toggleTranscript() {
  const current = elements.liveTranscript.style.display;
  if (current === "none") {
    elements.liveTranscript.style.display = "block";
    elements.captureTranscriptBtn.textContent = "Hide Transcript";
  } else {
    elements.liveTranscript.style.display = "none";
    elements.captureTranscriptBtn.textContent = "Show Transcript";
  }
}

// ==========================================
// START APP
// ==========================================
window.addEventListener("DOMContentLoaded", init);

// ==========================================
// QUESTION MODAL
// ==========================================
function showQuestionModal(question) {
  elements.modalQuestion.textContent = question;
  elements.questionOverlay.classList.add("show");
  
  // Update progress UI
  elements.questionProgress.style.display = "block";
  elements.questionNum.textContent = state.currentQuestionIndex + 1;
  elements.currentQuestion.textContent = question;
  
  // Start timer for this question
  startQuestionTimer();
}

function closeQuestionModal() {
  elements.questionOverlay.classList.remove("show");
}

let timerInterval = null;
function startQuestionTimer() {
  if (timerInterval) clearInterval(timerInterval);
  
  const startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    elements.timer.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    // Update progress bar (assume 2 min max per question)
    const progress = Math.min((elapsed / 120) * 100, 100);
    elements.progressFill.style.width = progress + '%';
  }, 1000);
}

function stopQuestionTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
