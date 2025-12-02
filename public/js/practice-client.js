// public/js/practice-client.js
// Lightweight client that: captures camera+mic, uses Web Speech API for transcript,
// uses face-api.js client-side for expressions, computes simple audio RMS,
// then sends consolidated metrics to server endpoint /api/practice/analyze

let videoEl = document.getElementById('video');
let startBtn = document.getElementById('startBtn');
let stopBtn = document.getElementById('stopBtn');
let liveTranscriptEl = document.getElementById('liveTranscript');
let exprSummaryEl = document.getElementById('exprSummary');
let audioSummaryEl = document.getElementById('audioSummary');
let resultsArea = document.getElementById('resultsArea');
let commScoreEl = document.getElementById('commScore');
let strengthsList = document.getElementById('strengthsList');
let suggestionsList = document.getElementById('suggestionsList');
let fullJson = document.getElementById('fullJson');
let captureTranscriptBtn = document.getElementById('captureTranscriptBtn');

let mediaStream = null;
let audioContext, analyser, sourceNode, dataArray;
let rmsInterval, faceInterval;
let startTime = 0;
let wordsSoFar = 0;
let fillerCount = 0;
let liveTranscript = "";
let expressionsRolling = [];
let speechRecognition;
let recognizing = false;

const FILLER_WORDS = ['um','uh','like','you know','so','actually','basically'];

async function startMedia() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoEl.srcObject = mediaStream;
    await videoEl.play();

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    sourceNode.connect(analyser);
    dataArray = new Float32Array(analyser.fftSize);

    expressionsRolling = [];
    liveTranscript = "";
    wordsSoFar = 0;
    fillerCount = 0;
    startTime = Date.now();

    faceInterval = setInterval(async () => {
      if (!videoEl || videoEl.readyState < 2) return;
      try {
        const detection = await faceapi.detectSingleFace(videoEl).withFaceExpressions();
        if (detection && detection.expressions) {
          expressionsRolling.push(detection.expressions);
          if (expressionsRolling.length > 20) expressionsRolling.shift();
          const avg = averageExpressions(expressionsRolling);
          exprSummaryEl.innerText = `Expressions: happy ${Math.round((avg.happy||0)*100)}% neutral ${Math.round((avg.neutral||0)*100)}%`;
        } else {
          exprSummaryEl.innerText = 'Expressions: (no face detected)';
        }
      } catch (err) { /* ignore */ }
    }, 450);

    rmsInterval = setInterval(() => {
      analyser.getFloatTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
      const rms = Math.sqrt(sum / dataArray.length);
      audioSummaryEl.innerText = `Audio RMS: ${rms.toFixed(4)}`;
    }, 300);

    startRecognition();

    startBtn.disabled = true;
    stopBtn.disabled = false;
  } catch (err) {
    alert('Allow camera & mic access and refresh. ' + (err.message||''));
    console.error(err);
  }
}

function stopMedia() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop());
    mediaStream = null;
  }
  if (audioContext) {
    audioContext.close(); audioContext = null;
  }
  if (rmsInterval) clearInterval(rmsInterval);
  if (faceInterval) clearInterval(faceInterval);
  stopRecognition();

  startBtn.disabled = false;
  stopBtn.disabled = true;
}

function averageExpressions(list) {
  const avg = {};
  if (!list.length) return {};
  const keys = Object.keys(list[0] || {});
  keys.forEach(k => avg[k] = 0);
  list.forEach(x => keys.forEach(k => avg[k] += (x[k] || 0)));
  keys.forEach(k => avg[k] = (avg[k] / list.length));
  return avg;
}

function startRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    liveTranscriptEl.innerText = "SpeechRecognition not supported (use Chrome).";
    return;
  }
  speechRecognition = new SpeechRecognition();
  speechRecognition.continuous = true;
  speechRecognition.interimResults = true;
  speechRecognition.lang = 'en-US';

  speechRecognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const res = event.results[i];
      const txt = res[0].transcript;
      if (res.isFinal) {
        liveTranscript += ' ' + txt;
        const tokens = txt.trim().split(/\s+/).filter(Boolean);
        wordsSoFar += tokens.length;
        const lower = txt.toLowerCase();
        FILLER_WORDS.forEach(f => {
          const re = new RegExp('\\b' + f + '\\b','g');
          const matches = lower.match(re);
          if (matches) fillerCount += matches.length;
        });
      } else interim += txt;
    }
    liveTranscriptEl.innerText = (liveTranscript + ' ' + interim).trim();
  };

  speechRecognition.onerror = (e) => console.warn('speech error', e);
  speechRecognition.onend = () => { if (recognizing) speechRecognition.start(); };

  recognizing = true;
  speechRecognition.start();
}

function stopRecognition() {
  recognizing = false;
  if (speechRecognition) { speechRecognition.onend = null; speechRecognition.stop(); speechRecognition = null; }
}

async function finalizeAndSend() {
  const durationSec = Math.max(1, Math.round((Date.now() - startTime)/1000));
  let avgRms = 0;
  if (analyser && dataArray) {
    analyser.getFloatTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i] * dataArray[i];
    avgRms = Math.sqrt(sum / dataArray.length);
  }
  const expressionsAvg = averageExpressions(expressionsRolling) || {};

  const payload = {
    transcript: (liveTranscript || '').trim(),
    durationSec,
    words: wordsSoFar,
    fillerCount,
    avgVolume: avgRms,
    expressions: expressionsAvg
  };

  try {
    const res = await fetch('/api/practice/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) { alert('Server analysis failed'); console.error(data); return; }
    resultsArea.style.display = 'block';
    commScoreEl.innerText = data.scores.communicationScore;
    strengthsList.innerHTML = data.strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('') || '<li>—</li>';
    suggestionsList.innerHTML = data.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('') || '<li>—</li>';
    fullJson.innerText = JSON.stringify(data, null, 2);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  } catch (err) { console.error(err); alert('Error sending data to server'); }
}

function escapeHtml(s) { return s ? s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) : ''; }

startBtn.addEventListener('click', async () => {
  resultsArea.style.display = 'none';
  // load face-api models from server public/models or use hosted CDN
  try {
    // try to load local models from /models first; if fail, load from CDN remote
    await faceapi.nets.ssdMobilenetv1.load('/models/');
    await faceapi.nets.faceLandmark68Net.load('/models/');
    await faceapi.nets.faceExpressionNet.load('/models/');
  } catch (e) {
    console.warn('Local face models not found, attempting CDN (slower).');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models/');
    await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models/');
    await faceapi.nets.faceExpressionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models/');
  }
  await startMedia();
});

stopBtn.addEventListener('click', async () => {
  stopMedia();
  await finalizeAndSend();
});

captureTranscriptBtn.addEventListener('click', () => {
  alert('Transcript:\n\n' + (liveTranscript || '(no transcript)'));
});
