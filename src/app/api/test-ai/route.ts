// src/app/api/test-ai/route.ts
// GET /api/test-ai — tests if Groq API key is working
// Visit http://localhost:3000/api/test-ai to diagnose issues

import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export async function GET(request: NextRequest) {
    const apiKey = process.env.GROQ_API_KEY

    if (!apiKey) {
        return Response.json({
            status: 'error ❌',
            issue: 'GROQ_API_KEY is missing from .env.local',
            fix: 'Get your key from console.groq.com and add GROQ_API_KEY=gsk_... to .env.local, then restart the server',
        }, { status: 500 })
    }

    try {
        const groq = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
        })

        const result = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Say exactly: "SuryaMitra ready!" — nothing else.' }],
            max_tokens: 20,
        })

        const aiSaid = result.choices[0]?.message?.content?.trim() ?? ''

        return Response.json({
            status: 'success ✅',
            message: 'Groq API is working! SuryaMitra chat is ready.',
            aiSaid,
            model: result.model,
            keyPreview: apiKey.substring(0, 10) + '...',
        })
    } catch (err: any) {
        let issue = err?.message || 'Unknown error'
        let fix = 'Check your Groq API key at console.groq.com'

        if (issue.includes('401') || issue.includes('Invalid API Key') || issue.includes('invalid_api_key')) {
            issue = 'API key is invalid or revoked'
            fix = 'Go to console.groq.com → API Keys → create a new key'
        } else if (issue.includes('insufficient_quota') || issue.includes('quota')) {
            issue = 'Groq quota exhausted'
            fix = 'Check your usage at console.groq.com'
        } else if (issue.includes('429') || issue.includes('rate_limit')) {
            issue = 'Rate limit hit'
            fix = 'Wait a moment and try again, or check your limits at console.groq.com'
        }

        return Response.json({
            status: 'error ❌',
            issue,
            fix,
            keyPreview: apiKey.substring(0, 10) + '...',
        }, { status: 500 })
    }
}
