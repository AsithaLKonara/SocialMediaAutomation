import { Platform } from '@/models/Post';
import { getPlatformPrompt } from './platform-prompts';
import aiClient from './ai-client';

export interface MultiPlatformPost {
  platform: Platform;
  content: string;
  hashtags: string[];
  videoScript?: string; // For TikTok
}

export interface GenerateMultiPlatformOptions {
  topic: string;
  description?: string;
  platforms: Platform[];
}

export class MultiPlatformAIService {
  /**
   * Generate posts for multiple platforms from a single topic
   */
  async generateMultiPlatformPosts(
    options: GenerateMultiPlatformOptions
  ): Promise<MultiPlatformPost[]> {
    const { topic, description, platforms } = options;
    const posts: MultiPlatformPost[] = [];

    // Generate posts for each platform in parallel for better performance
    const generationPromises = platforms.map(async (platform) => {
      try {
        const post = await this.generatePlatformPost(platform, topic, description);
        return { platform, ...post };
      } catch (error: any) {
        console.error(`Error generating post for ${platform}:`, error.message);
        // Return a fallback post so the system doesn't fail completely
        return {
          platform,
          content: `Content about ${topic} for ${platform}`,
          hashtags: ['AI', 'Automation', 'Tech'],
        };
      }
    });

    const results = await Promise.all(generationPromises);
    return results.map((result) => ({
      platform: result.platform,
      content: result.content,
      hashtags: result.hashtags,
      videoScript: result.videoScript,
    }));
  }

  /**
   * Generate a single post for a specific platform
   */
  async generatePlatformPost(
    platform: Platform,
    topic: string,
    description?: string
  ): Promise<Omit<MultiPlatformPost, 'platform'>> {
    const platformPrompt = getPlatformPrompt(platform);
    
    // Use the existing AI client but with platform-specific prompts
    const fullPrompt = `${platformPrompt.systemPrompt}\n\n${platformPrompt.userPrompt(topic, description)}`;

    try {
      // Call AI with platform-specific prompt
      const rawContent = await this.callAI(fullPrompt);
      
      // Extract hashtags
      const hashtags = this.extractHashtags(rawContent);
      let content = this.cleanContent(rawContent, platform);

      // Extract video script for TikTok
      let videoScript: string | undefined;
      if (platform === 'tiktok') {
        const scriptMatch = rawContent.match(/\[HOOK\](.*?)\[MIDDLE\](.*?)\[CTA\](.*?)(\[VISUALS\]|$)/s);
        if (scriptMatch) {
          videoScript = `Hook: ${scriptMatch[1].trim()}\n\nMiddle: ${scriptMatch[2].trim()}\n\nCTA: ${scriptMatch[3].trim()}`;
          content = content.replace(/\[HOOK\].*?\[VISUALS\].*/s, '').trim();
        }
      }

      // Validate length
      if (platformPrompt.maxLength && content.length > platformPrompt.maxLength) {
        content = content.substring(0, platformPrompt.maxLength - 3) + '...';
      }

      return {
        content: content.trim(),
        hashtags: hashtags.length > 0 ? hashtags : this.getDefaultHashtags(platform),
        videoScript,
      };
    } catch (error: any) {
      console.error(`AI generation error for ${platform}:`, error);
      throw new Error(`Failed to generate ${platform} post: ${error.message}`);
    }
  }

  /**
   * Call AI service (HelaGPT or Ollama)
   */
  private async callAI(prompt: string): Promise<string> {
    // Use existing AI client but bypass the topic wrapper
    // We'll call the underlying service directly
    const provider = (process.env.AI_PROVIDER as 'helagpt' | 'ollama') || 'helagpt';
    const axios = require('axios');

    if (provider === 'helagpt') {
      const helagptUrl = process.env.HELAGPT_API_URL || 'https://helagpt-backend.vercel.app/api/chat';
      const response = await axios.post(
        helagptUrl,
        { message: prompt },
        { timeout: 30000 }
      );
      return response.data?.response || response.data?.message || JSON.stringify(response.data);
    } else if (provider === 'ollama') {
      const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
      const ollamaModel = process.env.OLLAMA_MODEL || 'mistral';
      const response = await axios.post(
        ollamaUrl,
        {
          model: ollamaModel,
          prompt: prompt,
          stream: false,
        },
        { timeout: 60000 }
      );
      return response.data?.response || '';
    } else {
      throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  /**
   * Extract hashtags from content
   */
  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Clean content by removing hashtags from main text (they'll be added separately)
   */
  private cleanContent(content: string, platform: Platform): string {
    // For Instagram, keep hashtags at the end
    if (platform === 'instagram') {
      return content.trim();
    }
    
    // For other platforms, extract hashtags and keep them in content
    // But remove hashtag-only lines
    const lines = content.split('\n');
    const contentLines: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip lines that are only hashtags (but keep lines with text + hashtags)
      if (!trimmed.match(/^#\w+(\s+#\w+)*$/)) {
        contentLines.push(line);
      } else if (trimmed.match(/#\w+.*[^#]/)) {
        // Line has both text and hashtags
        contentLines.push(line);
      }
    }

    return contentLines.join('\n').trim();
  }

  /**
   * Get default hashtags for a platform if AI doesn't generate any
   */
  private getDefaultHashtags(platform: Platform): string[] {
    const defaults: Record<Platform, string[]> = {
      linkedin: ['Nextjs', 'Nodejs', 'WebDevelopment', 'AI', 'Automation'],
      facebook: ['WebDev', 'AI', 'Automation', 'Tech', 'Programming'],
      instagram: ['WebDevelopment', 'AIAutomation', 'Nextjs', 'Tech', 'Code'],
      x: ['AI', 'Automation', 'Tech'],
      tiktok: ['WebDev', 'AI', 'Coding', 'TechTok'],
    };
    return defaults[platform];
  }
}

export const multiPlatformAIService = new MultiPlatformAIService();
export default multiPlatformAIService;

