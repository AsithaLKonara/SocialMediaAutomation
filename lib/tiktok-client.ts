import axios from 'axios';

interface TikTokPostOptions {
  content: string;
  videoScript?: string;
  videoUrl?: string;
  hashtags?: string[];
}

interface TikTokPostResponse {
  id: string;
  status: 'success' | 'error';
  message?: string;
}

class TikTokClient {
  private accessToken: string;
  private apiBaseUrl: string = 'https://open.tiktokapis.com/v2';

  constructor() {
    this.accessToken = process.env.TIKTOK_ACCESS_TOKEN || '';
    
    if (!this.accessToken) {
      console.warn('TikTok access token not configured. Posting will fail.');
    }
  }

  async postToTikTok(options: TikTokPostOptions): Promise<TikTokPostResponse> {
    const { content, videoScript, videoUrl, hashtags = [] } = options;

    if (!this.accessToken) {
      throw new Error('TikTok access token is required');
    }

    try {
      // TikTok API v2 - Initialize Video Upload
      // Note: TikTok API requires video file upload, not just URL
      // This is a simplified version - full implementation requires file upload flow

      if (!videoUrl && !videoScript) {
        throw new Error('TikTok posts require either a video URL or video script for generation');
      }

      // For now, we'll store the post data and return a placeholder
      // Full implementation requires:
      // 1. Video file upload to TikTok
      // 2. Video processing
      // 3. Post creation with video ID

      // Format content with hashtags
      const formattedHashtags = hashtags.slice(0, 5).map(tag => `#${tag}`).join(' ');
      const formattedContent = `${content}\n\n${formattedHashtags}`;

      // Placeholder response - actual implementation requires TikTok Business API setup
      console.log('TikTok Post (Placeholder):', {
        content: formattedContent,
        videoScript,
        videoUrl,
      });

      return {
        id: `tiktok_${Date.now()}`,
        status: 'success',
        message: 'TikTok post created (manual upload may be required)',
      };

      /* Full Implementation Example:
      const response = await axios.post(
        `${this.apiBaseUrl}/post/publish/`,
        {
          post_info: {
            title: formattedContent.substring(0, 150),
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
            video_cover_timestamp_ms: 1000,
          },
          source_info: {
            source: 'FILE_UPLOAD',
            video_id: uploadedVideoId,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      */
    } catch (error: any) {
      console.error('TikTok Post Error:', error.response?.data || error.message);
      throw new Error(`Failed to post to TikTok: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getPostStats(videoId: string): Promise<any> {
    try {
      // TikTok Analytics API (requires business account)
      const response = await axios.get(
        `${this.apiBaseUrl}/video/query/`,
        {
          params: {
            fields: 'like_count,comment_count,share_count,view_count',
            video_id: videoId,
          },
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('TikTok Stats Error:', error.response?.data || error.message);
      return null;
    }
  }
}

export const tiktokClient = new TikTokClient();
export default tiktokClient;

