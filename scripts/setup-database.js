const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

// On macOS Homebrew, default user is the system username
const defaultUser = require('os').userInfo().username;

const {
  POSTGRES_HOST = 'localhost',
  POSTGRES_PORT = '5432',
  POSTGRES_USER = defaultUser,
  POSTGRES_PASSWORD = '',
  POSTGRES_DB = 'socialpost_ai',
} = process.env;

// First, connect to postgres database to create the target database if it doesn't exist
const adminPool = new Pool({
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: 'postgres', // Connect to default postgres database
});

async function setupDatabase() {
  const client = await adminPool.connect();
  
  try {
    console.log('🔧 Setting up PostgreSQL database...');
    
    // Check if database exists
    const dbCheck = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [POSTGRES_DB]
    );
    
    if (dbCheck.rows.length === 0) {
      console.log(`📦 Creating database: ${POSTGRES_DB}`);
      await client.query(`CREATE DATABASE ${POSTGRES_DB}`);
      console.log(`✅ Database ${POSTGRES_DB} created`);
    } else {
      console.log(`✅ Database ${POSTGRES_DB} already exists`);
    }
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
  }
  
  // Now connect to the actual database and create tables
  const dbPool = new Pool({
    host: POSTGRES_HOST,
    port: POSTGRES_PORT,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DB,
  });
  
  const dbClient = await dbPool.connect();
  
  try {
    console.log('📋 Creating tables...');
    
    // Create topics table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS topics (
        id SERIAL PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'posted')),
        platforms TEXT[] DEFAULT ARRAY['linkedin', 'facebook', 'instagram', 'x'],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create posts table
    await dbClient.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
        platform VARCHAR(20) NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'x', 'tiktok')),
        content TEXT NOT NULL,
        hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
        media_url VARCHAR(500),
        video_script TEXT,
        scheduled_time TIMESTAMP,
        posted_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posted', 'approved')),
        linkedin_post_id VARCHAR(255),
        facebook_post_id VARCHAR(255),
        instagram_post_id VARCHAR(255),
        x_post_id VARCHAR(255),
        tiktok_post_id VARCHAR(255),
        views INTEGER DEFAULT 0,
        reactions INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        saves INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for better performance
    await dbClient.query(`
      CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
      CREATE INDEX IF NOT EXISTS idx_posts_topic_id ON posts(topic_id);
      CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
      CREATE INDEX IF NOT EXISTS idx_posts_platform_status ON posts(platform, status);
      CREATE INDEX IF NOT EXISTS idx_posts_scheduled_time ON posts(scheduled_time);
    `);
    
    // Create function to update updated_at timestamp
    await dbClient.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create triggers for updated_at
    await dbClient.query(`
      DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
      CREATE TRIGGER update_topics_updated_at
      BEFORE UPDATE ON topics
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await dbClient.query(`
      DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
      CREATE TRIGGER update_posts_updated_at
      BEFORE UPDATE ON posts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('✅ Database tables and indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    dbClient.release();
    await dbPool.end();
    await adminPool.end();
  }
}

setupDatabase()
  .then(() => {
    console.log('🎉 Database setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  });

