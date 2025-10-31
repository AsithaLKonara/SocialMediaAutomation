import { NextRequest, NextResponse } from 'next/server';
import { PostModel } from '@/lib/models/post';
import { TopicModel } from '@/lib/models/topic';
import platformPublisher from '@/lib/platform-publisher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const post = await PostModel.findById(parseInt(postId));
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Publish to the appropriate platform
    const publishResponse = await platformPublisher.publish({
      platform: post.platform,
      content: post.content,
      hashtags: post.hashtags,
      mediaUrl: post.media_url,
      videoScript: post.video_script,
    });

    if (publishResponse.status === 'error') {
      return NextResponse.json(
        { success: false, error: publishResponse.message },
        { status: 500 }
      );
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
    
    const updatedPost = await PostModel.update(parseInt(postId), updateData);

    // Update topic status if all posts for this topic are posted
    const topic = await TopicModel.findById(post.topic_id);
    if (topic) {
      const remainingPosts = await PostModel.countByTopic(post.topic_id, ['posted']);
      if (remainingPosts === 0) {
        await TopicModel.update(post.topic_id, { status: 'posted' });
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPost,
      platformPostId: publishResponse.postId,
      platform: post.platform,
    });
  } catch (error: any) {
    console.error('Publish Post Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
