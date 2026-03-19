// src/lib/db-migration.js - Database migration script to add missing columns

const { neon } = require('@neondatabase/serverless')
require('dotenv').config({ path: '.env.local' })

const sql = neon(process.env.DATABASE_URL)

// Migration: Add age column to users table
async function addAgeColumn() {
  try {
    console.log('🔄 Adding age column to users table...')
    
    // Check if age column already exists
    const result = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'age'
    `
    
    if (result.length === 0) {
      // Add age column if it doesn't exist
      await sql`
        ALTER TABLE users 
        ADD COLUMN age INTEGER
      `
      console.log('✅ Age column added successfully to users table')
    } else {
      console.log('ℹ️ Age column already exists in users table')
    }
    
  } catch (error) {
    console.error('❌ Error adding age column:', error)
    throw error
  }
}

// Migration: Add new user profile columns
async function addUserProfileColumns() {
  try {
    console.log('🔄 Adding user profile columns...')
    
    const columnDefinitions = [
      { name: 'city', type: 'VARCHAR(100)' },
      { name: 'roof_size', type: 'VARCHAR(100)' },
      { name: 'energy_needs', type: 'VARCHAR(255)' },
      { name: 'additional_info', type: 'TEXT' },
    ]

    for (const col of columnDefinitions) {
      const checkResult = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = ${col.name}
      `
      
      if (checkResult.length === 0) {
        await sql`
          ALTER TABLE users 
          ADD COLUMN ${col.name} ${col.type}
        `
        console.log(`✅ Column '${col.name}' added successfully`)
      } else {
        console.log(`ℹ️ Column '${col.name}' already exists`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error adding profile columns:', error)
    throw error
  }
}

// Run all migrations
async function runAllMigrations() {
  try {
    console.log('🚀 Running all migrations...')
    await addAgeColumn()
    await addUserProfileColumns()
    console.log('✅ All migrations completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Export for use in other files
module.exports = {
  addAgeColumn,
  addUserProfileColumns,
  runAllMigrations
}

// Run migration if this file is executed directly
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('🎉 Migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}
