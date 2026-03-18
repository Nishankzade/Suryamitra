// src/lib/db-migration.ts - Database migration script to add age column

import sql from '@/lib/db'

// Migration: Add age column to users table
export async function addAgeColumn() {
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

// Run migration if this file is executed directly
if (require.main === module) {
  addAgeColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}
