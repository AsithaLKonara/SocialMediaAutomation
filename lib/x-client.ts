import axios from 'axios';

interface XPostOptions {
  content: string;
  hashtags?: string[];
  mediaIds?: string[];
}

interface XPostResponse {
  id: string;
  status: 'success' | 'error';
  message?: string;
}

class XClient {
  private bearerToken: string;
  private apiBaseUrl: string = 'https://api.twitter.com/2';

  constructor() {
    this.bearerToken = process.env.X_BEARER_TOKEN || '';
    this.bearerToken = process.env.X_ACCESS_TOKEN || this.bearerToken; // Fallback
    
    if (!this.bearerToken) {
      console.warn('X (Twitter) bearer token not configured. Posting will fail.');
    }
  }

  async postToX(options: XPostOptions): Promise<XPostResponse> {
    const { content, hashtags = [], mediaIds = [] } = options;

    if (!this.bearerToken) {
      throw new Error('X (Twitter) bearer token is required');
    }

    try {
      // Format content with hashtags (ensure total length < 280 chars)
      let formattedContent = content;
      if (hashtags.length > 0) {
        const hashtagString = ' ' + hashtags.slice(0, 3).map(tag => `#${tag}`).join(' ');
        const maxContentLength = 280 - hashtagString.length;
        
        if (formattedContent.length > maxContentLength) {
          formattedContent = formattedContent.substring(0, maxContentLength - 3) + '...';
        }
        formattedContent += hashtagString;
      }

      // X API v2 - Create Tweet
      const tweetData: any = {
        text: formattedContent,
      };

      // Add media if provided
      if (mediaIds.length > 0) {
        tweetData.media = {
          media_ids: mediaIds,
        };
      }

      const response = await axios.post(
        `${this.apiBaseUrl}/tweets`,
        tweetData,
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.data?.id || 'unknown',
        status: 'success',
        message: 'Tweet posted successfully',
      };
    } catch (error: any) {
      console.error('X (Twitter) Post Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('X (Twitter) authentication failed. Please check your bearer token.');
      } else if (error.response?.status === 403) {
        throw new Error('X (Twitter) API permission denied. Check your app permissions.');
      } else if (error.response?.status === 429) {
        throw new Error('X (Twitter) rate limit exceeded. Please wait before posting again.');
      }

      throw new Error(`Failed to post to X (Twitter): ${error.response?.data?.detail || error.message}`);
    }
  }

  async getPostStats(tweetId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/tweets/${tweetId}`,
        {
          params: {
            'tweet.fields': 'public_metrics',
          },
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
          },
        }
      );
      return response.data?.data?.public_metrics || null;
    } catch (error: any) {
      console.error('X (Twitter) Stats Error:', error.response?.data || error.message);
      return null;
    }
  }
}

export const xClient = new XClient();
export default xClient;

