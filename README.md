# 🌐 SocialPost AI - Multi-Platform AI Content Automation System

AI-powered multi-platform content automation system that generates and schedules posts automatically for **LinkedIn, Facebook, Instagram, X (Twitter), and TikTok** using AI (HelaGPT/Ollama) and platform APIs.

## ✨ Features

- 🌐 **Multi-Platform Support**: Automatically generates platform-optimized content for LinkedIn, Facebook, Instagram, X (Twitter), and TikTok
- 🤖 **AI-Powered Content Generation**: Uses HelaGPT or local Ollama with platform-specific prompts and formatting
- 📅 **Automatic Scheduling**: Posts 2 per day per platform at scheduled times (configurable)
- 📊 **Dashboard**: Beautiful web interface to manage topics, review posts, and track statistics
- 🔄 **Approval Workflow**: Optional manual approval before posting
- 🎯 **Topic Management**: Add topics once, generate posts for all selected platforms
- 📈 **Analytics Dashboard**: Track topics and posts status across all platforms
- 🎨 **Platform-Specific Optimization**: Each platform gets content tailored to its audience and format

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Node.js
- **Database**: PostgreSQL
- **AI**: HelaGPT API or Ollama (local) with platform-specific prompts
- **Scheduler**: node-cron (multi-platform distribution)
- **Platform Integrations**: 
  - LinkedIn API v2
  - Facebook Graph API
  - Instagram Graph API
  - X (Twitter) API v2
  - TikTok Content Creation API

## 📦 Installation

1. **Clone or navigate to the project directory**

```bash
cd "linked-In automation"
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Database (PostgreSQL)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=socialpost_ai
# Or use DATABASE_URL: postgresql://user:password@localhost:5432/socialpost_ai

# AI Configuration
AI_PROVIDER=helagpt
# Options: helagpt, ollama

# HelaGPT API
HELAGPT_API_URL=https://helagpt-backend.vercel.app/api/chat

# Ollama (if using local AI)
OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral

# Platform API Credentials
# LinkedIn
LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token

# Facebook
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
FACEBOOK_PAGE_ID=your_facebook_page_id

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id

# X (Twitter)
X_BEARER_TOKEN=your_twitter_bearer_token
# Or use X_ACCESS_TOKEN instead

# TikTok (optional)
TIKTOK_ACCESS_TOKEN=your_tiktok_access_token

# Scheduling
POSTS_PER_DAY=2
SCHEDULE_TIMES=10:00,16:00
# Times in 24-hour format, comma-separated

# Optional: Manual approval before posting
REQUIRE_APPROVAL=false
```

4. **Set up PostgreSQL**

Make sure PostgreSQL is running locally.

**Local PostgreSQL:**
```bash
# macOS (using Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start

# Windows: Download installer from postgresql.org
```

**Create database and import topics:**
```bash
# Setup database schema
npm run db:setup

# Import all 200 topics from topic_List.txt
npm run db:import-topics
```

5. **Set up LinkedIn API Access**

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create a new app
3. Request access to "Marketing Developer Platform" permissions
4. Generate an access token with `w_member_social` scope
5. Add the token to your `.env` file

## 🚀 Running the Application

1. **Development mode**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

2. **Start the scheduler**

The scheduler automatically starts in production mode. For development, you can manually trigger it via API:

```bash
curl -X POST http://localhost:3000/api/scheduler/start
```

Or set `AUTO_START_SCHEDULER=true` in your `.env` file.

3. **Build for production**

```bash
npm run build
npm start
```

## 📖 Usage

### 1. Add Topics

1. Open the dashboard at `http://localhost:3000`
2. Go to the "Topics" tab
3. Click "+ Add Topic"
4. Enter a title (e.g., "Next.js server actions")
5. Optionally add a description
6. Click "Create Topic"

### 2. Generate Posts

**Option A: Manual Generation**
- Click "Generate Post" button next to any pending topic

**Option B: Automatic Generation**
- The scheduler automatically generates posts for pending topics every 2 hours

### 3. Review & Edit Posts

1. Go to the "Posts" tab
2. Review generated posts
3. Edit content or hashtags if needed
4. Approve posts (if `REQUIRE_APPROVAL=true`)

### 4. Publish Posts

**Option A: Manual Publishing**
- Click "Publish Now" on any approved post

**Option B: Automatic Publishing**
- The scheduler publishes approved posts at scheduled times (default: 10:00 AM and 4:00 PM)

### 5. Monitor Statistics

- Go to the "Statistics" tab to see:
  - Total topics and posts
  - Status breakdown
  - System information

## 🔧 Configuration

### AI Provider

**HelaGPT (Default)**
```env
AI_PROVIDER=helagpt
HELAGPT_API_URL=https://helagpt-backend.vercel.app/api/chat
```

**Ollama (Local)**
```env
AI_PROVIDER=ollama
OLLAMA_API_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral
```

First, install Ollama:
```bash
# macOS
brew install ollama

# Start Ollama
ollama serve

# Pull a model
ollama pull mistral
```

### Scheduling

Customize posting schedule in `.env`:

```env
POSTS_PER_DAY=2
SCHEDULE_TIMES=09:00,14:00,18:00
```

### Approval Workflow

Enable manual approval:

```env
REQUIRE_APPROVAL=true
```

When enabled, generated posts start as "draft" and must be approved before publishing.

## 📁 Project Structure

```
linked-In automation/
├── app/
│   ├── api/
│   │   ├── topics/          # Topic management API
│   │   ├── posts/           # Post management API
│   │   │   ├── generate/    # AI post generation
│   │   │   └── publish/     # LinkedIn publishing
│   │   └── scheduler/       # Scheduler control
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Dashboard home
├── components/
│   ├── TopicManager.tsx     # Topic management UI
│   ├── PostManager.tsx      # Post management UI
│   └── StatsDashboard.tsx  # Statistics dashboard
├── lib/
│   ├── db.ts                # MongoDB connection
│   ├── ai-client.ts         # AI integration
│   ├── linkedin-client.ts   # LinkedIn API
│   └── scheduler.ts         # Post scheduler
├── models/
│   ├── Topic.ts             # Topic model
│   └── Post.ts              # Post model
└── package.json
```

## 🔒 Security Notes

- **Never commit `.env` file** to version control
- Store LinkedIn access tokens securely
- Use environment variables for all sensitive data
- Consider implementing OAuth 2.0 token refresh for production

## 🐛 Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
mongosh --eval "db.version()"

# Or check Docker container
docker ps | grep mongo
```

### LinkedIn API Errors

- Verify access token is valid
- Check API permissions in LinkedIn Developer Portal
- Ensure token has `w_member_social` scope

### AI Generation Fails

- **HelaGPT**: Check API endpoint is accessible
- **Ollama**: Ensure Ollama is running (`ollama serve`)
- Check model is installed (`ollama list`)

### Scheduler Not Running

- Set `AUTO_START_SCHEDULER=true` in `.env`
- Or manually start via API: `POST /api/scheduler/start`
- Check server logs for cron job errors

## 🚧 Future Enhancements

- [ ] LinkedIn OAuth 2.0 token refresh
- [ ] Post analytics integration
- [ ] Calendar view for scheduled posts
- [ ] Export to CSV/Notion
- [ ] Style control (tone selection)
- [ ] Multiple LinkedIn account support
- [ ] Post templates
- [ ] Content scheduling calendar

## 📄 License

MIT License - feel free to use this project for your automation needs!

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

---

**Built with ❤️ using Next.js, TypeScript, and AI**

