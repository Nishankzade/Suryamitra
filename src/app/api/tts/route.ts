// src/app/api/tts/route.ts
// POST /api/tts — Server-side TTS using Microsoft Edge Neural voices
// Uses edge-tts-universal for reliable connectivity (handles Sec-MS-GEC tokens)

import { NextRequest } from 'next/server'
import { EdgeTTS } from 'edge-tts-universal'
import { preprocessForTTS } from '@/lib/tts-preprocessor'

// ─── VOICE MAPPING — cute, youthful male voices per language ──────────────────
// These are warm, natural-sounding male Neural voices from Microsoft
const VOICE_MAP: Record<string, string> = {
    hi: 'hi-IN-MadhurNeural',      // Hindi
    en: 'en-IN-PrabhatNeural',     // English
    gu: 'gu-IN-NiranjanNeural',    // Gujarati
    ta: 'ta-IN-ValluvarNeural',    // Tamil
    mr: 'mr-IN-ManoharNeural',     // Marathi
    bn: 'bn-IN-BashkarNeural',     // Bengali
    te: 'te-IN-MohanNeural',       // Telugu
    kn: 'kn-IN-GaganNeural',       // Kannada
    ml: 'ml-IN-MidhunNeural',      // Malayalam
    pa: 'pa-IN-NavneetNeural',     // Punjabi
}

// Default fallback
const DEFAULT_VOICE = 'hi-IN-MadhurNeural'

// ─── MAX TEXT LENGTH (to prevent abuse) ───────────────────────────────────────
const MAX_TEXT_LENGTH = 5000

// Simple language detection
function detectLanguage(text: string): string {
    const hindiChars = /[\u0900-\u097F]/.test(text)
    const englishChars = /^[a-zA-Z\s]+$/.test(text)
    
    if (hindiChars) return 'hi'
    if (englishChars) return 'en'
    return 'en' // default
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { text, lang = 'en', rate, pitch } = body

        if (!text?.trim()) {
            return Response.json({ error: 'Text is required' }, { status: 400 })
        }

        // Preprocess text for natural pronunciation
        const processedText = preprocessForTTS(text, lang)

        if (!processedText) {
            return Response.json({ error: 'No speakable content after processing' }, { status: 400 })
        }

        // Truncate if too long (safety limit)
        const finalText = processedText.slice(0, MAX_TEXT_LENGTH)

        // Select voice
        const voice = VOICE_MAP[lang] || DEFAULT_VOICE

        // Build prosody options — tuned for cute, energetic boy voice
        const prosodyOptions: { rate?: string; pitch?: string; volume?: string } = {
            rate: rate || '+5%',      // Slightly faster for energetic, youthful vibe
            pitch: pitch || '+10Hz',  // Moderately higher pitch for a cute, boyish tone
            volume: '+5%',            // Slightly louder for confident, clear presence
        }

        // Generate audio using edge-tts-universal
        const tts = new EdgeTTS(finalText, voice, prosodyOptions)
        const result = await tts.synthesize()

        // Get the audio as an ArrayBuffer then convert to Uint8Array
        const arrayBuffer = await result.audio.arrayBuffer()
        const audioData = new Uint8Array(arrayBuffer)

        if (!audioData || audioData.length === 0) {
            console.warn('TTS: No audio generated, using fallback')
            // Return a simple text response as fallback
            return Response.json({ 
                message: 'Audio generation failed. Here is the text: ' + text,
                fallback: true 
            }, { status: 200 })
        }

        // Return as audio/mpeg
        return new Response(audioData, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioData.length.toString(),
                'Cache-Control': 'public, max-age=3600',
            },
        })

    } catch (error: any) {
        console.error('TTS Error:', error?.message || error)
        return Response.json({ 
            error: 'TTS failed: ' + (error.message || 'Unknown error'),
            fallback: 'Text-to-speech is temporarily unavailable'
        }, { status: 500 })
    }
}