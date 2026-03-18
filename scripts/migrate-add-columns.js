#!/usr/bin/env node
// scripts/migrate-add-columns.js
// Run this to add missing columns to your existing database

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

async function runMigration() {
  try {
    console.log('🔄 Starting database migration...')
    
    const columns = [
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'roof_size', type: 'VARCHAR(100)' },
      { name: 'energy_needs', type: 'VARCHAR(255)' },
      { name: 'additional_info', type: 'TEXT' },
    ]

    for (const col of columns) {
      try {
        // Check if column exists
        const result = await sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = ${col.name}
        `
        
        if (result.length === 0) {
          // Add column if it doesn't exist
          await sql(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`)
          console.log(`✅ Column '${col.name}' added`)
        } else {
          console.log(`ℹ️ Column '${col.name}' already exists`)
        }
      } catch (err) {
        console.error(`❌ Error adding column '${col.name}':`, err.message)
      }
    }

    console.log('\n✅ Migration completed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
