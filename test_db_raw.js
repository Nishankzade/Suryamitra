import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    try {
        console.log("Starting DB tests...");
        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`SELECT * FROM conversations ORDER BY created_at DESC LIMIT 5`;
        console.log("Conversations:", rows.length);
        
        if (rows.length > 0) {
            const msgs = await sql`SELECT * FROM messages WHERE conversation_id = ${rows[0].id} ORDER BY created_at ASC`;
            console.log("Messages for conv", rows[0].id, ":", msgs.length);
        }
    } catch (e) {
        console.error("DB Test Failed:", e);
    }
}
run();
