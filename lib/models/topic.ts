import { query } from '../db';

export type TopicStatus = 'pending' | 'generating' | 'generated' | 'posted';
export type Platform = 'linkedin' | 'facebook' | 'instagram' | 'x' | 'tiktok';

export interface Topic {
  id: number;
  title: string;
  description?: string;
  status: TopicStatus;
  platforms: Platform[];
  created_at: Date;
  updated_at: Date;
}

export interface CreateTopicData {
  title: string;
  description?: string;
  platforms?: Platform[];
}

export const TopicModel = {
  async findAll(): Promise<Topic[]> {
    const result = await query('SELECT * FROM topics ORDER BY created_at DESC');
    return result.rows.map(this.mapRowToTopic);
  },

  async findById(id: number): Promise<Topic | null> {
    const result = await query('SELECT * FROM topics WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return this.mapRowToTopic(result.rows[0]);
  },

  async create(data: CreateTopicData): Promise<Topic> {
    const platforms = data.platforms || ['linkedin', 'facebook', 'instagram', 'x'];
    const result = await query(
      `INSERT INTO topics (title, description, platforms, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.title, data.description || null, platforms, 'pending']
    );
    return this.mapRowToTopic(result.rows[0]);
  },

  async update(id: number, data: Partial<CreateTopicData & { status?: TopicStatus; platforms?: Platform[] }>): Promise<Topic> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.platforms !== undefined) {
      updates.push(`platforms = $${paramCount++}`);
      values.push(data.platforms);
    }

    values.push(id);
    const result = await query(
      `UPDATE topics SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return this.mapRowToTopic(result.rows[0]);
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM topics WHERE id = $1', [id]);
    return result.rowCount! > 0;
  },

  mapRowToTopic(row: any): any {
    // Return both PostgreSQL format and frontend-expected format
    return {
      // PostgreSQL format
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      platforms: row.platforms || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Frontend-expected format (MongoDB-style)
      _id: row.id.toString(),
      createdAt: row.created_at?.toISOString() || new Date().toISOString(),
      updatedAt: row.updated_at?.toISOString() || new Date().toISOString(),
    };
  },
};

