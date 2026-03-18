// src/app/api/stt/route.ts
// POST /api/stt — Server-side Speech-to-Text using Groq Whisper
// Receives audio blob (webm / ogg) from MediaRecorder and returns transcript

import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(request: NextRequest) {
    try {
        const groqKey = process.env.GROQ_API_KEY
        if (!groqKey) {
            return Response.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
        }

        // Parse multipart form data — audio blob sent as "audio" field
        const formData = await request.formData()
        const audioFile = formData.get('audio') as File | null
        const lang = (formData.get('lang') as string) || 'auto'  // 'hi', 'en', 'gu', 'ta', or 'auto'

        if (!audioFile || audioFile.size === 0) {
            return Response.json({ error: 'No audio data received' }, { status: 400 })
        }

        // Log mimeType for debugging MediaRecorder format issues
        console.log(`[STT] Received audio: size=${audioFile.size}B type=${audioFile.type}`)

        // Groq Whisper supports: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, webm
        // MediaRecorder outputs webm (Chrome/Edge) or ogg (Firefox)
        
        // MediaRecorder outputs webm (Chrome/Edge) or ogg (Firefox)
        // Some APIs reject file if the filename is 'blob' or lacks an extension.
        // Re-construct the File object with a proper name and type for Groq SDK
        const buffer = await audioFile.arrayBuffer()
        const ext = audioFile.type.includes('ogg') ? 'ogg' : 'webm'
        const properFile = new File([buffer], `audio.${ext}`, { type: audioFile.type || 'audio/webm' })

        const groq = new Groq({
            apiKey: groqKey,
        })

        // whisper-large-v3-turbo: fast + accurate, available on Groq
        const transcriptionOptions: any = {
            file: properFile,
            model: 'whisper-large-v3-turbo',
            response_format: 'json',
            temperature: 0,
        }

        // Language hint improves accuracy for Hindi / Gujarati / Tamil
        if (lang && lang !== 'auto') {
            const whisperLang = lang === 'hi' ? 'hi'
                : lang === 'gu' ? 'gu'
                    : lang === 'ta' ? 'ta'
                        : 'en'
            transcriptionOptions.language = whisperLang
        }

        const transcription = await groq.audio.transcriptions.create(transcriptionOptions)
        const text = transcription.text?.trim() || ''

        // FIX: return 400 (not 200) when transcript is empty so that client
        // can distinguish "no speech detected" from a successful empty result
        if (!text) {
            return Response.json({ error: 'No speech detected in audio' }, { status: 400 })
        }

        return Response.json({ transcript: text })

    } catch (error: any) {
        console.error('[STT] Error:', error?.message || error)
        return Response.json(
            { error: error?.message || 'Transcription failed. Please try again.' },
            { status: 500 }
        )
    }
}