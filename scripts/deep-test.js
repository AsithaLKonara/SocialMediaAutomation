const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

let testsPassed = 0;
let testsFailed = 0;
const errors = [];

function logTest(name, passed, error = null) {
  if (passed) {
    console.log(`✅ ${name}`);
    testsPassed++;
  } else {
    console.log(`❌ ${name}`);
    if (error) {
      console.log(`   Error: ${error.message || error}`);
      errors.push({ test: name, error: error.message || String(error) });
    }
    testsFailed++;
  }
}

async function testDatabaseConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time');
    client.release();
    logTest('Database Connection', true);
    return true;
  } catch (error) {
    logTest('Database Connection', false, error);
    return false;
  }
}

async function testTopicsTable() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'generated') as generated,
        COUNT(*) FILTER (WHERE status = 'posted') as posted
      FROM topics
    `);
    const stats = result.rows[0];
    logTest(`Topics Table - Total: ${stats.total}, Pending: ${stats.pending}`, 
      stats.total === 200 && stats.pending > 0);
    return stats;
  } catch (error) {
    logTest('Topics Table Query', false, error);
    return null;
  }
}

async function testPostsTable() {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT platform) as platforms,
        COUNT(*) FILTER (WHERE status = 'draft') as draft,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'posted') as posted
      FROM posts
    `);
    const stats = result.rows[0];
    logTest(`Posts Table - Total: ${stats.total}, Platforms: ${stats.platforms}`, true);
    return stats;
  } catch (error) {
    logTest('Posts Table Query', false, error);
    return null;
  }
}

async function testTableStructure() {
  try {
    // Check topics table structure
    const topicsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'topics'
      ORDER BY ordinal_position
    `);
    
    const requiredTopicsColumns = ['id', 'title', 'status', 'platforms', 'created_at', 'updated_at'];
    const hasAllColumns = requiredTopicsColumns.every(col => 
      topicsColumns.rows.some(row => row.column_name === col)
    );
    logTest('Topics Table Structure', hasAllColumns);
    
    // Check posts table structure
    const postsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `);
    
    const requiredPostsColumns = ['id', 'topic_id', 'platform', 'content', 'status', 'created_at'];
    const hasAllPostsColumns = requiredPostsColumns.every(col => 
      postsColumns.rows.some(row => row.column_name === col)
    );
    logTest('Posts Table Structure', hasAllPostsColumns);
    
    return hasAllColumns && hasAllPostsColumns;
  } catch (error) {
    logTest('Table Structure Check', false, error);
    return false;
  }
}

async function testIndexes() {
  try {
    const indexes = await pool.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND tablename IN ('topics', 'posts')
      ORDER BY tablename, indexname
    `);
    
    const hasIndexes = indexes.rows.length >= 5; // Should have multiple indexes
    logTest(`Database Indexes (${indexes.rows.length} found)`, hasIndexes);
    return hasIndexes;
  } catch (error) {
    logTest('Indexes Check', false, error);
    return false;
  }
}

async function testAPIHealth() {
  try {
    const response = await axios.get(`${BASE_URL}/api/topics`, { timeout: 5000 });
    logTest('API Health - Topics Endpoint', response.status === 200 && response.data.success);
    return response.data.success;
  } catch (error) {
    logTest('API Health Check', false, error);
    return false;
  }
}

async function testTopicsAPI() {
  try {
    const response = await axios.get(`${BASE_URL}/api/topics`, { timeout: 5000 });
    const isValid = response.status === 200 && 
                    response.data.success && 
                    Array.isArray(response.data.data) &&
                    response.data.data.length > 0;
    logTest(`Topics API - Retrieved ${response.data.data.length} topics`, isValid);
    return response.data.data;
  } catch (error) {
    logTest('Topics API', false, error);
    return null;
  }
}

async function testCreateTopic() {
  try {
    const testTopic = {
      title: `[TEST] Deep Test Topic ${Date.now()}`,
      description: 'This is a test topic created during deep testing',
      platforms: ['linkedin', 'facebook']
    };
    
    const response = await axios.post(`${BASE_URL}/api/topics`, testTopic, { timeout: 10000 });
    const isValid = response.status === 201 && 
                    response.data.success && 
                    response.data.data.title === testTopic.title;
    
    if (isValid) {
      logTest('Create Topic API', true);
      return response.data.data;
    } else {
      logTest('Create Topic API', false, 'Invalid response format');
      return null;
    }
  } catch (error) {
    logTest('Create Topic API', false, error);
    return null;
  }
}

async function testGeneratePosts(topicId) {
  if (!topicId) {
    logTest('Generate Posts API', false, 'No topic ID provided');
    return null;
  }
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/posts/generate`, 
      { topicId, platforms: ['linkedin', 'facebook'] },
      { timeout: 60000 }
    );
    
    const isValid = response.status === 200 && 
                    response.data.success && 
                    Array.isArray(response.data.data) &&
                    response.data.data.length > 0;
    
    logTest(`Generate Posts API - Created ${response.data.data.length} posts`, isValid);
    return response.data.data;
  } catch (error) {
    logTest('Generate Posts API', false, error);
    return null;
  }
}

async function testPostsAPI() {
  try {
    const response = await axios.get(`${BASE_URL}/api/posts`, { timeout: 5000 });
    const isValid = response.status === 200 && 
                    response.data.success && 
                    Array.isArray(response.data.data);
    logTest(`Posts API - Retrieved ${response.data.data.length} posts`, isValid);
    return response.data.data;
  } catch (error) {
    logTest('Posts API', false, error);
    return null;
  }
}

async function testPlatformFilter() {
  try {
    const platforms = ['linkedin', 'facebook', 'instagram', 'x'];
    let allPassed = true;
    
    for (const platform of platforms) {
      try {
        const response = await axios.get(`${BASE_URL}/api/posts?platform=${platform}`, { timeout: 5000 });
        const isValid = response.status === 200 && response.data.success;
        if (!isValid) allPassed = false;
      } catch (error) {
        allPassed = false;
      }
    }
    
    logTest('Platform Filter API', allPassed);
    return allPassed;
  } catch (error) {
    logTest('Platform Filter API', false, error);
    return false;
  }
}

async function testDataIntegrity() {
  try {
    // Check foreign key integrity
    const orphanPosts = await pool.query(`
      SELECT COUNT(*) as count
      FROM posts p
      LEFT JOIN topics t ON p.topic_id = t.id
      WHERE t.id IS NULL
    `);
    
    const hasOrphans = parseInt(orphanPosts.rows[0].count) > 0;
    logTest('Data Integrity - No Orphan Posts', !hasOrphans);
    
    // Check platform values
    const invalidPlatforms = await pool.query(`
      SELECT COUNT(*) as count
      FROM posts
      WHERE platform NOT IN ('linkedin', 'facebook', 'instagram', 'x', 'tiktok')
    `);
    
    const hasInvalidPlatforms = parseInt(invalidPlatforms.rows[0].count) > 0;
    logTest('Data Integrity - Valid Platforms', !hasInvalidPlatforms);
    
    return !hasOrphans && !hasInvalidPlatforms;
  } catch (error) {
    logTest('Data Integrity Check', false, error);
    return false;
  }
}

async function testSampleTopics() {
  try {
    const result = await pool.query(`
      SELECT id, title, status, platforms, description
      FROM topics
      WHERE description IS NOT NULL
      LIMIT 5
    `);
    
    const allValid = result.rows.every(topic => 
      topic.title && 
      topic.status && 
      Array.isArray(topic.platforms) &&
      topic.platforms.length > 0
    );
    
    logTest(`Sample Topics Validation (${result.rows.length} checked)`, allValid);
    return allValid;
  } catch (error) {
    logTest('Sample Topics Check', false, error);
    return false;
  }
}

async function testPlatformDistribution() {
  try {
    const result = await pool.query(`
      SELECT platform, COUNT(*) as count
      FROM posts
      GROUP BY platform
      ORDER BY count DESC
    `);
    
    const hasPosts = result.rows.length > 0;
    logTest(`Platform Distribution - ${result.rows.length} platforms with posts`, hasPosts);
    
    if (hasPosts) {
      result.rows.forEach(row => {
        console.log(`   - ${row.platform}: ${row.count} posts`);
      });
    }
    
    return hasPosts;
  } catch (error) {
    logTest('Platform Distribution', false, error);
    return false;
  }
}

async function cleanupTestData() {
  try {
    await pool.query(`DELETE FROM posts WHERE content LIKE '%[TEST]%'`);
    await pool.query(`DELETE FROM topics WHERE title LIKE '%[TEST]%'`);
    logTest('Cleanup Test Data', true);
  } catch (error) {
    logTest('Cleanup Test Data', false, error);
  }
}

async function runAllTests() {
  console.log('\n🧪 Starting Deep Test Suite...\n');
  console.log('=' .repeat(60));
  console.log('DATABASE TESTS');
  console.log('=' .repeat(60));
  
  // Database Tests
  await testDatabaseConnection();
  await testTopicsTable();
  await testPostsTable();
  await testTableStructure();
  await testIndexes();
  await testDataIntegrity();
  await testSampleTopics();
  await testPlatformDistribution();
  
  console.log('\n' + '=' .repeat(60));
  console.log('API TESTS');
  console.log('=' .repeat(60));
  
  // API Tests
  const apiWorking = await testAPIHealth();
  
  if (apiWorking) {
    await testTopicsAPI();
    const testTopic = await testCreateTopic();
    await testPostsAPI();
    await testPlatformFilter();
    
    if (testTopic) {
      console.log('\n' + '=' .repeat(60));
      console.log('POST GENERATION TEST');
      console.log('=' .repeat(60));
      await testGeneratePosts(testTopic._id || testTopic.id);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('CLEANUP');
  console.log('=' .repeat(60));
  await cleanupTestData();
  
  console.log('\n' + '=' .repeat(60));
  console.log('TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Tests Passed: ${testsPassed}`);
  console.log(`❌ Tests Failed: ${testsFailed}`);
  console.log(`📊 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }
  
  console.log('\n' + '=' .repeat(60));
  
  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is fully operational.');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Review errors above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Fatal error during testing:', error);
  process.exit(1);
});

