import axios from 'axios';

interface LinkedInPostOptions {
  content: string;
  hashtags?: string[];
}

interface LinkedInPostResponse {
  id: string;
  status: 'success' | 'error';
  message?: string;
}

class LinkedInClient {
  private accessToken: string;
  private apiBaseUrl: string = 'https://api.linkedin.com/v2';

  constructor() {
    this.accessToken = process.env.LINKEDIN_ACCESS_TOKEN || '';
    if (!this.accessToken) {
      console.warn('LinkedIn access token not configured. Posting will fail.');
    }
  }

  private async refreshTokenIfNeeded(): Promise<void> {
    // TODO: Implement token refresh logic using OAuth 2.0
    // For now, assuming access token is manually set or long-lived
  }

  async getProfile(): Promise<any> {
    try {
      await this.refreshTokenIfNeeded();
      const response = await axios.get(`${this.apiBaseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('LinkedIn Profile Error:', error.response?.data || error.message);
      throw new Error(`Failed to fetch LinkedIn profile: ${error.message}`);
    }
  }

  async postToLinkedIn(options: LinkedInPostOptions): Promise<LinkedInPostResponse> {
    const { content, hashtags = [] } = options;

    if (!this.accessToken) {
      throw new Error('LinkedIn access token is not configured');
    }

    try {
      await this.refreshTokenIfNeeded();

      // Get user profile to get person URN
      const profile = await this.getProfile();
      const personUrn = `urn:li:person:${profile.id}`;

      // Format content with hashtags
      const formattedContent = hashtags.length > 0
        ? `${content}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`
        : content;

      // LinkedIn API v2 UGC Post
      const ugcResponse = await axios.post(
        'https://api.linkedin.com/v2/ugcPosts',
        {
          author: personUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: formattedContent,
              },
              shareMediaCategory: 'NONE',
            },
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: ugcResponse.data.id || 'unknown',
        status: 'success',
        message: 'Post published successfully',
      };
    } catch (error: any) {
      console.error('LinkedIn Post Error:', error.response?.data || error.message);
      
      // Handle specific LinkedIn API errors
      if (error.response?.status === 401) {
        throw new Error('LinkedIn authentication failed. Please refresh your access token.');
      } else if (error.response?.status === 403) {
        throw new Error('LinkedIn API permission denied. Check your app permissions.');
      }

      throw new Error(`Failed to post to LinkedIn: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPostStats(postId: string): Promise<any> {
    try {
      await this.refreshTokenIfNeeded();
      // LinkedIn API for post analytics (requires specific permissions)
      // This is a placeholder - actual implementation depends on LinkedIn API version
      const response = await axios.get(
        `${this.apiBaseUrl}/socialActions/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('LinkedIn Stats Error:', error.response?.data || error.message);
      // Analytics might not be available, so we don't throw
      return null;
    }
  }
}

export const linkedInClient = new LinkedInClient();
export default linkedInClient;

