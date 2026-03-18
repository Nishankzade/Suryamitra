async function run() {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer AIzaSyAv0PnoYKB2ZR2goKT7dbU3e4DWigO-H-U'
            },
            body: JSON.stringify({
                model: 'gemini-1.5-flash',
                messages: [{role: 'user', content: 'hello'}]
            })
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Body:", text);
    } catch (e) {
        console.error(e);
    }
}
run();
