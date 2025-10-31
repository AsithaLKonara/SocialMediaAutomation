import axios from 'axios';

interface FacebookPostOptions {
  content: string;
  hashtags?: string[];
  mediaUrl?: string;
}

interface FacebookPostResponse {
  id: string;
  status: 'success' | 'error';
  message?: string;
}

class FacebookClient {
  private accessToken: string;
  private pageId: string;
  private apiBaseUrl: string = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = process.env.FACEBOOK_ACCESS_TOKEN || '';
    this.pageId = process.env.FACEBOOK_PAGE_ID || '';
    
    if (!this.accessToken) {
      console.warn('Facebook access token not configured. Posting will fail.');
    }
    if (!this.pageId) {
      console.warn('Facebook Page ID not configured. Posting will fail.');
    }
  }

  async postToFacebook(options: FacebookPostOptions): Promise<FacebookPostResponse> {
    const { content, hashtags = [], mediaUrl } = options;

    if (!this.accessToken || !this.pageId) {
      throw new Error('Facebook access token and Page ID are required');
    }

    try {
      // Format content with hashtags
      const formattedContent = hashtags.length > 0
        ? `${content}\n\n${hashtags.map(tag => `#${tag}`).join(' ')}`
        : content;

      // Facebook Graph API - Create Page Post
      const response = await axios.post(
        `${this.apiBaseUrl}/${this.pageId}/feed`,
        {
          message: formattedContent,
          access_token: this.accessToken,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.id || 'unknown',
        status: 'success',
        message: 'Post published successfully to Facebook',
      };
    } catch (error: any) {
      console.error('Facebook Post Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Facebook authentication failed. Please refresh your access token.');
      } else if (error.response?.status === 403) {
        throw new Error('Facebook API permission denied. Check your app permissions.');
      }

      throw new Error(`Failed to post to Facebook: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getPostStats(postId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/${postId}/insights`,
        {
          params: {
            metric: 'post_impressions,post_engaged_users,post_clicks',
            access_token: this.accessToken,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Facebook Stats Error:', error.response?.data || error.message);
      return null;
    }
  }
}

export const facebookClient = new FacebookClient();
export default facebookClient;

