import { createConversation, saveMessage, getConversationMessages } from './src/lib/db.ts';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
    try {
        console.log("Starting DB tests...");
        const sql = neon(process.env.DATABASE_URL!);
        const res = await sql`SELECT id FROM users LIMIT 1`;
        if (res.length === 0) { console.log('No users found.'); return; }
        const userId = res[0].id;
        console.log(`Using user ID: ${userId}`);

        console.log("Creating conversation...");
        const convId = await createConversation(userId, "Hello Surya!");
        console.log(`Created Conversation ID: ${convId}`);

        console.log("Saving user message...");
        const msgId = await saveMessage(convId, 'user', "Hello Surya!", 'hi');
        console.log("Saved msg:", msgId);

        console.log("Saving assistant message...");
        await saveMessage(convId, 'assistant', "Namaste!", 'hi');
        
        console.log("Fetching messages...");
        const msgs = await getConversationMessages(convId);
        console.log(`Found ${msgs.length} messages.`);
        console.log(msgs[0]);
    } catch (e) {
        console.error("DB Test Failed:", e);
    }
}
run();
