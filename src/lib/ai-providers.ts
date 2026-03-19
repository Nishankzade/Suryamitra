// src/lib/ai-providers.ts - Multi-AI Provider System with Fallbacks

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIProvider {
  name: string
  isAvailable: boolean
  streamResponse: (messages: any[], systemPrompt: string) => Promise<ReadableStream<any>>
}

// Groq Provider
export class GroqProvider implements AIProvider {
  name = 'Groq'
  isAvailable: boolean

  constructor(private apiKey: string) {
    this.isAvailable = !!apiKey && apiKey !== 'your_groq_api_key_here'
  }

  async streamResponse(messages: any[], systemPrompt: string) {
    if (!this.isAvailable) throw new Error('Groq API key not configured')
    
    const groq = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 256,
      temperature: 0.75,
    })

    return stream as any
  }
}

// Anthropic Claude Provider
export class AnthropicProvider implements AIProvider {
  name = 'Anthropic'
  isAvailable: boolean

  constructor(private apiKey: string) {
    this.isAvailable = !!apiKey && apiKey !== 'your_anthropic_api_key_here'
  }

  async streamResponse(messages: any[], systemPrompt: string) {
    if (!this.isAvailable) throw new Error('Anthropic API key not configured')
    
    const anthropic = new Anthropic({
      apiKey: this.apiKey,
    })

    // Convert OpenAI format to Anthropic format
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: msg.content
    }))

    const stream = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 256,
      temperature: 0.75,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    })

    return stream as any
  }
}

// Gemini Provider
export class GeminiProvider implements AIProvider {
  name = 'Gemini'
  isAvailable: boolean

  constructor(private apiKey: string) {
    this.isAvailable = !!apiKey && apiKey !== 'your_gemini_api_key_here'
  }

  async streamResponse(messages: any[], systemPrompt: string) {
    if (!this.isAvailable) throw new Error('Gemini API key not configured')
    
    const genAI = new GoogleGenerativeAI(this.apiKey)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt
    })
    
    // Convert to Gemini format
    const geminiHistory = messages.slice(0, -1).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content) }]
    }))
    
    const lastMessage = messages[messages.length - 1]
    const chat = model.startChat({ history: geminiHistory })
    const result = await chat.sendMessageStream([{text: lastMessage.content}])
    
    return result.stream as any
  }
}

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  name = 'OpenAI'
  isAvailable: boolean

  constructor(private apiKey: string) {
    this.isAvailable = !!apiKey && apiKey !== 'your_openai_api_key_here'
  }

  async streamResponse(messages: any[], systemPrompt: string) {
    if (!this.isAvailable) throw new Error('OpenAI API key not configured')
    
    const openai = new OpenAI({ apiKey: this.apiKey })

    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
      max_tokens: 256,
      temperature: 0.75,
    })

    return stream as any
  }
}

// Simple Fallback Provider
export class SimpleProvider implements AIProvider {
  name = 'Simple'
  isAvailable = true

  async streamResponse(messages: any[], systemPrompt: string) {
    // Get the last user message
    const lastMessage = messages[messages.length - 1]?.content || ''
    
    // Generate contextual responses based on common questions
    let response = ''
    
    if (lastMessage.toLowerCase().includes('solar') || lastMessage.toLowerCase().includes('सौर')) {
      response = "मैं आपकी सूर्जा मित्रा हूँ! सौर ऊर्जा के बारे में जानकारी देना मेरा काम है। आप क्या जानना चाहते हैं - सौर पैनल, सरकारी योजनाएं, या लागत? मैं आपकी मदद करूँगी! ☀️"
    } else if (lastMessage.toLowerCase().includes('what is my name') || lastMessage.toLowerCase().includes('mera naam')) {
      response = "मैं आपका नाम अभी बता नहीं सकती, क्योंकि मेरे AI कनेक्शन में समस्या है। लेकिन मैं आपकी सूर्जा मित्रा हूँ और आपकी मदद के लिए तैयार हूँ! 🌞"
    } else if (lastMessage.toLowerCase().includes('help') || lastMessage.toLowerCase().includes('मदद')) {
      response = "वाह भाई! मैं आपकी सूर्जा मित्रा हूँ और मैं आपकी मदद करने के लिए यहाँ हूँ! मैं आपको सौर ऊर्जा, सरकारी योजनाएं, और रिन्यूएबल एनर्जी के बारे में जानकारी दे सकती हूँ। क्या जानना चाहते हैं? 🌻"
    } else if (lastMessage.toLowerCase().includes('scheme') || lastMessage.toLowerCase().includes('योजना')) {
      response = "सौर ऊर्जा योजनाओं के बारे में बात करते हुए खुशी हो रही हूँ! केंद्र सरकार की PM Surya Ghar Yojana में 300 यूनिट तक बिजली बिल माफ़ है, और राज्य सरकारों की भी कई योजनाएं हैं। आप किस राज्य से हैं भाई? 🏠"
    } else if (lastMessage.toLowerCase().includes('cost') || lastMessage.toLowerCase().includes('लागत') || lastMessage.toLowerCase().includes('price')) {
      response = "सौर पैनल की लागत आजकल काफी कम हो गई है भाई! 1kW सिस्टम लगभग ₹50,000-70,000 में आता है, और सरकारी सब्सिडी मिलने पर और भी कम! आप कितने kW का सिस्टम चाहते हैं? 💰"
    } else {
      // Default helpful responses
      const defaultResponses = [
        "मैं आपकी सूर्जा मित्रा हूँ! सौर ऊर्जा के बारे में कुछ भी पूछिए - मैं बता दूँगी! 🌞",
        "वाह भाई! बहुत अच्छा सवाल है! मैं आपकी सूर्जा मित्रा के रूप में आपकी मदद करने के लिए तैयार हूँ। क्या जानना चाहते हैं? ☀️",
        "मैं सूर्जा मित्रा हूँ भाई! रिन्यूएबल एनर्जी और सौर ऊर्जा के बारे में जानकारी देना मेरा काम है। आप क्या पूछना चाहते हैं? 🌻",
        "Great! I'm SuryaMitra and I'm here to help you with solar energy solutions! What would you like to know? 🌞",
        "नमस्ते भाई! मैं आपकी सूर्जा मित्रा हूँ। सौर ऊर्जा, पैनल, बैटरी, या सरकारी योजनाओं के बारे में जानना चाहते हैं? 🏠"
      ]
      response = defaultResponses[Math.floor(Math.random() * defaultResponses.length)]
    }
    
    // Create a simple stream
    return new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode(response))
        controller.close()
      }
    })
  }
}

// Multi-AI Provider Manager
export class AIProviderManager {
  private providers: AIProvider[]

  constructor() {
    this.providers = [
      new GroqProvider(process.env.GROQ_API_KEY || ''),
      new GeminiProvider(process.env.GEMINI_API_KEY || ''),
      new SimpleProvider(), // Always available fallback
    ]
  }

  async getResponse(messages: any[], systemPrompt: string): Promise<{ stream: any, provider: string }> {
    const errors: string[] = []

    for (const provider of this.providers) {
      try {
        if (!provider.isAvailable) {
          console.warn(`[AI] ${provider.name} not available`)
          continue
        }

        console.log(`[AI] Trying ${provider.name}...`)
        const stream = await provider.streamResponse(messages, systemPrompt)
        console.log(`[AI] ✅ ${provider.name} successful`)
        return { stream, provider: provider.name }
      } catch (error: any) {
        const errorMsg = error?.message || error?.toString() || 'Unknown error'
        errors.push(`${provider.name}: ${errorMsg}`)
        console.warn(`[AI] ❌ ${provider.name} failed:`, errorMsg)
        continue
      }
    }

    // If all providers failed, this shouldn't happen because SimpleProvider always works
    console.error('[AI] All providers failed:', errors)
    throw new Error('All AI providers failed: ' + errors.join(', '))
  }

  getAvailableProviders(): string[] {
    return this.providers.filter(p => p.isAvailable).map(p => p.name)
  }
}

export const aiManager = new AIProviderManager()
