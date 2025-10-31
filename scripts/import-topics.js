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

const pool = new Pool({
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
});

function parseTopics(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  const topics = [];
  let currentCategory = '';
  let topicNumber = 1;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and separators
    if (!trimmed || trimmed === '---') continue;
    
    // Check if it's a category header
    if (trimmed.startsWith('##')) {
      currentCategory = trimmed.replace(/##\s*/, '').trim();
      continue;
    }
    
    // Check if it's a numbered topic
    const topicMatch = trimmed.match(/^(\d+)\.\s*(.+)$/);
    if (topicMatch) {
      const [, number, title] = topicMatch;
      topics.push({
        number: parseInt(number),
        title: title.trim(),
        category: currentCategory,
        platforms: ['linkedin', 'facebook', 'instagram', 'x'], // Default platforms
        status: 'pending',
      });
    }
  }
  
  return topics;
}

async function importTopics() {
  const client = await pool.connect();
  
  try {
    console.log('📖 Reading topics from topic_List.txt...');
    const topicFilePath = path.join(__dirname, '..', 'topic_List.txt');
    
    if (!fs.existsSync(topicFilePath)) {
      throw new Error(`Topic file not found: ${topicFilePath}`);
    }
    
    const topics = parseTopics(topicFilePath);
    console.log(`✅ Parsed ${topics.length} topics from file`);
    
    // Check existing topics
    const existingResult = await client.query('SELECT COUNT(*) FROM topics');
    const existingCount = parseInt(existingResult.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing topics in database`);
      console.log('🗑️  Clearing existing topics and importing all topics...');
      await client.query('DELETE FROM topics');
      console.log('✅ Existing topics cleared');
    }
    
    console.log(`📥 Importing ${topics.length} topics...`);
    
    // Insert topics in batches for better performance
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < topics.length; i += batchSize) {
      const batch = topics.slice(i, i + batchSize);
      
      const values = batch.map((topic, idx) => {
        const base = i * batchSize + idx;
        return `($${base * 4 + 1}, $${base * 4 + 2}, $${base * 4 + 3}, $${base * 4 + 4})`;
      }).join(', ');
      
      const params = batch.flatMap(topic => [
        topic.title,
        topic.category || null,
        topic.platforms,
        topic.status,
      ]);
      
      const query = `
        INSERT INTO topics (title, description, platforms, status)
        VALUES ${values}
        ON CONFLICT DO NOTHING
      `;
      
      // Use individual inserts for better error handling
      for (const topic of batch) {
        try {
          await client.query(
            `INSERT INTO topics (title, description, platforms, status)
             VALUES ($1, $2, $3, $4)`,
            [topic.title, topic.category || null, topic.platforms, topic.status]
          );
          imported++;
          if (imported % 10 === 0) {
            process.stdout.write(`\r✅ Imported ${imported}/${topics.length} topics...`);
          }
        } catch (error) {
          if (error.code === '23505') { // Unique constraint violation
            console.log(`\n⚠️  Topic "${topic.title}" already exists, skipping...`);
          } else {
            console.error(`\n❌ Error importing topic "${topic.title}":`, error.message);
          }
        }
      }
    }
    
    console.log(`\n✅ Successfully imported ${imported} topics!`);
    
    // Show summary
    const categoryResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE description LIKE '%NEXT.JS%') as nextjs,
        COUNT(*) FILTER (WHERE description LIKE '%NODE.JS%') as nodejs,
        COUNT(*) FILTER (WHERE description LIKE '%AI & MACHINE LEARNING%') as ai,
        COUNT(*) FILTER (WHERE description LIKE '%AUTOMATION%') as automation,
        COUNT(*) FILTER (WHERE description LIKE '%FULL-STACK%') as fullstack,
        COUNT(*) FILTER (WHERE description LIKE '%PERSONAL GROWTH%') as personal
      FROM topics
    `);
    
    const summary = categoryResult.rows[0];
    console.log('\n📊 Import Summary:');
    console.log(`   Total Topics: ${summary.total}`);
    console.log(`   Next.js: ${summary.nextjs}`);
    console.log(`   Node.js: ${summary.nodejs}`);
    console.log(`   AI & ML: ${summary.ai}`);
    console.log(`   Automation: ${summary.automation}`);
    console.log(`   Full-Stack: ${summary.fullstack}`);
    console.log(`   Personal Growth: ${summary.personal}`);
    
  } catch (error) {
    console.error('❌ Error importing topics:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

importTopics()
  .then(() => {
    console.log('🎉 Topic import complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Topic import failed:', error);
    process.exit(1);
  });

