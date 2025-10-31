import { Platform } from '@/models/Post';
import linkedInClient from './linkedin-client';
import facebookClient from './facebook-client';
import instagramClient from './instagram-client';
import xClient from './x-client';
import tiktokClient from './tiktok-client';

export interface PublishOptions {
  platform: Platform;
  content: string;
  hashtags?: string[];
  mediaUrl?: string;
  videoScript?: string;
}

export interface PublishResponse {
  platform: Platform;
  postId: string;
  status: 'success' | 'error';
  message?: string;
}

class PlatformPublisher {
  /**
   * Publish a post to the specified platform
   */
  async publish(options: PublishOptions): Promise<PublishResponse> {
    const { platform, content, hashtags, mediaUrl, videoScript } = options;

    try {
      switch (platform) {
        case 'linkedin':
          const linkedInResult = await linkedInClient.postToLinkedIn({
            content,
            hashtags,
          });
          return {
            platform: 'linkedin',
            postId: linkedInResult.id,
            status: 'success',
            message: linkedInResult.message,
          };

        case 'facebook':
          const facebookResult = await facebookClient.postToFacebook({
            content,
            hashtags,
            mediaUrl,
          });
          return {
            platform: 'facebook',
            postId: facebookResult.id,
            status: 'success',
            message: facebookResult.message,
          };

        case 'instagram':
          const instagramResult = await instagramClient.postToInstagram({
            content,
            hashtags,
            imageUrl: mediaUrl,
          });
          return {
            platform: 'instagram',
            postId: instagramResult.id,
            status: 'success',
            message: instagramResult.message,
          };

        case 'x':
          const xResult = await xClient.postToX({
            content,
            hashtags,
          });
          return {
            platform: 'x',
            postId: xResult.id,
            status: 'success',
            message: xResult.message,
          };

        case 'tiktok':
          const tiktokResult = await tiktokClient.postToTikTok({
            content,
            hashtags,
            videoScript,
            videoUrl: mediaUrl,
          });
          return {
            platform: 'tiktok',
            postId: tiktokResult.id,
            status: 'success',
            message: tiktokResult.message,
          };

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error: any) {
      return {
        platform,
        postId: '',
        status: 'error',
        message: error.message,
      };
    }
  }

  /**
   * Publish to multiple platforms simultaneously
   */
  async publishMultiPlatform(
    options: PublishOptions[]
  ): Promise<PublishResponse[]> {
    const results = await Promise.allSettled(
      options.map(opt => this.publish(opt))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          platform: options[index].platform,
          postId: '',
          status: 'error' as const,
          message: result.reason?.message || 'Unknown error',
        };
      }
    });
  }
}

export const platformPublisher = new PlatformPublisher();
export default platformPublisher;

