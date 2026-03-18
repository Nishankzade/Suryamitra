import { EdgeTTS } from 'edge-tts-universal';

async function test() {
    try {
        const text = "Hello world";
        const voice = "hi-IN-MadhurNeural";
        const prosodyOptions = {
            rate: '+5%',
            pitch: '+10Hz',
            volume: '+5%',
        };
        const tts = new EdgeTTS({
            voice,
            pitch: '+10Hz',
            rate: '+5%',
            volume: '+5%'
        });
        await tts.synthesize(text, 'output.mp3');
        console.log("Success with object params");
    } catch (e: any) {
        console.error("Error with object params:", e.message);
    }

    try {
        const tts = new EdgeTTS("Hello world", "hi-IN-MadhurNeural");
        const res = await tts.synthesize();
        console.log("Success with positional", res ? "got res" : "no res");
    } catch (e: any) {
        console.error("Error with positional:", e.message);
    }
}
test();
