import fs from 'fs';
import OpenAI from 'openai';

async function testStt() {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        console.error("GROQ_API_KEY not set");
        return;
    }
    const groq = new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1',
    });
    // Create a dummy webm or use openai's toFile
    try {
        const dummyAudio = Buffer.from(new Uint8Array(100)); // Just to see if it rejects because it's invalid media
        const nodeFile = await OpenAI.toFile(dummyAudio, 'audio.webm', { type: 'audio/webm' });
        const res = await groq.audio.transcriptions.create({
            file: nodeFile,
            model: 'whisper-large-v3-turbo',
            response_format: 'json',
            temperature: 0,
        });
        console.log("Success", res);
    } catch (e: any) {
        console.error("STT Error:", e.message);
    }
}
testStt();
