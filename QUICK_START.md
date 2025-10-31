# ⚡ Quick Start Guide

Get AutoPost AI running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up MongoDB

**Option A: Local MongoDB**
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Or using Docker
docker run -d -p 27017:27017 --name mongodb mongo
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Copy the connection string
4. Add it to `.env` as `MONGODB_URI`

## Step 3: Configure Environment

Create `.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/autopost-ai
AI_PROVIDER=helagpt
HELAGPT_API_URL=https://helagpt-backend.vercel.app/api/chat
POSTS_PER_DAY=2
SCHEDULE_TIMES=10:00,16:00
REQUIRE_APPROVAL=false
```

**For LinkedIn Integration** (optional initially):
```env
LINKEDIN_ACCESS_TOKEN=your_token_here
```

## Step 4: Run the Application

```bash
npm run dev
```

Open http://localhost:3000

## Step 5: Test It Out

1. Click "+ Add Topic"
2. Enter: "Next.js server actions"
3. Click "Generate Post"
4. Review the AI-generated post
5. Click "Approve" then "Publish Now" (if LinkedIn token is set)

## 🎉 Done!

Your LinkedIn automation system is ready!

---

## Optional: Use Local AI (Ollama)

1. Install Ollama:
```bash
brew install ollama
```

2. Start Ollama:
```bash
ollama serve
```

3. Pull a model:
```bash
ollama pull mistral
```

4. Update `.env`:
```env
AI_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral
```

## Optional: LinkedIn API Setup

1. Go to https://www.linkedin.com/developers/
2. Create an app
3. Request "Marketing Developer Platform" access
4. Generate token with `w_member_social` scope
5. Add to `.env`

---

**Need help?** Check the full README.md for detailed documentation.

