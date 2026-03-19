const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    console.log('Testing connection...');
    const sql = neon(process.env.DATABASE_URL);
    
    // Simple test
    const result = await sql`SELECT NOW() as current_time`;
    console.log('✅ Connection successful! Current time:', result[0]?.current_time);
    
    // Check if tables exist
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('📋 Tables found:', tables.map(t => t.table_name));
    
    // Check if users exist
    const userCount = await sql`SELECT COUNT(*) as count FROM users`;
    console.log('👥 Users in database:', userCount[0]?.count);
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();
