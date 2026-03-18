// src/lib/db-setup.js
// Run this to create database tables in Neon
// Usage: node src/lib/db-setup.js

const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables')
  console.log('Please add DATABASE_URL to your .env.local file')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...')
    
    // USERS TABLE
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,        -- bcrypt hashed, never plain text
        mobile      VARCHAR(15),
        age         INTEGER,                      -- user's age
        state       VARCHAR(50),                  -- user's state for personalized schemes
        city        VARCHAR(100),                 -- user's city
        occupation  VARCHAR(50),                  -- farmer, homeowner, student, etc.
        roof_size   VARCHAR(100),                 -- size of roof for solar (e.g., "500 sq ft")
        energy_needs VARCHAR(255),                -- energy requirements (e.g., "5 kW daily")
        additional_info TEXT,                     -- any additional user information
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ Users table created')
    
    // CONVERSATIONS TABLE
    await sql`
      CREATE TABLE IF NOT EXISTS conversations (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title       VARCHAR(255) DEFAULT 'New Chat',   -- auto-generated from first message
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ Conversations table created')
    
    // MESSAGES TABLE
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role          VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        content       TEXT NOT NULL,
        lang          VARCHAR(10) DEFAULT 'en',
        created_at     TIMESTAMP DEFAULT NOW()
      )
    `
    console.log('✅ Messages table created')
    
    console.log('🎉 Database setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupDatabase()
