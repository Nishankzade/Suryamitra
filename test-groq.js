// Test Groq API key
require('dotenv').config({ path: '.env.local' });

const groqKey = process.env.GROQ_API_KEY;

console.log('=== Groq API Key Test ===');
console.log('Key exists:', !!groqKey);
console.log('Key length:', groqKey?.length || 0);
console.log('Key starts with gsk_:', groqKey?.startsWith('gsk_') || false);
console.log('Key format check:', groqKey?.match(/^gsk_[A-Za-z0-9]{48,}$/) ? '✅ Valid format' : '❌ Invalid format');

if (groqKey) {
  console.log('First 10 chars:', groqKey.substring(0, 10));
  console.log('Last 10 chars:', groqKey.substring(groqKey.length - 10));
}
