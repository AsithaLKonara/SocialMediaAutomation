import { NextRequest, NextResponse } from 'next/server';
import { PostModel, PostStatus } from '@/lib/models/post';
import { Platform, TopicModel } from '@/lib/models/topic';
import multiPlatformAIService from '@/lib/multi-platform-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as PostStatus | null;
    const topicId = searchParams.get('topicId');
    const platform = searchParams.get('platform') as Platform | null;

    const posts = await PostModel.findAll({
      ...(status && { status }),
      ...(topicId && { topic_id: parseInt(topicId) }),
      ...(platform && { platform }),
    });

    return NextResponse.json({ success: true, data: posts });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topicId, autoGenerate, content, hashtags, platform } = body;

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

    let postContent = content;
    let postHashtags = hashtags || [];

    // Auto-generate post using AI if requested
    if (autoGenerate || !content) {
      const targetPlatform = platform || topic.platforms[0] || 'linkedin';
      const aiResponse = await multiPlatformAIService.generatePlatformPost(
        targetPlatform,
        topic.title,
        topic.description
      );
      postContent = aiResponse.content;
      postHashtags = aiResponse.hashtags;
      
      // Update topic status
      await TopicModel.update(parseInt(topicId), { status: 'generated' });
    }

    const post = await PostModel.create({
      topic_id: parseInt(topicId),
      platform: platform || topic.platforms[0] || 'linkedin',
      content: postContent,
      hashtags: postHashtags,
      status: process.env.REQUIRE_APPROVAL === 'true' ? 'draft' : 'approved',
    });

    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, hashtags, status, scheduledTime } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (hashtags !== undefined) updateData.hashtags = hashtags;
    if (status !== undefined) updateData.status = status;
    if (scheduledTime !== undefined) updateData.scheduled_time = scheduledTime ? new Date(scheduledTime) : null;

    const post = await PostModel.update(parseInt(id), updateData);
    
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: post });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const deleted = await PostModel.delete(parseInt(id));
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Post deleted' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
