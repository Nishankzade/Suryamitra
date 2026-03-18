// src/lib/db.ts
// Neon Database connection + schema

import { neon } from '@neondatabase/serverless'

// Create the SQL connection using your Neon DATABASE_URL from .env.local
const sql = neon(process.env.DATABASE_URL!)

export default sql

// ============================================================
// DATABASE SCHEMA
// Run this once to set up your tables in Neon DB
// Either run: node src/lib/db-setup.js
// Or paste each CREATE TABLE in the Neon SQL editor
// ============================================================
export async function setupDatabase() {
  // USERS TABLE — stores login credentials
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        VARCHAR(100) NOT NULL,
      email       VARCHAR(255) UNIQUE NOT NULL,
      password    VARCHAR(255) NOT NULL,        -- bcrypt hashed, never plain text
      mobile      VARCHAR(15),
      age         INTEGER,                      -- user's age
      state       VARCHAR(50),                  -- user's state for personalized schemes
      occupation  VARCHAR(50),                  -- farmer, homeowner, student, etc.
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    )
  `

  // CONVERSATIONS TABLE — each chat session
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       VARCHAR(255) DEFAULT 'New Chat',   -- auto-generated from first message
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    )
  `

  // MESSAGES TABLE — every single message in every conversation
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
      content         TEXT NOT NULL,
      detected_lang   VARCHAR(10) DEFAULT 'en',     -- hi, en, mr, gu, ta, etc.
      created_at      TIMESTAMP DEFAULT NOW()
    )
  `

  // SESSIONS TABLE — JWT refresh tokens
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       VARCHAR(500) NOT NULL,
      expires_at  TIMESTAMP NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `

  console.log('✅ All tables created successfully in Neon DB!')
}

// ============================================================
// HELPER FUNCTIONS — used across the app
// ============================================================

// Get all conversations for a user (for sidebar)
export async function getUserConversations(userId: string) {
  return await sql`
    SELECT c.id, c.title, c.created_at,
           COUNT(m.id) as message_count
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    WHERE c.user_id = ${userId}
    GROUP BY c.id, c.title, c.created_at, c.updated_at
    ORDER BY c.updated_at DESC
    LIMIT 20
  `
}

// Get all messages in a conversation (for chat history / AI context)
export async function getConversationMessages(conversationId: string) {
  const rows = await sql`
    SELECT role, content, detected_lang, created_at
    FROM messages
    WHERE conversation_id = ${conversationId}
    ORDER BY created_at ASC
  `
  return rows
}

// Check whether a conversation belongs to a specific user
export async function getConversationForUser(conversationId: string, userId: string) {
  const result = await sql`
    SELECT id, user_id, title, created_at, updated_at
    FROM conversations
    WHERE id = ${conversationId} AND user_id = ${userId}
    LIMIT 1
  `
  return result[0] || null
}

// Save a message to DB
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  detectedLang: string = 'en'
) {
  return await sql`
    INSERT INTO messages (conversation_id, role, content, detected_lang)
    VALUES (${conversationId}, ${role}, ${content}, ${detectedLang})
    RETURNING id
  `
}

// Create new conversation
export async function createConversation(userId: string, firstMessage: string) {
  // Auto-generate title from first 50 chars of first message
  const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
  const result = await sql`
    INSERT INTO conversations (user_id, title)
    VALUES (${userId}, ${title})
    RETURNING id
  `
  return result[0].id
}

// Update conversation title (used by AI title generator)
export async function updateConversationTitle(id: string, title: string) {
  return await sql`
    UPDATE conversations
    SET title = ${title}, updated_at = NOW()
    WHERE id = ${id}
  `
}

// Delete conversation (recursive delete handled by ON DELETE CASCADE in schema)
export async function deleteConversation(id: string, userId: string) {
  return await sql`
    DELETE FROM conversations
    WHERE id = ${id} AND user_id = ${userId}
  `
}

// Get user by email (for login)
export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `
  return result[0] || null
}

// Create new user (for register)
export async function createUser(
  name: string,
  email: string,
  hashedPassword: string,
  mobile?: string
) {
  const result = await sql`
    INSERT INTO users (name, email, password, mobile)
    VALUES (${name}, ${email}, ${hashedPassword}, ${mobile || null})
    RETURNING id, name, email, mobile, created_at
  `
  return result[0]
}

// Get user by ID
export async function getUserById(userId: string) {
  const result = await sql`
    SELECT id, name, email, mobile, age, state, city, occupation, roof_size, energy_needs, additional_info, created_at
    FROM users 
    WHERE id = ${userId} 
    LIMIT 1
  `
  return result[0] || null
}

// Update user name and age
export async function updateUserProfile(
  userId: string, 
  name?: string, 
  age?: number,
  state?: string,
  city?: string,
  occupation?: string,
  roofSize?: string,
  energyNeeds?: string,
  additionalInfo?: string
) {
  const setClause: string[] = ['updated_at = NOW()']
  const values: any[] = []
  let paramIndex = 1
  
  if (name !== undefined) {
    setClause.push(`name = $${paramIndex}`)
    values.push(name)
    paramIndex++
  }
  if (age !== undefined) {
    setClause.push(`age = $${paramIndex}`)
    values.push(age)
    paramIndex++
  }
  if (state !== undefined) {
    setClause.push(`state = $${paramIndex}`)
    values.push(state)
    paramIndex++
  }
  if (city !== undefined) {
    setClause.push(`city = $${paramIndex}`)
    values.push(city)
    paramIndex++
  }
  if (occupation !== undefined) {
    setClause.push(`occupation = $${paramIndex}`)
    values.push(occupation)
    paramIndex++
  }
  if (roofSize !== undefined) {
    setClause.push(`roof_size = $${paramIndex}`)
    values.push(roofSize)
    paramIndex++
  }
  if (energyNeeds !== undefined) {
    setClause.push(`energy_needs = $${paramIndex}`)
    values.push(energyNeeds)
    paramIndex++
  }
  if (additionalInfo !== undefined) {
    setClause.push(`additional_info = $${paramIndex}`)
    values.push(additionalInfo)
    paramIndex++
  }
  
  if (setClause.length === 1) return null // Only has updated_at
  
  values.push(userId)
  
  const result = await sql`
    UPDATE users 
    SET ${setClause.join(', ')}
    WHERE id = ${userId}
    RETURNING id, name, email, mobile, age, state, city, occupation, roof_size, energy_needs, additional_info
  `
  return result[0] || null
}
