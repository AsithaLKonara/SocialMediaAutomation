import { query } from '../db';
import { Platform } from './topic';

export type PostStatus = 'draft' | 'scheduled' | 'posted' | 'approved';

export interface Post {
  id: number;
  topic_id: number;
  platform: Platform;
  content: string;
  hashtags: string[];
  media_url?: string;
  video_script?: string;
  scheduled_time?: Date;
  posted_at?: Date;
  status: PostStatus;
  linkedin_post_id?: string;
  facebook_post_id?: string;
  instagram_post_id?: string;
  x_post_id?: string;
  tiktok_post_id?: string;
  views: number;
  reactions: number;
  likes: number;
  shares: number;
  comments: number;
  saves: number;
  created_at: Date;
  updated_at: Date;
  // Populated topic (when joined)
  topic?: {
    id: number;
    title: string;
  };
}

export interface CreatePostData {
  topic_id: number;
  platform: Platform;
  content: string;
  hashtags?: string[];
  video_script?: string;
  media_url?: string;
  status?: PostStatus;
  scheduled_time?: Date;
}

export const PostModel = {
  async findAll(filters?: { status?: PostStatus; topic_id?: number; platform?: Platform }): Promise<Post[]> {
    let sql = 'SELECT p.*, t.id as topic__id, t.title as topic__title FROM posts p LEFT JOIN topics t ON p.topic_id = t.id WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.status) {
      sql += ` AND p.status = $${paramCount++}`;
      params.push(filters.status);
    }
    if (filters?.topic_id) {
      sql += ` AND p.topic_id = $${paramCount++}`;
      params.push(filters.topic_id);
    }
    if (filters?.platform) {
      sql += ` AND p.platform = $${paramCount++}`;
      params.push(filters.platform);
    }

    sql += ' ORDER BY p.created_at DESC';
    
    const result = await query(sql, params);
    return result.rows.map(this.mapRowToPost);
  },

  async findById(id: number): Promise<Post | null> {
    const result = await query(
      `SELECT p.*, t.id as topic__id, t.title as topic__title 
       FROM posts p 
       LEFT JOIN topics t ON p.topic_id = t.id 
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.mapRowToPost(result.rows[0]);
  },

  async findByTopicAndPlatform(topic_id: number, platform: Platform, status?: PostStatus[]): Promise<Post | null> {
    let sql = `SELECT p.*, t.id as topic__id, t.title as topic__title 
               FROM posts p 
               LEFT JOIN topics t ON p.topic_id = t.id 
               WHERE p.topic_id = $1 AND p.platform = $2`;
    const params: any[] = [topic_id, platform];

    if (status && status.length > 0) {
      sql += ` AND p.status = ANY($3)`;
      params.push(status);
    }

    sql += ' ORDER BY p.created_at DESC LIMIT 1';

    const result = await query(sql, params);
    if (result.rows.length === 0) return null;
    return this.mapRowToPost(result.rows[0]);
  },

  async create(data: CreatePostData): Promise<Post> {
    const result = await query(
      `INSERT INTO posts (topic_id, platform, content, hashtags, video_script, media_url, status, scheduled_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.topic_id,
        data.platform,
        data.content,
        data.hashtags || [],
        data.video_script || null,
        data.media_url || null,
        data.status || 'draft',
        data.scheduled_time || null,
      ]
    );
    return this.mapRowToPost(result.rows[0]);
  },

  async update(id: number, data: Partial<CreatePostData & { status?: PostStatus; posted_at?: Date; linkedin_post_id?: string; facebook_post_id?: string; instagram_post_id?: string; x_post_id?: string; tiktok_post_id?: string }>): Promise<Post> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.content !== undefined) {
      updates.push(`content = $${paramCount++}`);
      values.push(data.content);
    }
    if (data.hashtags !== undefined) {
      updates.push(`hashtags = $${paramCount++}`);
      values.push(data.hashtags);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.scheduled_time !== undefined) {
      updates.push(`scheduled_time = $${paramCount++}`);
      values.push(data.scheduled_time);
    }
    if (data.posted_at !== undefined) {
      updates.push(`posted_at = $${paramCount++}`);
      values.push(data.posted_at);
    }
    if (data.linkedin_post_id !== undefined) {
      updates.push(`linkedin_post_id = $${paramCount++}`);
      values.push(data.linkedin_post_id);
    }
    if (data.facebook_post_id !== undefined) {
      updates.push(`facebook_post_id = $${paramCount++}`);
      values.push(data.facebook_post_id);
    }
    if (data.instagram_post_id !== undefined) {
      updates.push(`instagram_post_id = $${paramCount++}`);
      values.push(data.instagram_post_id);
    }
    if (data.x_post_id !== undefined) {
      updates.push(`x_post_id = $${paramCount++}`);
      values.push(data.x_post_id);
    }
    if (data.tiktok_post_id !== undefined) {
      updates.push(`tiktok_post_id = $${paramCount++}`);
      values.push(data.tiktok_post_id);
    }

    values.push(id);
    const result = await query(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return this.mapRowToPost(result.rows[0]);
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM posts WHERE id = $1', [id]);
    return result.rowCount! > 0;
  },

  async countByTopic(topic_id: number, excludeStatus?: PostStatus[]): Promise<number> {
    let sql = 'SELECT COUNT(*) FROM posts WHERE topic_id = $1';
    const params: any[] = [topic_id];

    if (excludeStatus && excludeStatus.length > 0) {
      sql += ` AND status != ALL($2)`;
      params.push(excludeStatus);
    }

    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  },

  mapRowToPost(row: any): any {
    // Return both PostgreSQL format and frontend-expected format
    const basePost = {
      // PostgreSQL format
      id: row.id,
      topic_id: row.topic_id,
      platform: row.platform,
      content: row.content,
      hashtags: row.hashtags || [],
      media_url: row.media_url,
      video_script: row.video_script,
      scheduled_time: row.scheduled_time,
      posted_at: row.posted_at,
      status: row.status,
      linkedin_post_id: row.linkedin_post_id,
      facebook_post_id: row.facebook_post_id,
      instagram_post_id: row.instagram_post_id,
      x_post_id: row.x_post_id,
      tiktok_post_id: row.tiktok_post_id,
      views: row.views || 0,
      reactions: row.reactions || 0,
      likes: row.likes || 0,
      shares: row.shares || 0,
      comments: row.comments || 0,
      saves: row.saves || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Frontend-expected format (MongoDB-style)
      _id: row.id.toString(),
      createdAt: row.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
      scheduledTime: row.scheduled_time?.toISOString(),
      postedAt: row.posted_at?.toISOString(),
      videoScript: row.video_script,
      mediaUrl: row.media_url,
      linkedInPostId: row.linkedin_post_id,
      facebookPostId: row.facebook_post_id,
      instagramPostId: row.instagram_post_id,
      xPostId: row.x_post_id,
      tiktokPostId: row.tiktok_post_id,
    };

    // Add topic if present
    if (row.topic__id) {
      basePost.topicId = {
        _id: row.topic__id.toString(),
        id: row.topic__id,
        title: row.topic__title,
      };
    }

    return basePost;
  },
};

