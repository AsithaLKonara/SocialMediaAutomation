import axios from 'axios';

interface InstagramPostOptions {
  content: string;
  hashtags?: string[];
  imageUrl?: string;
}

interface InstagramPostResponse {
  id: string;
  status: 'success' | 'error';
  message?: string;
}

class InstagramClient {
  private accessToken: string;
  private pageId: string;
  private apiBaseUrl: string = 'https://graph.facebook.com/v18.0';

  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    this.pageId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || '';
    
    if (!this.accessToken) {
      console.warn('Instagram access token not configured. Posting will fail.');
    }
    if (!this.pageId) {
      console.warn('Instagram Business Account ID not configured. Posting will fail.');
    }
  }

  async postToInstagram(options: InstagramPostOptions): Promise<InstagramPostResponse> {
    const { content, hashtags = [], imageUrl } = options;

    if (!this.accessToken || !this.pageId) {
      throw new Error('Instagram access token and Business Account ID are required');
    }

    try {
      // Format content with hashtags (Instagram allows up to 30 hashtags)
      const formattedHashtags = hashtags.slice(0, 10).map(tag => `#${tag}`).join(' ');
      const formattedContent = `${content}\n\n${formattedHashtags}`;

      if (!imageUrl) {
        // Instagram requires an image, so we'll create a text-based image or skip
        throw new Error('Instagram posts require an image URL');
      }

      // Step 1: Create media container
      const containerResponse = await axios.post(
        `${this.apiBaseUrl}/${this.pageId}/media`,
        {
          image_url: imageUrl,
          caption: formattedContent,
          access_token: this.accessToken,
        }
      );

      const containerId = containerResponse.data.id;

      // Step 2: Publish the media container
      const publishResponse = await axios.post(
        `${this.apiBaseUrl}/${this.pageId}/media_publish`,
        {
          creation_id: containerId,
          access_token: this.accessToken,
        }
      );

      return {
        id: publishResponse.data.id || containerId,
        status: 'success',
        message: 'Post published successfully to Instagram',
      };
    } catch (error: any) {
      console.error('Instagram Post Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Instagram authentication failed. Please refresh your access token.');
      } else if (error.response?.status === 403) {
        throw new Error('Instagram API permission denied. Check your app permissions and Business Account setup.');
      }

      throw new Error(`Failed to post to Instagram: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getPostStats(postId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiBaseUrl}/${postId}/insights`,
        {
          params: {
            metric: 'impressions,reach,engagement',
            access_token: this.accessToken,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Instagram Stats Error:', error.response?.data || error.message);
      return null;
    }
  }
}

export const instagramClient = new InstagramClient();
export default instagramClient;

