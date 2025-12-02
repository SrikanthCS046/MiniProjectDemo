# GrowAi Backend Implementation Guide

## Complete Setup & Integration Instructions

### Step 1: Install All Dependencies

```bash
npm install
```

This installs all packages from `package.json`:
- Express.js for server
- Mongoose for MongoDB
- PDF processing (pdf-parse, mammoth, tesseract.js)
- NLP libraries (compromise, sentiment)
- API clients (axios)
- Authentication (passport, passport-google-oauth20)
- File upload (multer)
- View engine (EJS)
- And more...

### Step 2: MongoDB Setup

#### Option A: Local MongoDB (Development)

**Install MongoDB Community Edition:**
- [Windows](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/)
- [macOS](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-macos/)
- [Linux](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

**Start MongoDB:**
```bash
# Windows
mongod

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Verify Connection:**
```bash
mongo # or mongosh for newer versions
```

#### Option B: MongoDB Atlas (Cloud - Recommended for Production)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account
3. Create new cluster
4. Get connection string
5. Update `.env`:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/GrowAi?retryWrites=true&w=majority
```

### Step 3: Environment Configuration

Create `.env` file in project root:

```env
# ============ SERVER ============
PORT=8080
NODE_ENV=development

# ============ DATABASE ============
# Local MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/GrowAi

# OR MongoDB Atlas (cloud)
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/GrowAi?retryWrites=true&w=majority

# ============ SESSION ============
SESSION_SECRET=your_super_secret_key_here_change_in_production

# ============ GOOGLE OAUTH ============
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback

# ============ FREE APIs ============
# HuggingFace (for emotion analysis) - Get from https://huggingface.co/settings/tokens
HF_API_KEY=hf_your_token_here

# Judge0 (code execution) - Get from RapidAPI
JUDGE0_API_KEY=your_judge0_api_key_here

# JSearch (job search) - Get from RapidAPI
JSEARCH_API_KEY=your_jsearch_api_key_here
```

### Step 4: Obtain API Keys

#### A. HuggingFace API Key (for Emotion Analysis)

1. Visit [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Sign up if needed
3. Click "New token"
4. Give it a name (e.g., "GrowAi")
5. Set role to "read"
6. Create token
7. Copy token and paste in `.env` as `HF_API_KEY`

**Note:** Free tier has rate limits (~300 requests/hour)

#### B. Judge0 API Key (for Code Execution)

1. Visit [rapidapi.com](https://rapidapi.com)
2. Sign up
3. Search for "Judge0"
4. Click first result (Judge0 CE)
5. Click "Subscribe to Test" (free tier)
6. Copy API Key from header
7. Add to `.env` as `JUDGE0_API_KEY`

#### C. JSearch API Key (for Job Search)

1. On RapidAPI, search "JSearch"
2. Click first result
3. Click "Subscribe to Test" (free tier)
4. Use same API Key from RapidAPI header (if using same account)
5. Add to `.env` as `JSEARCH_API_KEY`

### Step 5: Directory Structure Verification

Ensure directories exist:

```
project/
├── server/
│   ├── app.js
│   ├── routes/
│   │   ├── practice.js
│   │   ├── resume.js
│   │   ├── jobs.js
│   │   └── coding.js
│   ├── controllers/
│   │   ├── practiceController.js
│   │   ├── resumeController.js
│   │   ├── jobController.js
│   │   └── codingController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── PracticeSession.js
│   │   ├── ResumeAnalysis.js
│   │   ├── JobSearch.js
│   │   └── CodingAttempt.js
│   └── utils/
│       ├── aiApiClient.js
│       ├── jobApiClient.js
│       └── codeExecutor.js
├── public/
│   ├── js/
│   │   ├── practice-client.js
│   │   └── practice.js
│   ├── models/ (face-api models)
│   ├── css/
│   └── ...
├── views/ (all EJS templates)
├── model/ (original models)
├── config/ (passport config)
├── questions/ (interview questions)
├── app.js (original - kept for reference)
├── package.json
├── .env
└── BACKEND_README.md
```

### Step 6: Start the Server

#### Using Original app.js (Backward Compatible)

```bash
npm start
# or
node app.js
```

#### Using New Modular Server

```bash
npm run server
# or
node server/app.js
```

#### Development Mode (Auto-reload)

```bash
npm run dev
# or
npm run dev-server
```

**Output should show:**
```
Connected to MongoDB
Server running on port 8080
```

### Step 7: Verify Installation

#### Test Basic Endpoints

Using curl or Postman:

```bash
# Get practice page
curl http://localhost:8080/practice

# Get next question
curl -X POST http://localhost:8080/next-question \
  -H "Content-Type: application/json" \
  -d '{"role":"General","index":0}'

# Analyze answer
curl -X POST http://localhost:8080/api/practice/analyze-answer \
  -H "Content-Type: application/json" \
  -d '{
    "transcript":"I am very excited about this opportunity",
    "durationSec":10,
    "avgVolume":0.01,
    "expressions":{"happy":0.8,"neutral":0.2,"sad":0,"angry":0}
  }'
```

#### Check MongoDB Connection

```bash
# In mongo/mongosh shell
show dbs
use GrowAi
show collections
```

### Step 8: Frontend Integration

The existing frontend (EJS templates) already integrates with backend:

1. **Practice Page** (`views/practice.ejs`)
   - Uses `/api/practice/analyze-answer`
   - Calls `/api/practice/save-session` for history
   - Communicates with client-side WebRTC

2. **Resume Page** (`views/resume.ejs`)
   - Uses `/api/resume/analyze` endpoint
   - File upload handled by existing code

3. **Dashboard** (`views/dashboard.ejs`)
   - Can display practice history
   - Shows statistics

4. **Problem Set** (`views/problemSet.ejs`)
   - Can integrate `/api/coding/run` endpoint
   - Shows code execution results

### Step 9: Testing the Complete Flow

#### Test 1: Practice Interview Flow

1. Go to `/practice`
2. Select role and company
3. Click "Start Interview"
4. Allow camera/microphone permissions
5. Answer a question
6. Click "End Interview"
7. See results and scores

#### Test 2: Resume Analysis

1. Go to `/resume-analysis`
2. Upload a resume (PDF/DOCX)
3. Enter job description
4. See skill gap and ATS score

#### Test 3: Job Search

1. Use Postman to test:
```bash
curl -X POST http://localhost:8080/api/jobs/search \
  -H "Content-Type: application/json" \
  -d '{"query":"Software Engineer","location":"San Francisco","userId":"test123"}'
```

#### Test 4: Code Execution

1. Use Postman:
```bash
curl -X POST http://localhost:8080/api/coding/run \
  -H "Content-Type: application/json" \
  -d '{
    "code":"print(\"Hello World\")",
    "language":"python",
    "userId":"test123"
  }'
```

### Step 10: Database Management

#### View Data with MongoDB Compass

1. Install [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect to `mongodb://127.0.0.1:27017`
3. Navigate to `GrowAi` database
4. View collections:
   - `practicesessions` - Interview practice records
   - `resumeanalyses` - Resume analysis results
   - `jobsearches` - Job search history
   - `codingatttempts` - Code submission records
   - `users` - User accounts

#### Export Data

```bash
# Export collection to JSON
mongoexport --db GrowAi --collection practicesessions --out sessions.json

# Import data
mongoimport --db GrowAi --collection practicesessions --file sessions.json
```

## Deployment Instructions

### Deploy to Replit

1. Create new Replit project from GitHub repo
2. Add `package.json` (already created)
3. Add `.env` secrets in Replit
4. Create `replit.nix` with MongoDB:
```nix
{ pkgs }: {
  deps = [
    pkgs.nodejs_18
    pkgs.mongodb
  ];
}
```
5. Set run command: `npm start`
6. Click Run

### Deploy to Railway

1. Push code to GitHub
2. Connect GitHub repo to Railway
3. Add environment variables in Railway dashboard
4. Railway auto-detects Node.js and starts server
5. Get public URL from Railway

### Deploy to Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create grow-ai-backend

# Add MongoDB URI
heroku config:set MONGO_URI=your_mongodb_atlas_uri

# Add other secrets
heroku config:set HF_API_KEY=your_key
heroku config:set JUDGE0_API_KEY=your_key

# Deploy
git push heroku main
```

## Troubleshooting

### Error: "Cannot find module 'express'"

**Solution:**
```bash
npm install
npm install express mongoose dotenv
```

### Error: "MongoDB connection refused"

**Solution:**
- Ensure MongoDB is running (`mongod`)
- Check MONGO_URI in `.env`
- Try MongoDB Atlas instead: `mongodb+srv://...`

### Error: "CORS error when calling API"

**Solution:**
- Add CORS headers to response
- Check API endpoint paths
- Verify request headers

### Error: "API rate limit exceeded"

**Solution:**
- Wait 60 seconds
- Free tier has limits
- Subscribe to paid plan for production

### Error: "Face models not loading"

**Solution:**
- Check `/public/models/` directory exists
- Models fall back to CDN automatically
- Manually download from: https://github.com/vladmandic/face-api

### Error: "Code execution timeout"

**Solution:**
- Free Judge0 tier: 2-3 second limit
- Optimize code
- Subscribe to Judge0 paid tier

## File Checklist

✅ Created `/server/app.js` - Main modular server
✅ Created `/server/routes/practice.js` - Practice routes
✅ Created `/server/routes/resume.js` - Resume routes
✅ Created `/server/routes/jobs.js` - Job routes
✅ Created `/server/routes/coding.js` - Coding routes
✅ Created `/server/controllers/practiceController.js`
✅ Created `/server/controllers/resumeController.js`
✅ Created `/server/controllers/jobController.js`
✅ Created `/server/controllers/codingController.js`
✅ Created `/server/models/User.js`
✅ Created `/server/models/PracticeSession.js`
✅ Created `/server/models/ResumeAnalysis.js`
✅ Created `/server/models/JobSearch.js`
✅ Created `/server/models/CodingAttempt.js`
✅ Created `/server/utils/aiApiClient.js`
✅ Created `/server/utils/jobApiClient.js`
✅ Created `/server/utils/codeExecutor.js`
✅ Created `package.json` - Dependencies
✅ Created `.env` - Configuration template
✅ Created `BACKEND_README.md` - API Documentation
✅ Created `IMPLEMENTATION_GUIDE.md` - This guide

## What's Ready

### Core Backend Features
✅ Express.js server with modular routes
✅ MongoDB database with 5 schemas
✅ Practice interview analysis with scoring
✅ Resume ATS analysis with skill extraction
✅ Job search integration (with API key)
✅ Code execution support (with API key)
✅ User authentication framework
✅ Session management

### Frontend Integration
✅ Practice page communicates with backend
✅ Resume analysis endpoints ready
✅ Job search API ready
✅ Code editor can submit code

### Optional Enhancements
- Add real-time WebSocket support
- Implement peer review system
- Add AI-generated questions
- Create mobile app
- Add video recording storage
- Implement payment system

## Quick Reference

```bash
# Install dependencies
npm install

# Start MongoDB locally
mongod

# Run development server with auto-reload
npm run dev

# Run production server
npm start

# Test API endpoints
curl http://localhost:8080/practice

# Access application
http://localhost:8080/home
```

## Next Steps

1. ✅ Install all dependencies
2. ✅ Set up MongoDB (local or Atlas)
3. ✅ Get API keys from free services
4. ✅ Configure `.env` file
5. ✅ Start server and test
6. ✅ Test all features
7. ✅ Deploy to production

## Support

For issues:
1. Check logs in terminal
2. Review `.env` configuration
3. Verify MongoDB connection
4. Test API with Postman
5. Check database with MongoDB Compass

Good luck with GrowAi! 🚀
