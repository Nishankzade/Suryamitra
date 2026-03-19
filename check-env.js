// Check environment variables
require('dotenv').config({ path: '.env.local' });

console.log('=== Environment Variables Check ===');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? '✅ Set' : '❌ Not set');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Not set');

if (process.env.GROQ_API_KEY) {
  console.log('Groq key starts with:', process.env.GROQ_API_KEY.substring(0, 10) + '...');
}
