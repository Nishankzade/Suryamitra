// src/lib/run-migration.js
// Run database migrations to add missing columns
// Usage: node src/lib/run-migration.js

require('dotenv').config({ path: '.env.local' })

// Import and run the migration
const { runAllMigrations } = require('./db-migration.ts')

runAllMigrations()
  .then(() => {
    console.log('🎉 Migration completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  })
