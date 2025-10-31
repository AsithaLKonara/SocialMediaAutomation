import axios from 'axios';

type AIProvider = 'helagpt' | 'ollama' | 'openai';

interface AIGenerateOptions {
  topic: string;
  description?: string;
}

interface AIResponse {
  content: string;
  hashtags: string[];
}

class AIClient {
  private provider: AIProvider;
  private helagptUrl: string;
  private ollamaUrl: string;
  private ollamaModel: string;

  constructor() {
    this.provider = (process.env.AI_PROVIDER as AIProvider) || 'helagpt';
    this.helagptUrl = process.env.HELAGPT_API_URL || 'https://helagpt-backend.vercel.app/api/chat';
    this.ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/generate';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'mistral';
  }

  private async callHelaGPT(topic: string, description?: string): Promise<string> {
    const systemPrompt = `You are a software engineer specialized in Next.js, Node.js, and AI/ML automation. 
Generate engaging LinkedIn post content with 3 short paragraphs, emojis, and a question at the end to encourage engagement.
Make it professional but approachable. Include relevant hashtags at the end.`;

    const userPrompt = `Generate a LinkedIn post about: ${topic}${description ? `\n\nContext: ${description}` : ''}`;

    try {
      const response = await axios.post(this.helagptUrl, {
        message: `${systemPrompt}\n\n${userPrompt}`,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      return response.data?.response || response.data?.message || JSON.stringify(response.data);
    } catch (error: any) {
      console.error('HelaGPT API Error:', error.message);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  private async callOllama(topic: string, description?: string): Promise<string> {
    const prompt = `You are a software engineer specialized in Next.js, Node.js, and AI/ML automation. 
Generate engaging LinkedIn post content with 3 short paragraphs, emojis, and a question at the end to encourage engagement.
Make it professional but approachable. Include relevant hashtags at the end.

Generate a LinkedIn post about: ${topic}${description ? `\n\nContext: ${description}` : ''}`;

    try {
      const response = await axios.post(this.ollamaUrl, {
        model: this.ollamaModel,
        prompt: prompt,
        stream: false,
      }, {
        timeout: 60000,
      });

      return response.data?.response || '';
    } catch (error: any) {
      console.error('Ollama API Error:', error.message);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  private extractContentWithoutHashtags(content: string): string {
    // Remove hashtags from the end but keep the content
    const lines = content.split('\n');
    const contentLines: string[] = [];
    const hashtagLines: string[] = [];

    for (const line of lines) {
      if (line.trim().match(/^#\w+/)) {
        hashtagLines.push(line.trim());
      } else {
        contentLines.push(line);
      }
    }

    // If hashtags are on separate lines, join them and add at the end of content
    if (hashtagLines.length > 0 && contentLines.length > 0) {
      return contentLines.join('\n').trim() + '\n\n' + hashtagLines.join(' ');
    }

    return content.trim();
  }

  async generatePost(options: AIGenerateOptions): Promise<AIResponse> {
    const { topic, description } = options;
    let rawContent: string;

    try {
      switch (this.provider) {
        case 'helagpt':
          rawContent = await this.callHelaGPT(topic, description);
          break;
        case 'ollama':
          rawContent = await this.callOllama(topic, description);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${this.provider}`);
      }

      // Extract hashtags and clean content
      const hashtags = this.extractHashtags(rawContent);
      const content = this.extractContentWithoutHashtags(rawContent);

      return {
        content: content.trim(),
        hashtags: hashtags.length > 0 ? hashtags : ['Nextjs', 'Nodejs', 'WebDevelopment', 'AI', 'Automation'],
      };
    } catch (error: any) {
      console.error('AI Generation Error:', error);
      throw error;
    }
  }
}

export const aiClient = new AIClient();
export default aiClient;

