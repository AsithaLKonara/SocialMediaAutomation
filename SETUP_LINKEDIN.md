# 🔗 LinkedIn API Setup Guide

Complete guide to set up LinkedIn API access for AutoPost AI.

## Prerequisites

- LinkedIn account
- Access to LinkedIn Developer Portal

## Step-by-Step Setup

### 1. Create a LinkedIn App

1. Go to [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
2. Click **"Create app"**
3. Fill in the form:
   - **App name**: `AutoPost AI` (or your preferred name)
   - **LinkedIn Page**: Select your page or create one
   - **Privacy Policy URL**: `http://localhost:3000/privacy` (or your actual URL)
   - **App logo**: Upload a logo (optional)
   - **App use case**: Select appropriate option
4. Click **"Create app"**

### 2. Request API Access

1. In your app dashboard, go to **"Products"** tab
2. Find **"Marketing Developer Platform"** product
3. Click **"Request access"**
4. Fill out the request form (explain you're building a content automation tool)
5. Wait for approval (usually 24-48 hours)

### 3. Configure OAuth Settings

1. Go to **"Auth"** tab
2. Add **Redirect URL**:
   - For development: `http://localhost:3000/api/auth/linkedin/callback`
   - For production: `https://yourdomain.com/api/auth/linkedin/callback`
3. Add **OAuth 2.0 scopes**:
   - `w_member_social` (required for posting)

### 4. Generate Access Token

**Option A: Using OAuth Flow (Recommended for Production)**

1. Use the OAuth redirect flow to get user consent
2. Exchange authorization code for access token
3. Store token securely

**Option B: Manual Token (Quick Start for Testing)**

1. Go to **"Auth"** tab
2. Scroll to **"Generate a token"**
3. Select scopes: `w_member_social`
4. Click **"Generate token"**
5. Copy the token immediately (it won't be shown again)

### 5. Add Token to Environment

Add to your `.env` file:

```env
LINKEDIN_ACCESS_TOKEN=your_token_here
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/linkedin/callback
```

## Token Management

### Token Expiration

LinkedIn access tokens expire after 60 days. You'll need to:

1. **Refresh tokens manually** (current implementation)
2. **Implement OAuth refresh flow** (recommended for production)

### Implementing OAuth Refresh (Future Enhancement)

```typescript
// lib/linkedin-client.ts - Add refresh logic
async refreshTokenIfNeeded() {
  // Check token expiration
  // If expired, use refresh_token to get new access_token
  // Update stored token
}
```

## Testing the Integration

1. Start your app: `npm run dev`
2. Add a topic and generate a post
3. Try publishing to LinkedIn
4. Check your LinkedIn feed for the post

## Common Issues

### Error: "Invalid access token"
- Token may have expired (60-day limit)
- Generate a new token from LinkedIn Developer Portal

### Error: "Insufficient permissions"
- Ensure `w_member_social` scope is granted
- Check app has "Marketing Developer Platform" access

### Error: "API permission denied"
- Verify your app is approved for Marketing Developer Platform
- Check token has correct scopes

### Error: "Invalid redirect URI"
- Ensure redirect URI in app matches `.env` configuration
- Must be exact match (including protocol and port)

## Production Considerations

1. **Token Storage**: Store tokens encrypted in database
2. **Token Refresh**: Implement automatic refresh before expiration
3. **Error Handling**: Handle API rate limits and errors gracefully
4. **Webhook Validation**: Validate LinkedIn webhooks if using them
5. **Security**: Never expose tokens in client-side code

## LinkedIn API Limits

- **Daily post limit**: Check LinkedIn Developer Portal for your account limits
- **Rate limiting**: Implement retry logic with exponential backoff
- **Content guidelines**: Follow LinkedIn's content policy

## Resources

- [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
- [Marketing Developer Platform](https://docs.microsoft.com/en-us/linkedin/marketing/)
- [OAuth 2.0 Guide](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication)

---

**Note**: LinkedIn API access requires approval and may take time. Start with manual token generation for testing, then implement OAuth flow for production.

