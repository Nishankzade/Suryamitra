import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
    try {
        console.log("Testing native Gemini fallback...");
        const genAI = new GoogleGenerativeAI('AIzaSyAv0PnoYKB2ZR2goKT7dbU3e4DWigO-H-U');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: 'Hello' }] },
                { role: 'model', parts: [{ text: 'Hi there!' }] }
            ]
        });
        
        const result = await chat.sendMessageStream([{text: 'How are you?'}]);
        for await (const chunk of result.stream) {
            process.stdout.write(chunk.text());
        }
        console.log("\nDone!");
    } catch (e) {
        console.error("\nError:", e);
    }
}
run();
