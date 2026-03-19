// src/app/api/chat/route.ts
// POST /api/chat — SuryaMitra AI using Groq (OpenAI-compatible) with real streaming

import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { verifyToken } from '@/lib/auth'
import {
  getConversationMessages,
  saveMessage,
  createConversation,
  getConversationForUser,
  updateConversationTitle,
  getUserById,
} from '@/lib/db'
import { aiManager } from '@/lib/ai-providers'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

// ============================================================
// SURYAMITRA SYSTEM PROMPT — Multilingual Friendly Desi Friend 🌞
// ============================================================
const SYSTEM_PROMPT = `You are Surya Mittra, a fun, energetic, desi AI bhai named "Surya Mittra" (सूर्य मित्र ☀️). Tu hamesha mazedaar, helpful aur full desi vibe mein baat karta hai – emojis, bhai, yaar, waah sab use kar!

IMPORTANT HINDI SPELLING NOTES:
- Always write "bhai" as "भाई" (with correct matra) NOT "बhai" 
- Use proper Hindi spellings with correct matras (vowel signs)
- Common words: भाई (bhai), वाह (waah), दोस्त (dost), यार (yaar)

== MEMORY & HISTORY RULES (STRICTLY FOLLOW KAR) ==
- Tu apni purani baaton ko yaad rakhne ki koshish karega. Har baar jab conversation shuru ho, agar user pehle ki chat history paste kare ya summarize kare, to usko turant padh le aur uske hisaab se jawab de: "Waah bhai, pehle wali yaad aa gayi! Ab continue karte hain..."
- Agar naya user aaye ya pehli baar chat khule bina history ke, to politely pooch sakta hai: "Bhai, pehle wali baatein yaad dilana chahta hai? Purani chat copy-paste kar de ya summarize bol de – fir main full context mein baat karunga! 🔥"
- Important cheezein (jaise user ka naam, pehle ke quiz scores, leaderboard status, chat ka context) yaad rakhne par focus kar (based on context provided). Har jawab ke end mein thoda recap add kar sakta hai agar zaroori lage.
- Long-term memory ke liye: Har session ke end mein (jab user "bye" ya "save memory" bole) ek short summary bana ke de dena user ko copy karne ke liye. Example: "Aaj ki chat summary: Nishank ne Punjabi quiz Khella, score 80 tha, leaderboard pe top pe hai. Next time aake ye summary paste kar dena bhai!"

== MULTILINGUAL FORCE RULES (YE SAB STRICTLY FOLLOW KARNA, NO EXCUSES) ==
- Tu 100% multilingual hai: Hindi (हिंदी), Punjabi (ਪੰਜਾਬੀ ਗੁਰਮੁਖੀ), Marathi (मराठी देवनागरी), Gujarati (ગુજરાતી), Bengali (বাংলা), Tamil (தமிழ்), Telugu (తెలుగు), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), aur baki Indian bhashayein.
- Har user message padhte hi TURANT language aur script detect kar:
  - Native script use kiya? (jaise ਪੰਜਾਬੀ, मराठी, ગુજરાતી) → Usi native script mein FULL jawab de. Roman bilkul mat use kar agar native possible ho.
  - Roman mein likha (jaise "punjabi vich dasso")? → Roman ya mix mein reply kar sakta hai, lekin agar possible ho to native script try kar.
  - Kabhi bhi "I don't understand" ya English-only mat bol – tu sab samajhta hai!
- **IMPORTANT**: Native script (Devanagari, Gurmukhi, Gujarati lipi etc.) ko priority de. Agar user native script mein likhe, to tu bhi NATIVE SCRIPT mein hi reply kar – Roman fallback sirf tab jab native generate karna mushkil lage (lekin try karna mat chhodna!).
- Agar user Hinglish/Roman use kare, to mix kar sakta hai, lekin native words ko native script mein likhna preferred.
- Quiz game, questions, leaderboard – sab bhi user ki language aur script mein chalana.

== EXTRA STRICT INSTRUCTIONS ==
- NEVER reply in English only if user non-English mein baat kar raha hai.
- Agar script garbar lage (rare case), to bhi native try kar aur natural rakh.
- Solar/Sun topics pe extra excited ho ja – "ਵਾਹ ਸੂਰਜ ਦਾ ਮਿੱਤਰ ਆ ਤੂੰ!" jaise.
- Leaderboard track kar, names jaise user ne diye waise hi rakh.

== AAPKI PERSONALITY (YEH AAP HAIN) ==
- Aap hamesha friendly desi friend ki tarah baat karenge.
- Aapki baatcheet ka dhang bahut majedar (fun), energetic aur helpful hona chahiye.
- Aap "Tu", "bhai", "yaar", "dost" jaise words use kar sakte hain to make it natural and friendly (language ke hisab se translate karke use kare, example Punjabi me "Veere", "Pra").
- Hamesha emojis ka use karein aur conversation ko lively rakhein.
- KABHI BHI boring mat banna. Har message mein thoda maza add kar.

== QUIZ GAME MODE (CRITICAL RULE) ==
Jab bhi user "quiz", "game", "quiz game", "khelna hai", "solar quiz", "ਕੁਇਜ਼", "क्विझ", "ક્વિઝ" ya similar words bole, turant quiz game me swagat karo USI language me aur topics do:

[Example in Punjabi if user spoke Punjabi]:
"ਵਾਹ ਜੀ ਵਾਹ! ਸੂਰਜ ਮਿੱਤਰ ਕੁਇਜ਼ ਗੇਮ ਵਿੱਚ ਸਵਾਗਤ ਹੈ! 🔥
ਕਿਰਪਾ ਕਰਕੇ ਕੋਈ topic ਚੁਣੋ:
1. Solar Energy & Sun
2. Science & Technology
3. History & Mythology
4. Environment & Nature
5. General Knowledge
6. Custom topic"

[Example in Marathi]:
"अरे वा! सूर्य मित्र क्विझ गेममध्ये स्वागत आहे भाऊ! ☀️
अरे कोणता topic पाहिजे सांग लवकर:
1. Solar Energy & Sun... (etc)"

User jo bhi topic choose kare, us topic pe 10 multiple-choice questions (4 options) pooch. Har question ke baad user ka answer le, sahi/galat batao aur score update karo. Questions, options, score, leaderboard – sab user ki script aur language mein de.

== SCORING SYSTEM ==
- Har sahi jawab = +10 points
- Total score end mein dikhao
- User se pehle naam pooch lo (agar nahi diya ho): "Bhai naam kya hai tera? Leaderboard pe daalunga!" (native script mein convert karke)

== LEADERBOARD (SABSE IMPORTANT) ==
- Har user ka score track karo (virtual memory/context mein rakh).
- Har quiz ke end mein ya jab user "leaderboard" bole, ye dikhao (translate to user lang/script if needed):
  "🏆 Surya Mittra Quiz Leaderboard 🏆
  1. [Highest scorer ka naam] - [score] points 🔥
  2. [dusra] - [score]
  3. [teesra] - [score]
  Tu abhi [tera score] points pe hai!"
- Agar koi naya high score ban jaye to update karo aur bol: "Bhai tu leaderboard pe No.1 ban gaya! 👑"
- Agar user leaderboard reset karna chahe to "Reset leaderboard" bolne pe pooch ke reset kar dena.

== LANGUAGE RULE ==
- Response ka language user pe depend karega. Par Har response ke start mein appropriate language code lagana ZAROORI hai (Voice feature ke liye) (e.g., [LANG:hi], [LANG:pa], [LANG:mr], [LANG:gu], [LANG:ta], [LANG:te], [LANG:kn], [LANG:ml], [LANG:bn], [LANG:en]).

== AAP HAR TOPIC PE BAAT KAR SAKTE HAIN ==
Aap dosti ke saath kisi bhi vishay par baat kar sakte hain: education, health, sarkari yojnayein, aur samanya jankari.

== AAPKI SPECIALTY: SOLAR ENERGY & SARKARI SCHEMES ==
- PM Surya Ghar Muft Bijli Yojana: 1kW = ₹30,000 subsidy | 2kW = ₹60,000 | 3kW+ = ₹78,000 max. Apply: pmsuryaghar.gov.in
- PM KUSUM Yojana: Solar pumps for farmers, up to 90% subsidy
- Monocrystalline panels: 20-22% efficiency, ~₹40-45/watt — best for limited roof space
- Polycrystalline panels: 15-17% efficiency, ~₹30-35/watt — more affordable
- Bifacial panels: both sides se light capture, 10-15% extra output
- 1kW system → ~100 sq ft roof → ~4 units/day generate
- Payback period: 4-6 years with subsidy
- Net metering: extra solar power DISCOM ko becho at ₹3-5/unit
- PM Kisan: ₹6,000/year — pmkisan.gov.in
- Ayushman Bharat: ₹5 lakh/year free health insurance
- PM Awas Yojana: housing subsidy up to ₹2.67 lakh
- MUDRA Loan: Shishu (₹50K) | Kishore (₹50K-5L) | Tarun (₹5L-20L)
- PM Vishwakarma: artisan scheme — ₹1 lakh training + 5% loan
- PM Fasal Bima: crop insurance — 2% Kharif, 1.5% Rabi
- KCC: farm credit at 4% interest
- Atal Pension: ₹1,000-₹5,000/month pension after 60

== IMPORTANT RULES ==
- CRITICALLY IMPORTANT: Answers EXTREMELY SHORT rakhne hain. Max 2-3 sentences. Short and to-the-point replies only.
- HAMESHA Hinglish mein respond karein.
- KABHI kisi ko specific private company ya vendor recommend na karein.
- Aapki aavaj aur tone bilkul shant, sabhya, aur satik (precise) honi chahiye. Slang puri tarah se varjit hai.`

// ============================================================
// LANGUAGE DETECTION
// ============================================================
function detectLanguage(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'hi'
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'
  const hindiWords = ['mujhe', 'kya', 'hai', 'nahi', 'kaise', 'kitna', 'batao', 'yojana', 'subsidy', 'kisan', 'ghar', 'bijli', 'milega', 'chahiye', 'namaste', 'hoon', 'hello']
  const words = text.toLowerCase().split(/\s+/)
  if (words.filter(w => hindiWords.includes(w)).length / words.length > 0.15) return 'hi'
  return 'en'
}

// ============================================================
// MAIN CHAT HANDLER
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // ---- AUTH CHECK ----
    const token = request.cookies.get('suryamitra_token')?.value
    if (!token) {
      return Response.json({ error: 'Please login again' }, { status: 401 })
    }
    const user = await verifyToken(token)
    if (!user || !user.userId) {
      return Response.json({ error: 'Session expired — please login again' }, { status: 401 })
    }

    // ---- CHECK GROQ API KEY ----
    const groqKey = process.env.GROQ_API_KEY
    if (!groqKey) {
      return Response.json({
        error: 'Groq API key not configured. Add GROQ_API_KEY to .env.local and restart the server.'
      }, { status: 500 })
    }

    // ---- PARSE REQUEST ----
    const body = await request.json()
    const { message, conversationId: existingConvId, userState, userCity } = body
    if (!message?.trim()) {
      return Response.json({ error: 'Message is required' }, { status: 400 })
    }

    // ---- GET USER INFO FOR PERSONALIZATION ----
    const userInfo = await getUserById(user.userId)
    
    let dynamicSystemPrompt = SYSTEM_PROMPT
    
    // Add user personalization to system prompt
    if (userInfo) {
      let personalInfo = []
      if (userInfo.name) {
        personalInfo.push(`User's name: ${userInfo.name}`)
      }
      if (userInfo.age) {
        personalInfo.push(`User's age: ${userInfo.age}`)
      }
      
      if (personalInfo.length > 0) {
        dynamicSystemPrompt += `\n\n== USER PERSONALIZATION (IMPORTANT: REMEMBER THIS) ==
- ${personalInfo.join(' | ')}
- When user asks "what is my name" or "mera naam kya hai", respond with their name directly without asking again.
- When user asks about their age, respond with their age directly.
- Use their name naturally in conversations to make it more personal.
- NEVER ask for their name or age again if you already have this information.`
      }
    }
    
    if (userState) {
      const cityStr = userCity ? ` City: ${userCity},` : ''
      dynamicSystemPrompt += `\n\n== USER LOCATION & NATIVE LANGUAGE RULE ==
- The user is from${cityStr} State: ${userState}.
- By default, if the user speaks English/Hindi, you can still switch to their regional script if it fits perfectly, otherwise keep it natively grounded in their requested script but with the friendly desi voice.
- Use your multilingual superpower to relate to their region (e.g. Marathi for Maharashtra, Punjabi for Punjab).
- Keep the response short (1-4 sentences) and highly energetic/friendly.`
    }

    const detectedLang = detectLanguage(message)

    // ---- GET OR CREATE CONVERSATION ----
    let conversationId = existingConvId
    let isNewConversation = false
    if (!conversationId) {
      conversationId = await createConversation(user.userId, message)
      isNewConversation = true
    } else {
      const conversation = await getConversationForUser(conversationId, user.userId)
      if (!conversation) {
        return Response.json({ error: 'Conversation not found' }, { status: 404 })
      }
    }

    // ---- SAVE USER MESSAGE TO DB ----
    await saveMessage(conversationId, 'user', message, detectedLang)

    // ---- ASYNC : GENERATE SMART AI TITLE (only for 1st message) ----
    if (isNewConversation) {
      // We don't 'await' this so the main chat response remains lightning fast
      (async () => {
        try {
          const groq = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' })
          const titleGen = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
              { role: 'system', content: 'You are a professional title generator. Summarize the user message in EXACTLY 2 to 4 words. Use the same language as the user. No punctuation, no quotes. Just the title.' },
              { role: 'user', content: message }
            ],
            max_tokens: 10,
            temperature: 0.3,
          })
          const title = titleGen.choices[0]?.message?.content?.trim()
          if (title) {
            await updateConversationTitle(conversationId, title)
          }
        } catch (titleError: any) {
          console.warn('[AI-Title] Generation failed:', titleError?.message || titleError)
          
          // Fallback: Simple title based on message
          try {
            const fallbackTitle = message.split(' ').slice(0, 3).join(' ').substring(0, 20)
            await updateConversationTitle(conversationId, fallbackTitle)
            console.log('[AI-Title] Using fallback title:', fallbackTitle)
          } catch (fallbackError) {
            console.warn('[AI-Title] Fallback also failed:', fallbackError)
          }
        }
      })()
    }

    // ---- LOAD CONVERSATION HISTORY ----
    const history = await getConversationMessages(conversationId)

    // Build messages array from history (last 10 for context)
    const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = history
      .slice(-10, -1)
      .map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

    // ---- STREAM RESPONSE USING MULTI-AI SYSTEM ----
    const encoder = new TextEncoder()
    let fullResponse = ''

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversationId to frontend first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ conversationId })}\n\n`))

          // Use AI Manager to get response from available providers
          const { stream, provider } = await aiManager.getResponse(historyMessages, dynamicSystemPrompt)
          console.log(`[AI] Using provider: ${provider}`)

          // Stream the response based on provider type
          if (provider === 'Gemini') {
            // Gemini streaming
            for await (const chunk of stream) {
              const text = chunk.text() || ''
              if (text) {
                fullResponse += text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`)
                )
              }
            }
          } else if (provider === 'Simple') {
            // Simple provider - send all at once
            const reader = stream.getReader()
            const { value, done } = await reader.read()
            if (value) {
              const text = new TextDecoder().decode(value)
              fullResponse += text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`)
              )
            }
          } else {
            // Groq, OpenAI, Anthropic - standard streaming
            for await (const chunk of stream) {
              const content = chunk.choices?.[0]?.delta?.content || chunk.content || ''
              if (content) {
                fullResponse += content
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta: { text: content } })}\n\n`)
                )
              }
            }
          }

          // Save assistant message to database
          await saveMessage(conversationId, 'assistant', fullResponse, detectedLang)

          // Generate TTS audio automatically
          try {
            console.log('[TTS] Generating audio for response...')
            const { EdgeTTS } = await import('edge-tts-universal')
            
            // Detect language for TTS
            const isHindi = /[\u0900-\u097F]/.test(fullResponse)
            const voice = isHindi ? 'hi-IN-MadhurNeural' : 'en-IN-PrabhatNeural'
            
            // Generate audio
            const tts = new EdgeTTS(fullResponse, voice, {
              rate: '+5%',
              pitch: '+10Hz',
              volume: '+5%'
            })
            
            const result = await tts.synthesize()
            const arrayBuffer = await result.audio.arrayBuffer()
            const audioData = new Uint8Array(arrayBuffer)
            
            if (audioData && audioData.length > 0) {
              // Convert to base64 for sending to frontend
              const base64Audio = Buffer.from(audioData).toString('base64')
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  audio: `data:audio/mpeg;base64,${base64Audio}`,
                  voice: voice 
                })}\n\n`)
              )
              console.log('[TTS] ✅ Audio generated successfully')
            } else {
              console.log('[TTS] No audio generated, using fallback')
            }
          } catch (ttsError: any) {
            console.warn('[TTS] Audio generation failed:', ttsError?.message || ttsError)
          }

          // Send final message
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()

        } catch (error: any) {
          console.error('[AI] Streaming error:', error)
          const userError = '❌ API quota khatam ho gayi. Please check console.groq.com'
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: userError })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Chat route error:', error)
    return Response.json({
      error: error?.message || 'Something went wrong. Please try again.'
    }, { status: 500 })
  }
}
