# GrowAi Backend Setup & Documentation

Complete backend implementation for AI-powered interview preparation and communication skill training application.

## Overview

This backend provides:
- **Mock Interview Practice** with communication skill scoring
- **Resume Analysis** with ATS scoring and skill gap analysis
- **Job Search Integration** with free job APIs
- **Code Execution** for technical interviews
- **Database Management** with MongoDB

## Tech Stack

- **Runtime**: Node.js
- **Server**: Express.js
- **Database**: MongoDB + Mongoose
- **APIs**: HuggingFace (AI), Judge0 (code execution), JSearch (job search)
- **File Processing**: PDF Parse, Mammoth, Tesseract.js
- **NLP**: Compromise.js, Sentiment.js, String-similarity

## Project Structure

```
project/
├── server/
│   ├── app.js                    # Main server file
│   ├── routes/
│   │   ├── practice.js          # Interview practice routes
│   │   ├── resume.js            # Resume analysis routes
│   │   ├── jobs.js              # Job search routes
│   │   └── coding.js            # Code execution routes
│   ├── controllers/
│   │   ├── practiceController.js # Practice business logic
│   │   ├── resumeController.js   # Resume analysis logic
│   │   ├── jobController.js      # Job search logic
│   │   └── codingController.js   # Code execution logic
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── PracticeSession.js    # Practice session schema
│   │   ├── ResumeAnalysis.js     # Resume analysis schema
│   │   ├── JobSearch.js          # Job search schema
│   │   └── CodingAttempt.js      # Coding attempt schema
│   └── utils/
│       ├── aiApiClient.js        # HuggingFace API client
│       ├── jobApiClient.js       # JSearch API client
│       └── codeExecutor.js       # Judge0 API client
├── views/                        # EJS templates (frontend)
├── public/                       # Static files (CSS, JS)
├── model/                        # Original models
├── questions/                    # Interview questions
├── config/                       # Passport config
└── utils/                        # Utilities
```

## Installation

### 1. Install Dependencies

```bash
npm install express mongoose mongodb multer pdf-parse mammoth tesseract.js
npm install compromise sentiment string-similarity axios dotenv
npm install express-session passport passport-google-oauth20 body-parser
npm install method-override ejs-mate ejs node-notifier
npm install -D nodemon
```

### 2. Environment Setup

Create `.env` file in project root:

```env
# Server
PORT=8080
NODE_ENV=development

# Database
MONGO_URI=mongodb://127.0.0.1:27017/GrowAi

# Session
SESSION_SECRET=your_secret_key_here

# APIs (Optional - for enhanced features)
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
JUDGE0_API_KEY=your_judge0_api_key
JSEARCH_API_KEY=your_jsearch_api_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**MongoDB Atlas (Cloud):**
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/GrowAi
```

### 4. Run Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Server runs on http://localhost:8080
```

## API Endpoints

### Practice Interview

#### Get Next Question
```
POST /api/practice/next-question
Body: { role: "Software Engineer", index: 0 }
Response: { ok: true, question: "..." }
```

#### Analyze Answer
```
POST /api/practice/analyze-answer
Body: {
  transcript: "...",
  durationSec: 45,
  avgVolume: 0.015,
  expressions: { happy: 0.8, neutral: 0.2, sad: 0, angry: 0 }
}
Response: {
  ok: true,
  meta: { words, wpm, fillerCount },
  scores: { wpmScore, fillerScore, volumeScore, facialScore, toneScore, communicationScore },
  strengths: [...],
  suggestions: [...]
}
```

#### Save Practice Session
```
POST /api/practice/save-session
Body: {
  userId: "user_id",
  role: "Software Engineer",
  company: "Google",
  interviewType: "behavioral",
  questions: [...],
  overallScore: 85
}
Response: { ok: true, sessionId: "..." }
```

#### Get Practice History
```
GET /api/practice/history/:userId
Response: { ok: true, sessions: [...] }
```

### Resume Analysis

#### Analyze Resume
```
POST /api/resume/analyze
Body: {
  userId: "user_id",
  resumeText: "...",
  jobDescription: "..."
}
Response: {
  ok: true,
  analysis: {
    resumeSkills: [...],
    jobSkills: [...],
    missingSkills: [...],
    matchPercentage: 85,
    atsScore: 82,
    suggestions: [...],
    strengths: [...]
  }
}
```

#### Get Resume History
```
GET /api/resume/history/:userId
Response: { ok: true, analyses: [...] }
```

### Job Search

#### Search Jobs
```
POST /api/jobs/search
Body: {
  userId: "user_id",
  query: "Software Engineer",
  location: "San Francisco"
}
Response: {
  ok: true,
  jobs: [{
    jobId, jobTitle, company, location, jobUrl,
    description, salary, jobType, postedDate, applicantCount
  }]
}
```

#### Get Saved Jobs
```
GET /api/jobs/saved/:userId
Response: { ok: true, jobs: [...] }
```

#### Save Job
```
POST /api/jobs/save
Body: { userId: "user_id", jobId: "job_id" }
Response: { ok: true, job: {...} }
```

#### Mark Applied
```
POST /api/jobs/mark-applied
Body: { userId: "user_id", jobId: "job_id" }
Response: { ok: true, job: {...} }
```

### Code Execution

#### Run Code
```
POST /api/coding/run
Body: {
  userId: "user_id",
  code: "print('Hello')",
  language: "python",
  input: "",
  expectedOutput: ""
}
Response: {
  ok: true,
  result: {
    status, output, errorMessage, executionTime, memoryUsed, verdict, attemptId
  }
}
```

#### Submit Problem
```
POST /api/coding/submit
Body: {
  userId: "user_id",
  code: "...",
  language: "python",
  problemId: "problem_1",
  problemTitle: "Two Sum",
  problemDescription: "...",
  input: "...",
  expectedOutput: "..."
}
Response: { ok: true, attempt: {...}, result: {...} }
```

#### Get Attempt History
```
GET /api/coding/history/:userId
Response: { ok: true, attempts: [...] }
```

## Free API Keys Setup

### 1. HuggingFace (Emotion Analysis & NLP)

1. Go to [huggingface.co](https://huggingface.co)
2. Create account
3. Navigate to Settings → Access Tokens
4. Create new token (read access)
5. Copy and add to `.env`:
```
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
```

### 2. RapidAPI (Judge0 Code Execution)

1. Go to [rapidapi.com](https://rapidapi.com)
2. Search "Judge0"
3. Click "Subscribe to Test" (free tier)
4. Copy API Key
5. Add to `.env`:
```
JUDGE0_API_KEY=your_api_key
```

### 3. RapidAPI (JSearch Job API)

1. On RapidAPI, search "JSearch"
2. Subscribe to free tier
3. Copy API Key (same as Judge0 if using same account)
4. Add to `.env`:
```
JSEARCH_API_KEY=your_api_key
```

## Database Schemas

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String,
  targetRole: String,
  targetCompanies: [String],
  skillsProfile: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### PracticeSession
```javascript
{
  userId: ObjectId,
  role: String,
  company: String,
  interviewType: String (behavioral/technical),
  persona: String,
  questions: [{
    questionText: String,
    answer: String,
    duration: Number,
    wordCount: Number,
    fillerCount: Number,
    scores: { communicationScore, wpmScore, etc },
    expressions: Object
  }],
  overallCommunicationScore: Number,
  strengths: [String],
  suggestions: [String],
  createdAt: Date
}
```

### ResumeAnalysis
```javascript
{
  userId: ObjectId,
  resumeText: String,
  jobDescription: String,
  resumeSkills: [String],
  jobSkills: [String],
  missingSkills: [String],
  matchPercentage: Number (0-100),
  atsScore: Number (0-100),
  suggestions: [String],
  strengths: [String],
  createdAt: Date
}
```

### JobSearch
```javascript
{
  userId: ObjectId,
  jobId: String,
  jobTitle: String,
  company: String,
  location: String,
  jobUrl: String,
  salary: String,
  jobType: String,
  saved: Boolean,
  applied: Boolean,
  createdAt: Date
}
```

### CodingAttempt
```javascript
{
  userId: ObjectId,
  problemId: String,
  code: String,
  language: String,
  status: String (pending/accepted/runtime_error/etc),
  output: String,
  errorMessage: String,
  executionTime: Number,
  memoryUsed: Number,
  timeComplexity: String,
  spaceComplexity: String,
  createdAt: Date
}
```

## Communication Scoring Algorithm

The communication score is calculated from 5 components:

1. **WPM Score (25%)**
   - Ideal: 110-150 WPM
   - Penalty for deviations

2. **Filler Score (20%)**
   - Tracks: um, uh, like, you know, actually, so, basically
   - Penalizes excessive filler usage

3. **Volume Score (15%)**
   - Analyzes audio RMS level
   - Ensures speaker is loud enough

4. **Facial Score (20%)**
   - Combines happy, neutral expressions
   - Penalizes sad/angry expressions

5. **Tone Score (20%)**
   - Sentiment analysis
   - Promotes positive, confident tone

**Final Score = (wpm×0.25 + filler×0.20 + volume×0.15 + facial×0.20 + tone×0.20)**

## Features & Limitations

### Implemented Features
✅ Speech-to-text using Web Speech API (client-side)
✅ Facial expression analysis using face-api.js
✅ Communication scoring with NLP
✅ Resume ATS scoring with skill extraction
✅ Job search integration
✅ Code execution with Judge0
✅ MongoDB persistence
✅ Practice session history
✅ User authentication

### Limitations
⚠️ Code execution limited to free tier (2-3 sec timeout)
⚠️ Job API requires RapidAPI subscription
⚠️ HuggingFace free tier has rate limits
⚠️ OCR (Tesseract) may be slow on large PDFs
⚠️ Facial expression analysis is client-side only

## Troubleshooting

### MongoDB Connection Error
```
Solution: Ensure MongoDB is running (mongod)
or use valid MongoDB Atlas connection string
```

### API Rate Limits
```
Solution: Free tier has limits. Wait 60 seconds or subscribe to paid plans
```

### Face-API Models Not Loading
```
Solution: Check /public/models/ folder exists or use CDN (slower)
```

### Code Execution Timeout
```
Solution: Free tier has 2-3 second limit. Optimize code or use paid Judge0
```

## Development Tips

1. **Test API endpoints** using Postman or VS Code REST Client
2. **Monitor server logs** for errors and warnings
3. **Use MongoDB Compass** to visualize database
4. **Enable verbose logging** in development
5. **Cache API responses** to avoid rate limits

## Next Steps

1. Deploy to Replit/Railway/Heroku
2. Add more interview question categories
3. Integrate with LinkedIn for job matching
4. Add video recording and playback
5. Implement peer feedback system
6. Add real-time collaborative practice

## Support & Resources

- [Express.js Docs](https://expressjs.com/)
- [MongoDB Docs](https://docs.mongodb.com/)
- [HuggingFace API](https://huggingface.co/docs/api-inference)
- [Judge0 API](https://rapidapi.com/RapidAPI-Team/api/judge0-ce)
- [JSearch API](https://rapidapi.com/Rasheed-Al-motomi/api/jsearch)

## License

MIT
