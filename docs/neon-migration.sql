-- SQL migration to add missing user profile columns to Neon database
-- Run this in your Neon SQL editor: https://console.neon.tech

-- Add city column
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Add roof_size column
ALTER TABLE users ADD COLUMN IF NOT EXISTS roof_size VARCHAR(100);

-- Add energy_needs column
ALTER TABLE users ADD COLUMN IF NOT EXISTS energy_needs VARCHAR(255);

-- Add additional_info column
ALTER TABLE users ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
