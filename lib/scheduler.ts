import cron from 'node-cron';
import { TopicModel, Platform } from './models/topic';
import { PostModel } from './models/post';
import multiPlatformAIService from './multi-platform-ai';
import platformPublisher from './platform-publisher';

interface ScheduleTime {
  hour: number;
  minute: number;
}

class PostScheduler {
  private postsPerDay: number;
  private scheduleTimes: ScheduleTime[];
  private cronJobs: cron.ScheduledTask[] = [];
  private isProcessing: boolean = false;

  constructor() {
    this.postsPerDay = parseInt(process.env.POSTS_PER_DAY || '2');
    const timesStr = process.env.SCHEDULE_TIMES || '10:00,16:00';
    this.scheduleTimes = this.parseScheduleTimes(timesStr);
  }

  private parseScheduleTimes(timesStr: string): ScheduleTime[] {
    return timesStr.split(',').map(time => {
      const [hour, minute] = time.trim().split(':').map(Number);
      return { hour: hour || 10, minute: minute || 0 };
    });
  }

  private async generatePostsForPendingTopics(): Promise<void> {
    if (this.isProcessing) {
      console.log('Scheduler already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    try {
      // Get all pending topics (limit to 10 for performance)
      const allTopics = await TopicModel.findAll();
      const pendingTopics = allTopics
        .filter(t => t.status === 'pending')
        .slice(0, 10)
        .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

      for (const topic of pendingTopics) {
        try {
          // Check if all posts already exist for this topic
          const platforms = topic.platforms || ['linkedin'];
          const existingPosts = await PostModel.findAll({ topic_id: topic.id });
          const existingPlatforms = existingPosts.map(p => p.platform);
          const missingPlatforms = platforms.filter((p: Platform) => !existingPlatforms.includes(p));

          if (missingPlatforms.length === 0) {
            continue;
          }

          // Update topic status to generating
          await TopicModel.update(topic.id, { status: 'generating' });

          // Generate posts for missing platforms
          const generatedPosts = await multiPlatformAIService.generateMultiPlatformPosts({
            topic: topic.title,
            description: topic.description || undefined,
            platforms: missingPlatforms,
          });

          // Save posts to database
          for (const generatedPost of generatedPosts) {
            await PostModel.create({
              topic_id: topic.id,
              platform: generatedPost.platform,
              content: generatedPost.content,
              hashtags: generatedPost.hashtags,
              video_script: generatedPost.videoScript,
              status: process.env.REQUIRE_APPROVAL === 'true' ? 'draft' : 'approved',
            });
          }

          // Update topic status
          await TopicModel.update(topic.id, { status: 'generated' });

          console.log(`✅ Generated ${generatedPosts.length} posts for topic: ${topic.title}`);
        } catch (error: any) {
          console.error(`❌ Error generating posts for topic ${topic.id}:`, error.message);
          // Reset topic status on error
          await TopicModel.update(topic.id, { status: 'pending' });
        }
      }
    } catch (error: any) {
      console.error('Scheduler error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async publishScheduledPosts(): Promise<void> {
    if (this.isProcessing) {
      console.log('Scheduler already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    try {
      // Find approved posts that are ready to publish (scheduled time is in the past or now)
      // Distribute posts evenly across platforms
      const now = new Date();
      const platforms: Platform[] = ['linkedin', 'facebook', 'instagram', 'x', 'tiktok'];
      const postsPerPlatform = Math.ceil(this.postsPerDay / platforms.length);
      
      const readyPosts: any[] = [];
      
      // Get posts per platform
      for (const platform of platforms) {
        const platformPosts = await PostModel.findAll({ 
          platform,
          status: 'approved',
        });
        
        // Filter by scheduled time
        const filtered = platformPosts.filter(post => 
          !post.scheduled_time || post.scheduled_time <= now
        );
        
        readyPosts.push(...filtered.slice(0, postsPerPlatform));
      }
      
      // Limit total posts to postsPerDay
      const limitedPosts = readyPosts.slice(0, this.postsPerDay);

      if (limitedPosts.length === 0) {
        // If no approved posts, try to publish draft posts if approval is disabled
        if (process.env.REQUIRE_APPROVAL !== 'true') {
          const draftPosts: any[] = [];
          
          for (const platform of platforms) {
            const platformDrafts = await PostModel.findAll({ 
              platform,
              status: 'draft',
            });
            
            const filtered = platformDrafts.filter(post => 
              !post.scheduled_time || post.scheduled_time <= now
            );
            
            draftPosts.push(...filtered.slice(0, postsPerPlatform));
          }
          
          for (const post of draftPosts.slice(0, this.postsPerDay)) {
            await this.publishPost(post);
          }
        }
        return;
      }

      for (const post of limitedPosts) {
        await this.publishPost(post);
      }
    } catch (error: any) {
      console.error('Publish scheduler error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async publishPost(post: any): Promise<void> {
    try {
      console.log(`📤 Publishing ${post.platform} post: ${post.id}`);

      // Publish to the appropriate platform
      const publishResponse = await platformPublisher.publish({
        platform: post.platform,
        content: post.content,
        hashtags: post.hashtags,
        mediaUrl: post.media_url,
        videoScript: post.video_script,
      });

      if (publishResponse.status === 'error') {
        throw new Error(publishResponse.message);
      }

      // Update post with platform-specific ID
      const updateData: any = {
        status: 'posted',
        posted_at: new Date(),
      };
      
      // Store platform-specific post ID
      switch (post.platform) {
        case 'linkedin':
          updateData.linkedin_post_id = publishResponse.postId;
          break;
        case 'facebook':
          updateData.facebook_post_id = publishResponse.postId;
          break;
        case 'instagram':
          updateData.instagram_post_id = publishResponse.postId;
          break;
        case 'x':
          updateData.x_post_id = publishResponse.postId;
          break;
        case 'tiktok':
          updateData.tiktok_post_id = publishResponse.postId;
          break;
      }
      
      await PostModel.update(post.id, updateData);

      // Update topic status if all posts for this topic are posted
      const topic = await TopicModel.findById(post.topic_id);
      if (topic) {
        const remainingPosts = await PostModel.countByTopic(post.topic_id, ['posted']);
        if (remainingPosts === 0) {
          await TopicModel.update(post.topic_id, { status: 'posted' });
        }
      }

      console.log(`✅ Successfully posted to ${post.platform}: ${publishResponse.postId}`);
    } catch (error: any) {
      console.error(`❌ Error publishing ${post.platform} post ${post.id}:`, error.message);
      // Don't throw - continue with other posts
    }
  }

  start(): void {
    console.log('🚀 Starting Post Scheduler...');
    console.log(`📅 Schedule: ${this.postsPerDay} posts per day at:`, this.scheduleTimes);

    // Schedule post generation (runs every 2 hours)
    const generateJob = cron.schedule('0 */2 * * *', async () => {
      console.log('⏰ Running scheduled post generation...');
      await this.generatePostsForPendingTopics();
    });

    this.cronJobs.push(generateJob);

    // Schedule post publishing at specified times
    for (const scheduleTime of this.scheduleTimes) {
      const cronExpression = `${scheduleTime.minute} ${scheduleTime.hour} * * *`;
      const publishJob = cron.schedule(cronExpression, async () => {
        console.log(`⏰ Running scheduled post publishing at ${scheduleTime.hour}:${scheduleTime.minute.toString().padStart(2, '0')}...`);
        await this.publishScheduledPosts();
      });

      this.cronJobs.push(publishJob);
      console.log(`✅ Scheduled publishing job: ${cronExpression}`);
    }

    // Also run immediately on start (for testing/development)
    this.generatePostsForPendingTopics();
  }

  stop(): void {
    console.log('🛑 Stopping Post Scheduler...');
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs = [];
  }
}

// Create singleton instance
export const postScheduler = new PostScheduler();

// Auto-start in production (or when env variable is set)
// Only start if we're in a server environment (not browser)
if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'production' || process.env.AUTO_START_SCHEDULER === 'true') {
    // Delay start slightly to ensure database connection is ready
    setImmediate(() => {
      postScheduler.start();
    });
  }
}

export default postScheduler;
