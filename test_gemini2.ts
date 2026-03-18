import OpenAI from 'openai';

async function run() {
    try {
        console.log("Testing Gemini fallback...");
        const gemini = new OpenAI({
            apiKey: 'AIzaSyAv0PnoYKB2ZR2goKT7dbU3e4DWigO-H-U',
            baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        });
        const stream = await gemini.chat.completions.create({
           model: 'gemini-1.5-flash',
           messages: [
             { role: 'system', content: 'You are a bot.' },
             { role: 'user', content: 'Hello' },
           ],
           stream: true,
           max_tokens: 50,
        });

        for await (const chunk of stream) {
            process.stdout.write(chunk.choices[0]?.delta?.content || '');
        }
        console.log("\nDone!");
    } catch (e: any) {
        console.error("\nError name:", e.name);
        console.error("Error message:", e.message);
        console.error("Error status:", e.status);
    }
}
run();
