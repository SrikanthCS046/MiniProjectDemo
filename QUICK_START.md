# GrowAi Backend - Quick Start (5 Minutes)

## Fastest Way to Get Running

### 1️⃣ Install Dependencies (1 minute)

```bash
npm install
```

### 2️⃣ Setup MongoDB (1 minute)

#### Option A: Local (Simplest)
```bash
# Download from mongodb.com/try/download/community
# Or use Homebrew on Mac:
brew install mongodb-community
brew services start mongodb-community

# Verify it works
mongosh
# Type: exit
```

#### Option B: Cloud (Recommended for Production)
Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create account → Create cluster → Copy connection string
- Paste in `.env` as `MONGO_URI`

### 3️⃣ Create `.env` File (1 minute)

Create file named `.env` in project root:

```env
PORT=8080
MONGO_URI=mongodb://127.0.0.1:27017/GrowAi
SESSION_SECRET=your_secret_key_here
NODE_ENV=development

# Optional: Add these for full features
HF_API_KEY=hf_your_token
JUDGE0_API_KEY=your_api_key
JSEARCH_API_KEY=your_api_key
```

### 4️⃣ Start Server (1 minute)

```bash
npm start
```

You should see:
```
Connected to MongoDB
Server running on port 8080
```

### 5️⃣ Test It! (1 minute)

Open browser: **http://localhost:8080/home**

Or test API:
```bash
curl -X POST http://localhost:8080/api/practice/analyze-answer \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Hello world","durationSec":5,"avgVolume":0.01,"expressions":{"happy":0.8,"neutral":0.2,"sad":0,"angry":0}}'
```

## 🎯 What Works Without API Keys

✅ Practice interview with scoring
✅ Resume upload & analysis
✅ Local code testing
✅ User sessions
✅ Interview questions
✅ Communication metrics
✅ Database storage

## 🔑 Add API Keys for Full Features

### Get HuggingFace API Key (30 seconds)
1. Go to [huggingface.co](https://huggingface.co)
2. Sign up → Settings → Access Tokens → New token
3. Copy and add to `.env`

### Get Judge0 & JSearch Keys (1 minute)
1. Go to [rapidapi.com](https://rapidapi.com)
2. Search "Judge0" → Subscribe (free) → Copy API Key
3. Search "JSearch" → Subscribe (free) → Same API Key
4. Add to `.env`

## 📁 Project Structure

```
project/
├── server/app.js ..................... Main backend
├── server/routes/ .................... API routes
├── server/controllers/ ............... Business logic
├── server/models/ .................... Database schemas
├── server/utils/ ..................... API clients
├── views/ ............................ Frontend (EJS)
├── public/ ........................... CSS/JS/Models
├── package.json ...................... Dependencies
├── .env ............................. Configuration
└── BACKEND_README.md ................ Full docs
```

## 🚀 Key Endpoints

```
POST /next-question                    → Get interview question
POST /api/practice/analyze-answer      → Analyze answer & score
POST /api/practice/save-session        → Save interview session
GET  /api/practice/history/:userId     → Get practice history

POST /api/resume/analyze               → Analyze resume & job fit
POST /api/jobs/search                  → Search jobs
POST /api/coding/run                   → Execute code
```

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| `Cannot find module 'express'` | Run `npm install` |
| `MongoDB connection refused` | Start MongoDB: `mongod` or use MongoDB Atlas |
| `Port 8080 already in use` | Change PORT in `.env` |
| `API rate limit` | Free tier has limits, wait or subscribe |

## 📱 Access Application

```
Home:          http://localhost:8080/home
Practice:      http://localhost:8080/practice
Resume:        http://localhost:8080/resume-analysis
Dashboard:     http://localhost:8080/dashboard
Problem Set:   http://localhost:8080/problem-set
```

## 💾 Database

MongoDB collections created automatically:
- `practicesessions` - Interview records
- `resumeanalyses` - Resume analysis results
- `jobsearches` - Job search history
- `codingatttempts` - Code submissions
- `users` - User accounts

View with MongoDB Compass: `mongodb://127.0.0.1:27017`

## 🎓 Next Steps

1. ✅ Run server
2. ✅ Test practice interview
3. ✅ Upload resume for analysis
4. ✅ Add API keys for extra features
5. ✅ Deploy to production

## 📚 Full Documentation

- **Setup Guide:** See `IMPLEMENTATION_GUIDE.md`
- **API Reference:** See `BACKEND_README.md`
- **Original App:** See `app.js`

## ✨ Features Included

### Interview Practice
- Real-time speech-to-text (Web Speech API)
- Facial expression analysis (face-api.js)
- Communication scoring algorithm
- Filler word detection
- Speaking rate analysis
- Tone analysis
- Practice history

### Resume Analysis
- PDF/DOCX/Image upload
- Skill extraction
- ATS score calculation
- Job matching
- Skill gap analysis
- Improvement suggestions

### Job Search
- Job API integration
- Save jobs
- Track applications
- Skill matching

### Code Execution
- Run code in 10+ languages
- Execution time tracking
- Error detection
- Output comparison

## 🎉 You're Ready!

Your complete GrowAi backend is ready to use!

### Commands Reference
```bash
npm install           # Install packages
npm start            # Run server
npm run dev          # Run with auto-reload
npm run server       # Run modular server
npm run dev-server   # Modular with auto-reload
```

Enjoy building with GrowAi! 🚀
