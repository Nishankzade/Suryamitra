// src/lib/simple-db-setup.js - Simpler database setup

const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const sql = neon(databaseUrl)

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database tables...')
    
    // USERS TABLE
    await sql(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(15),
        age INTEGER,
        state VARCHAR(50),
        city VARCHAR(100),
        occupation VARCHAR(50),
        roof_size VARCHAR(100),
        energy_needs VARCHAR(255),
        additional_info TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Users table created')
    
    // CONVERSATIONS TABLE
    await sql(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) DEFAULT 'New Chat',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Conversations table created')
    
    // MESSAGES TABLE
    await sql(`
      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        lang VARCHAR(10) DEFAULT 'en',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✅ Messages table created')
    
    console.log('✅ Database setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Database setup failed:', error)
    throw error
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('🎉 Setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Setup failed:', error)
    process.exit(1)
  })
