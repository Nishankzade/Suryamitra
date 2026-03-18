import { GoogleGenerativeAI } from '@google/generative-ai';
async function run() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyAv0PnoYKB2ZR2goKT7dbU3e4DWigO-H-U`);
        const data = await response.json();
        console.log("Models:", data.models?.map((m: any) => m.name).join("\n"));
    } catch(e) { console.error(e); }
}
run();
