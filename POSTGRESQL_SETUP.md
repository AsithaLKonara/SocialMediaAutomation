# 🐘 PostgreSQL Setup Guide

Complete guide for setting up PostgreSQL database for SocialPost AI.

## Prerequisites

1. **Install PostgreSQL** on your system:
   - **macOS**: `brew install postgresql@14` or download from [PostgreSQL.org](https://www.postgresql.org/download/)
   - **Windows**: Download installer from [PostgreSQL.org](https://www.postgresql.org/download/windows/)
   - **Linux**: `sudo apt-get install postgresql postgresql-contrib` (Ubuntu/Debian)

2. **Start PostgreSQL service**:
   ```bash
   # macOS (using Homebrew)
   brew services start postgresql@14
   
   # Linux
   sudo service postgresql start
   
   # Windows
   # PostgreSQL service should start automatically after installation
   ```

## Configuration

### 1. Update Environment Variables

Create or update your `.env` file:

```env
# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=socialpost_ai

# Or use DATABASE_URL (recommended for production)
# DATABASE_URL=postgresql://user:password@localhost:5432/socialpost_ai
```

### 2. Set PostgreSQL Password (if needed)

```bash
# Connect to PostgreSQL
psql -U postgres

# Set password (in psql prompt)
ALTER USER postgres PASSWORD 'postgres';

# Exit
\q
```

## Database Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install `pg` (PostgreSQL client) and related dependencies.

### Step 2: Create Database and Tables

Run the setup script:

```bash
npm run db:setup
```

This script will:
- ✅ Create the `socialpost_ai` database if it doesn't exist
- ✅ Create `topics` table with all required fields
- ✅ Create `posts` table with all required fields
- ✅ Create indexes for better performance
- ✅ Set up triggers for automatic `updated_at` timestamp

### Step 3: Import Topics

Import all 200 topics from `topic_List.txt`:

```bash
npm run db:import-topics
```

This script will:
- ✅ Parse `topic_List.txt` file
- ✅ Extract all 200 topics organized by category
- ✅ Import topics into the database
- ✅ Show import summary

**Note**: If topics already exist, you'll be prompted to clear them first.

## Verification

### Check Database Connection

```bash
psql -U postgres -d socialpost_ai -c "SELECT COUNT(*) FROM topics;"
```

Should show: `count` with the number of imported topics (200).

### View Topics

```bash
psql -U postgres -d socialpost_ai -c "SELECT id, title, status FROM topics LIMIT 5;"
```

### View Tables

```bash
psql -U postgres -d socialpost_ai -c "\dt"
```

Should show: `topics` and `posts` tables.

## Troubleshooting

### Error: "password authentication failed"

**Solution**: Update PostgreSQL password or create a new user:

```bash
psql -U postgres

# Create new user
CREATE USER your_username WITH PASSWORD 'your_password';
ALTER USER your_username CREATEDB;

# Update .env with new credentials
```

### Error: "database does not exist"

**Solution**: The setup script should create it automatically. If not:

```bash
psql -U postgres

CREATE DATABASE socialpost_ai;
\q
```

Then run `npm run db:setup` again.

### Error: "connection refused"

**Solution**: Ensure PostgreSQL is running:

```bash
# Check status
brew services list | grep postgresql  # macOS
sudo service postgresql status          # Linux

# Start if not running
brew services start postgresql@14      # macOS
sudo service postgresql start          # Linux
```

### Error: "permission denied"

**Solution**: Grant permissions:

```bash
psql -U postgres

GRANT ALL PRIVILEGES ON DATABASE socialpost_ai TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
\q
```

## Database Schema

### Topics Table

```sql
CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  platforms TEXT[] DEFAULT ARRAY['linkedin', 'facebook', 'instagram', 'x'],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Posts Table

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  media_url VARCHAR(500),
  video_script TEXT,
  scheduled_time TIMESTAMP,
  posted_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'draft',
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
```

## Migrating from MongoDB

If you're migrating from MongoDB:

1. **Export data** from MongoDB (if needed):
   ```bash
   mongoexport --db autopost-ai --collection topics --out topics.json
   mongoexport --db autopost-ai --collection posts --out posts.json
   ```

2. **Setup PostgreSQL** (follow steps above)

3. **Import data** (create a migration script if needed)

4. **Update environment variables** to use PostgreSQL

5. **Test the application** to ensure everything works

## Production Recommendations

1. **Use connection pooling**: Already configured in `lib/db.ts`
2. **Set proper password**: Use strong passwords in production
3. **Enable SSL**: Configure SSL connections for remote databases
4. **Backup regularly**: Set up automated backups
5. **Monitor performance**: Use PostgreSQL monitoring tools
6. **Use DATABASE_URL**: For easier configuration management

## Quick Commands Reference

```bash
# Connect to database
psql -U postgres -d socialpost_ai

# List all tables
\dt

# View table structure
\d topics
\d posts

# Count records
SELECT COUNT(*) FROM topics;
SELECT COUNT(*) FROM posts;

# View recent topics
SELECT * FROM topics ORDER BY created_at DESC LIMIT 10;

# Clear all data (careful!)
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE topics CASCADE;
```

---

**Need help?** Check PostgreSQL logs or run the setup script with verbose output.

