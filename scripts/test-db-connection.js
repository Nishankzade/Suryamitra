#!/usr/bin/env node
// scripts/test-db-connection.js
// Simple script to test if DATABASE_URL is correct

require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL

console.log('\n🔍 Testing Database Connection...\n')

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found in .env.local')
  console.error('\nSet it like this:')
  console.error('DATABASE_URL=postgresql://neondb_owner:npg_YOUR_PASSWORD@ep-YOUR_ENDPOINT.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
  process.exit(1)
}

console.log('✅ DATABASE_URL found!')
console.log('🔗 Connection string (first 50 chars):', DATABASE_URL.substring(0, 50) + '...')

const sql = neon(DATABASE_URL)

async function testConnection() {
  try {
    console.log('\n🔄 Connecting to database...')
    
    // Simple test query
    const result = await sql`SELECT version()`
    
    console.log('✅ Connection successful!')
    console.log('📊 Database version:', result[0].version.split(',')[0])
    
    // Check if users table exists
    console.log('\n🔍 Checking users table...')
    const tables = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `
    
    if (tables.length === 0) {
      console.error('❌ Users table not found!')
      console.error('Run: npm run db:push')
      process.exit(1)
    }
    
    console.log('✅ Users table found!')
    console.log('\n📋 User table columns:')
    tables.forEach((col, i) => {
      console.log(`  ${i + 1}. ${col.column_name} (${col.data_type})`)
    })
    
    // Check for new columns
    const newCols = ['city', 'roof_size', 'energy_needs', 'additional_info']
    const foundCols = tables.map(t => t.column_name)
    const missingCols = newCols.filter(col => !foundCols.includes(col))
    
    if (missingCols.length > 0) {
      console.log('\n⚠️ Missing columns:', missingCols.join(', '))
      console.log('Run: npm run migrate')
    } else {
      console.log('\n✅ All required columns exist!')
    }
    
    console.log('\n🎉 Database setup is complete!\n')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Connection failed!')
    console.error('Error:', error.message)
    console.error('\nMake sure:')
    console.error('1. DATABASE_URL in .env.local is correct')
    console.error('2. URL starts with: postgresql://')
    console.error('3. URL ends with: ?sslmode=require&channel_binding=require')
    console.error('4. You have internet connection')
    console.error('5. Neon database is active (not paused)')
    process.exit(1)
  }
}

testConnection()
