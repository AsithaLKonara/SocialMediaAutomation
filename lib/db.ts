import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// On macOS Homebrew, default user is the system username
const defaultUser = require('os').userInfo().username;

const {
  POSTGRES_HOST = 'localhost',
  POSTGRES_PORT = '5432',
  POSTGRES_USER = defaultUser,
  POSTGRES_PASSWORD = '',
  POSTGRES_DB = 'socialpost_ai',
  DATABASE_URL,
} = process.env;

// Use DATABASE_URL if provided (e.g., from Heroku), otherwise construct from individual variables
const connectionString = DATABASE_URL || `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

// Create a connection pool
const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error });
    throw error;
  }
};

// Helper function to get a client from the pool for transactions
export const getClient = () => {
  return pool.connect();
};

export default pool;
