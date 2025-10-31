# 🌐 Multi-Platform Automation Guide

Complete guide for setting up and using SocialPost AI across all supported platforms.

## Supported Platforms

- ✅ **LinkedIn** - Professional networking
- ✅ **Facebook** - Social networking
- ✅ **Instagram** - Visual content platform
- ✅ **X (Twitter)** - Microblogging
- ✅ **TikTok** - Short-form video (requires video generation)

## Platform-Specific Content Rules

### LinkedIn
- **Length**: 150-200 words
- **Style**: Professional, educational, story-driven
- **Format**: Emojis, line breaks, closing question
- **Hashtags**: 3-5 relevant hashtags

### Facebook
- **Length**: 100-150 words
- **Style**: Friendly, community-oriented
- **Format**: Emojis, call-to-action
- **Hashtags**: 3-5 hashtags

### Instagram
- **Length**: 50-80 words
- **Style**: Visual, motivational, emotional
- **Format**: 5-10 trending hashtags
- **Media**: Requires image/video

### X (Twitter)
- **Length**: < 280 characters (including hashtags)
- **Style**: Punchy, conversational, direct
- **Format**: Strong hook, 2-3 hashtags
- **Threads**: Supports thread format

### TikTok
- **Length**: 15-second video script (50-75 words)
- **Style**: Hook + Value + CTA structure
- **Format**: Video script with visual suggestions
- **Media**: Requires video file upload

## Environment Configuration

### Required Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/autopost-ai

# AI Configuration
AI_PROVIDER=helagpt
HELAGPT_API_URL=https://helagpt-backend.vercel.app/api/chat

# Or use Ollama
# AI_PROVIDER=ollama
# OLLAMA_API_URL=http://localhost:11434/api/generate
# OLLAMA_MODEL=mistral
```

### Platform-Specific Credentials

```env
# LinkedIn
LINKEDIN_ACCESS_TOKEN=your_linkedin_token

# Facebook
FACEBOOK_ACCESS_TOKEN=your_facebook_token
FACEBOOK_PAGE_ID=your_page_id

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id

# X (Twitter)
X_BEARER_TOKEN=your_twitter_bearer_token
# Or
X_ACCESS_TOKEN=your_twitter_access_token

# TikTok (optional)
TIKTOK_ACCESS_TOKEN=your_tiktok_token

# Scheduling
POSTS_PER_DAY=2
SCHEDULE_TIMES=10:00,16:00
REQUIRE_APPROVAL=false
```

## Platform API Setup

### LinkedIn
1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Create app → Request "Marketing Developer Platform" access
3. Generate token with `w_member_social` scope
4. Add to `.env`: `LINKEDIN_ACCESS_TOKEN`

### Facebook
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create app → Add "Pages" product
3. Get Page Access Token
4. Get Page ID from your Facebook Page
5. Add to `.env`: `FACEBOOK_ACCESS_TOKEN` and `FACEBOOK_PAGE_ID`

### Instagram
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create Instagram Business Account (linked to Facebook Page)
3. Get Instagram Business Account ID
4. Generate access token with `instagram_basic` and `pages_show_list` permissions
5. Add to `.env`: `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_BUSINESS_ACCOUNT_ID`

### X (Twitter)
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create app → Enable OAuth 2.0
3. Generate Bearer Token or Access Token
4. Add to `.env`: `X_BEARER_TOKEN` or `X_ACCESS_TOKEN`

### TikTok
1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create app → Request Content Creation API access
3. Generate access token
4. **Note**: TikTok posting requires video file upload, not just URLs
5. Add to `.env`: `TIKTOK_ACCESS_TOKEN`

## Usage

### 1. Create Topic with Platform Selection

1. Go to "Topics" tab
2. Click "+ Add Topic"
3. Enter title and description
4. **Select platforms** (checkboxes)
5. Click "Create Topic"

### 2. Generate Multi-Platform Posts

**Automatic**: Scheduler generates posts every 2 hours

**Manual**: Click "Generate Posts" on any topic

The system will:
- Generate platform-optimized content for each selected platform
- Adapt tone, length, and format per platform
- Extract and format hashtags appropriately
- Create video scripts for TikTok

### 3. Review & Edit Posts

1. Go to "Posts" tab
2. Filter by platform or status
3. Review generated content
4. Edit if needed
5. Approve (if approval enabled)

### 4. Publish Posts

**Automatic**: Scheduler publishes 2 posts/day at scheduled times

**Manual**: Click "Publish Now" on any approved post

## Platform-Specific Features

### TikTok Video Scripts

TikTok posts include a structured video script:

```
[HOOK] - Attention-grabbing opening (5 seconds)
[MIDDLE] - Main value/point (7 seconds)
[CTA] - Call to action (3 seconds)
[VISUALS] - Suggested visual elements
```

Use these scripts to create videos manually or integrate with video generation services.

### Instagram Images

Instagram posts require an image URL. Options:
1. Generate images using AI (DALL-E, Stable Diffusion)
2. Use stock images
3. Upload to cloud storage and provide URL

Add `mediaUrl` field to posts before publishing to Instagram.

## Scheduler Behavior

The scheduler distributes posts evenly across platforms:

- **2 posts/day** = ~0.4 posts per platform per day
- Posts are selected from approved queue per platform
- Prioritizes older approved posts
- Respects scheduled times

## Troubleshooting

### Platform Authentication Errors

**401 Unauthorized**
- Token expired or invalid
- Regenerate access token
- Check token permissions

**403 Forbidden**
- Missing required permissions
- App not approved for platform
- Check developer portal settings

### Content Generation Issues

**Platform content too long/short**
- AI may generate content outside platform limits
- System automatically truncates if needed
- Manual editing recommended for best results

**Missing hashtags**
- System provides default hashtags if AI doesn't generate
- Can manually add/edit in post editor

### Scheduler Issues

**Posts not publishing**
- Check scheduler is running: `POST /api/scheduler/start`
- Verify database connection
- Check platform credentials are valid
- Review server logs for errors

**Wrong post distribution**
- Adjust `POSTS_PER_DAY` in `.env`
- Manually publish posts as needed
- Check platform filter in dashboard

## Best Practices

1. **Test Each Platform**: Generate test posts before enabling auto-posting
2. **Review Content**: Always review AI-generated content before publishing
3. **Platform Optimization**: Edit platform-specific content for best engagement
4. **Hashtag Strategy**: Research trending hashtags per platform
5. **Scheduling**: Post at optimal times per platform (use platform insights)
6. **Media Assets**: Prepare images/videos for Instagram and TikTok
7. **Token Management**: Rotate tokens regularly, implement refresh flows

## Advanced Features (Coming Soon)

- 🔄 Automatic token refresh
- 📊 Cross-platform analytics dashboard
- 🎨 AI image generation integration
- 🎥 Video generation from scripts
- 📅 Calendar view with platform filters
- 🔁 Content reposting based on performance
- 📈 Engagement tracking and optimization

---

**Need help?** Check platform-specific documentation or review API error messages in server logs.

