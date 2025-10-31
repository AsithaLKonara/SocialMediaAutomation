import { NextRequest, NextResponse } from 'next/server';
import { TopicModel } from '@/lib/models/topic';
import { PostModel } from '@/lib/models/post';
import { Platform } from '@/lib/models/topic';
import multiPlatformAIService from '@/lib/multi-platform-ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, platforms } = body;

    if (!topicId) {
      return NextResponse.json(
        { success: false, error: 'Topic ID is required' },
        { status: 400 }
      );
    }

    const topic = await TopicModel.findById(parseInt(topicId));
    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Determine which platforms to generate for
    const platformsToGenerate: Platform[] = platforms || topic.platforms || ['linkedin'];
    
    // Update topic status
    await TopicModel.update(parseInt(topicId), { status: 'generating' });

    // Generate posts for all platforms
    const generatedPosts = await multiPlatformAIService.generateMultiPlatformPosts({
      topic: topic.title,
      description: topic.description || undefined,
      platforms: platformsToGenerate,
    });

    // Save posts to database
    const savedPosts = [];
    for (const generatedPost of generatedPosts) {
      // Check if post already exists for this topic and platform
      const existingPost = await PostModel.findByTopicAndPlatform(
        parseInt(topicId),
        generatedPost.platform,
        ['draft', 'approved']
      );
      
      if (existingPost) {
        // Update existing post
        const updated = await PostModel.update(existingPost.id, {
          content: generatedPost.content,
          hashtags: generatedPost.hashtags,
          video_script: generatedPost.videoScript,
          status: process.env.REQUIRE_APPROVAL === 'true' ? 'draft' : 'approved',
        });
        savedPosts.push(updated);
      } else {
        // Create new post
        const newPost = await PostModel.create({
          topic_id: parseInt(topicId),
          platform: generatedPost.platform,
          content: generatedPost.content,
          hashtags: generatedPost.hashtags,
          video_script: generatedPost.videoScript,
          status: process.env.REQUIRE_APPROVAL === 'true' ? 'draft' : 'approved',
        });
        savedPosts.push(newPost);
      }
    }

    // Update topic status
    await TopicModel.update(parseInt(topicId), { status: 'generated' });

    return NextResponse.json({ 
      success: true, 
      data: savedPosts,
      message: `Generated ${savedPosts.length} posts for ${platformsToGenerate.length} platforms`
    });
  } catch (error: any) {
    console.error('Generate Post Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
