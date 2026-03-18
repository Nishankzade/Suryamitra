'use client'
// src/app/chat/page.tsx — SuryaMitra AI Chat with animated SVG mascot + Server TTS

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Message = { role: 'user' | 'assistant'; content: string; lang?: string }
type Conversation = { id: string; title: string; created_at: string; message_count: number }
type MascotState = 'idle' | 'listening' | 'thinking' | 'talking' | 'happy'

// ─── Voice Preferences (persisted in localStorage) ───────────────────────────
type VoicePrefs = {
  speed: number      // 0.75, 1, 1.25, 1.5
  volume: number     // 0 to 1
  autoSpeak: boolean  // speak responses automatically
  autoListen: boolean // auto-start mic after bot speaks
}
const DEFAULT_PREFS: VoicePrefs = { speed: 1, volume: 1, autoSpeak: true, autoListen: false }
function loadPrefs(): VoicePrefs {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem('suryamitra_voice') || '{}') } } catch { return DEFAULT_PREFS }
}
function savePrefs(p: VoicePrefs) { localStorage.setItem('suryamitra_voice', JSON.stringify(p)) }

// ─── Animated SVG Mascot ────────────────────────────────────────────────────
function SuryaMascot({ state }: { state: MascotState }) {
  const glowColor = {
    idle: 'rgba(255,184,0,0.25)',
    listening: 'rgba(0,200,255,0.35)',
    thinking: 'rgba(160,100,255,0.35)',
    talking: 'rgba(255,107,0,0.4)',
    happy: 'rgba(255,220,0,0.5)',
  }[state]

  const ringColor = {
    idle: '#FFB800',
    listening: '#00C8FF',
    thinking: '#A064FF',
    talking: '#FF6B00',
    happy: '#FFE000',
  }[state]

  // Eye shapes per state
  const eyeIdleL = 'M118 148 Q124 142 130 148 Q124 154 118 148'
  const eyeIdleR = 'M170 148 Q176 142 182 148 Q176 154 170 148'
  const eyeWideL = 'M116 148 Q124 138 132 148 Q124 158 116 148'
  const eyeWideR = 'M168 148 Q176 138 184 148 Q176 158 168 148'
  const eyeThinkL = 'M118 150 Q124 146 130 150 Q124 154 118 150'
  const eyeThinkR = 'M170 145 Q176 142 182 145 Q176 148 170 145'
  const eyeHappyL = 'M118 150 Q124 144 130 150'
  const eyeHappyR = 'M170 150 Q176 144 182 150'

  const eyeL = state === 'idle' || state === 'talking' ? eyeIdleL
    : state === 'listening' ? eyeWideL
      : state === 'thinking' ? eyeThinkL
        : eyeHappyL

  const eyeR = state === 'idle' || state === 'talking' ? eyeIdleR
    : state === 'listening' ? eyeWideR
      : state === 'thinking' ? eyeThinkR
        : eyeHappyR

  const eyeFill = state === 'happy' ? 'none' : '#1A0A00'
  const eyeStroke = state === 'happy' ? '#FF6B00' : 'none'

  // Mouth shapes per state
  const mouthIdle = 'M135 175 Q150 183 165 175'
  const mouthTalk = 'M133 175 Q150 190 167 175 Q150 182 133 175'
  const mouthSmile = 'M130 173 Q150 192 170 173'
  const mouthThink = 'M138 178 Q150 176 162 178'
  const mouthListen = 'M136 176 Q150 185 164 176'

  const mouthPath = state === 'talking' ? mouthTalk
    : state === 'happy' ? mouthSmile
      : state === 'thinking' ? mouthThink
        : state === 'listening' ? mouthListen
          : mouthIdle

  const animClass = {
    idle: 'mascot-idle',
    listening: 'mascot-listen',
    thinking: 'mascot-think',
    talking: 'mascot-talk',
    happy: 'mascot-happy',
  }[state]

  return (
    <div className={animClass} style={{ position: 'relative', width: '180px', height: '200px', margin: '0 auto' }}>
      {/* Futuristic holographic glow ring */}
      <div style={{
        position: 'absolute', inset: '-24px', borderRadius: '50%',
        background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, rgba(0,245,255,0.05) 30%, transparent 65%)`,
        animation: state === 'talking' ? 'glowPulse 0.35s ease-in-out infinite alternate'
          : state === 'listening' ? 'glowPulse 0.6s ease-in-out infinite alternate'
            : state === 'happy' ? 'holographicRing 1.2s ease-in-out infinite'
              : 'glowPulse 2.5s ease-in-out infinite alternate',
        zIndex: 0,
      }} />
      {/* Secondary neon ring */}
      <div style={{
        position: 'absolute', inset: '-12px', borderRadius: '50%',
        border: `2px solid ${state === 'listening' ? 'rgba(0,245,255,0.4)' : state === 'thinking' ? 'rgba(160,100,255,0.4)' : 'rgba(255,184,0,0.25)'}`,
        animation: state === 'listening' ? 'holographicRing 0.8s ease-in-out infinite' : 'holographicRing 3s ease-in-out infinite',
        zIndex: 0,
      }} />

      <svg viewBox="60 60 180 210" width="180" height="200" style={{ position: 'relative', zIndex: 1, filter: `drop-shadow(0 0 22px ${glowColor}) drop-shadow(0 0 8px rgba(255,255,255,0.15))` }}>
        <defs>
          <radialGradient id="faceGrad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="60%" stopColor="#FFB800" />
            <stop offset="100%" stopColor="#FF8C00" />
          </radialGradient>
          <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Futuristic sun rays — dynamic rotation speed per state */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
          const rad = (angle * Math.PI) / 180
          const inner = 72, outer = 92
          const x1 = 150 + inner * Math.cos(rad), y1 = 155 + inner * Math.sin(rad)
          const x2 = 150 + outer * Math.cos(rad), y2 = 155 + outer * Math.sin(rad)
          const rayDuration = state === 'happy' ? '1.5s' : state === 'listening' ? '4s' : state === 'talking' ? '3s' : '10s'
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={ringColor} strokeWidth={i % 2 === 0 ? 5 : 3}
              strokeLinecap="round"
              opacity={state === 'happy' ? 1 : state === 'talking' ? 0.9 : 0.75}
              style={{ transformOrigin: '150px 155px', animation: `rayRotate ${rayDuration} linear infinite` }}
            />
          )
        })}

        {/* Face circle */}
        <circle cx="150" cy="155" r="68" fill="url(#faceGrad)" />
        <circle cx="150" cy="155" r="68" fill="none" stroke={ringColor} strokeWidth="2.5" opacity="0.6" />

        {/* Cheeks */}
        <ellipse cx="112" cy="172" rx="16" ry="10" fill="url(#cheekGrad)" />
        <ellipse cx="188" cy="172" rx="16" ry="10" fill="url(#cheekGrad)" />

        {/* Eyes */}
        <path d={eyeL} fill={eyeFill} stroke={eyeStroke} strokeWidth={eyeStroke ? 3 : 0} strokeLinecap="round" />
        <path d={eyeR} fill={eyeFill} stroke={eyeStroke} strokeWidth={eyeStroke ? 3 : 0} strokeLinecap="round" />

        {/* Eye shine */}
        {state !== 'happy' && (
          <>
            <circle cx="122" cy="145" r="3" fill="white" opacity="0.8" />
            <circle cx="174" cy="145" r="3" fill="white" opacity="0.8" />
          </>
        )}
        {state === 'happy' && (
          <>
            <circle cx="122" cy="143" r="4" fill="#FFE000" opacity="0.9" />
            <circle cx="178" cy="143" r="4" fill="#FFE000" opacity="0.9" />
          </>
        )}

        {/* Thinking eyebrow */}
        {state === 'thinking' && (
          <>
            <path d="M118 138 Q124 133 130 136" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M168 133 Q176 130 184 135" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Mouth */}
        <path d={mouthPath} stroke="#8B4513" strokeWidth="3.5" fill={state === 'talking' ? 'rgba(100,40,0,0.5)' : 'none'} strokeLinecap="round" strokeLinejoin="round" />

        {/* Teeth when talking */}
        {state === 'talking' && (
          <ellipse cx="150" cy="180" rx="10" ry="4" fill="white" opacity="0.9" />
        )}

        {/* Happy sparkles */}
        {state === 'happy' && (
          <>
            <text x="95" y="120" fontSize="16" style={{ animation: 'sparkle 0.6s ease-in-out infinite alternate' }}>✨</text>
            <text x="195" y="125" fontSize="14" style={{ animation: 'sparkle 0.6s ease-in-out 0.3s infinite alternate' }}>⭐</text>
            <text x="90" y="200" fontSize="12" style={{ animation: 'sparkle 0.8s ease-in-out 0.15s infinite alternate' }}>✨</text>
          </>
        )}

        {/* Listening indicator */}
        {state === 'listening' && (
          <>
            {[1, 2, 3].map((r, i) => (
              <circle key={i} cx="150" cy="155" r={r * 24} fill="none"
                stroke="#00C8FF" strokeWidth="1.5" opacity={0.4 - i * 0.1}
                style={{ animation: `sonar ${1 + i * 0.3}s ease-out infinite`, animationDelay: `${i * 0.3}s` }}
              />
            ))}
          </>
        )}

        {/* Thinking dots */}
        {state === 'thinking' && (
          <>
            <circle cx="195" cy="100" r="5" fill="#A064FF" style={{ animation: 'thinkDot 1s ease-in-out infinite' }} />
            <circle cx="205" cy="90" r="7" fill="#A064FF" style={{ animation: 'thinkDot 1s ease-in-out 0.3s infinite' }} />
            <circle cx="218" cy="80" r="9" fill="#A064FF" style={{ animation: 'thinkDot 1s ease-in-out 0.6s infinite' }} />
          </>
        )}
      </svg>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mascotState, setMascotState] = useState<MascotState>('idle')
  const [mascotStatus, setMascotStatus] = useState('Ready to help! 🌞')
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)          // FIX: guard against double-taps
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'unknown'>('unknown')  // FIX: track explicit permission state
  const [sttMode, setSttMode] = useState<'browser' | 'whisper'>('whisper')  // Prefer record -> transcribe flow by default
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [langLabel, setLangLabel] = useState('🌐 Auto')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef(0)
  const speechDetectedRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const monitorFrameRef = useRef<number | null>(null)
  const isMutedRef = useRef(false)
  // Controls continuous-mode auto-restart — set false to cleanly stop listening
  const isListeningRef = useRef(false)
  const [browserWarning, setBrowserWarning] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [showUserInfoModal, setShowUserInfoModal] = useState(false)
  const [modalName, setModalName] = useState('')
  const [modalAge, setModalAge] = useState('')

  // ── Audio / Voice state ───────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [voicePrefs, setVoicePrefs] = useState<VoicePrefs>(DEFAULT_PREFS)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [lastSpokenText, setLastSpokenText] = useState('')
  const [lastSpokenLang, setLastSpokenLang] = useState('en')
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [showLocationSettings, setShowLocationSettings] = useState(false)
  const [userState, setUserState] = useState('')
  const [userCity, setUserCity] = useState('')
  const voicePrefsRef = useRef(DEFAULT_PREFS)
  const finalTranscriptRef = useRef('')
  const isSendingRef = useRef(false)  // guard: prevent concurrent sends

  // Load prefs from localStorage on mount
  useEffect(() => {
    const p = loadPrefs()
    setVoicePrefs(p)
    voicePrefsRef.current = p

    const savedState = localStorage.getItem('suryamitra_state')
    const savedCity = localStorage.getItem('suryamitra_city')
    if (savedState) setUserState(savedState)
    if (savedCity) setUserCity(savedCity)

    if (typeof window !== 'undefined') {
      const shown = sessionStorage.getItem('userInfoModalShown')
      if (!shown) {
        setShowUserInfoModal(true)
      }
    }
  }, [])

  // Sync prefs ref + persist
  function updatePrefs(patch: Partial<VoicePrefs>) {
    setVoicePrefs(prev => {
      const next = { ...prev, ...patch }
      voicePrefsRef.current = next
      savePrefs(next)
      return next
    })
  }

  // Keep muted ref in sync so speak() doesn't use stale closure
  useEffect(() => { isMutedRef.current = isMuted }, [isMuted])

  // Responsive layout: collapse sidebar on mobile, overlay when opened
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 900px)')
    const sync = () => {
      const mobile = mq.matches
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    sync()
    mq.addEventListener?.('change', sync)
    return () => mq.removeEventListener?.('change', sync)
  }, [])

  // ── On mount: check browser support + inspect mic permission when possible ──
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Browser compatibility check
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent)
    const isEdge = /Edg/.test(navigator.userAgent)
    const hasSpeechAPI = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    if (!hasSpeechAPI) {
      setBrowserWarning('⚠️ Your browser does not support voice input. Please use Chrome or Edge for the best experience.')
    } else if (!isChrome && !isEdge) {
      setBrowserWarning('ℹ️ Voice input works best in Chrome or Edge. Some features may be limited in your current browser.')
    }
    // Use the Permissions API when available so the page doesn't grab the mic
    // before the user explicitly taps the microphone button.
    const permissionApi = (navigator as any).permissions
    if (permissionApi?.query) {
      permissionApi.query({ name: 'microphone' as PermissionName })
        .then((status: PermissionStatus) => {
          const syncState = () => {
            if (status.state === 'granted' || status.state === 'denied') {
              setMicPermission(status.state)
            } else {
              setMicPermission('unknown')
            }
          }
          syncState()
          status.onchange = syncState
        })
        .catch(() => {
          setMicPermission('unknown')
        })
    }
  }, [])

  // Auth check + load conversations + check user profile
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(async d => {
      if (!d.user) window.location.href = '/login'
      else {
        setUser(d.user)
        loadConversations()
        
        // Check if user has complete profile (name and age)
        try {
          const token = localStorage.getItem('token')
          if (token) {
            const profileRes = await fetch('/api/user/profile', {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (profileRes.ok) {
              const profileData = await profileRes.json()
              const user = profileData.user
              
              // If user doesn't have name or age, show the modal
              if (!user.name || !user.age) {
                const shown = sessionStorage.getItem('userInfoModalShown')
                if (!shown) {
                  setShowUserInfoModal(true)
                }
              } else {
                // Pre-fill modal with existing data if needed
                setModalName(user.name || '')
                setModalAge(user.age ? user.age.toString() : '')
              }
            }
          }
        } catch (error) {
          console.error('Error checking user profile:', error)
          // Fallback: show modal if we can't verify profile
          const shown = sessionStorage.getItem('userInfoModalShown')
          if (!shown) {
            setShowUserInfoModal(true)
          }
        }
      }
    }).catch(() => { window.location.href = '/login' })
  }, [])

  // Load conversation list for sidebar
  async function loadConversations() {
    try {
      const res = await fetch('/api/chat/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch { }
  }

  // Resume a past conversation
  async function resumeConversation(convId: string) {
    try {
      const res = await fetch(`/api/chat/messages/${convId}`)
      if (res.ok) {
        const data = await res.json()
        const loadedMessages: Message[] = (data.messages || []).map((m: any) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
          lang: m.detected_lang || 'en',
        }))
        setMessages(loadedMessages)
        setConversationId(convId)
        setMascotState('idle')
        setMascotStatus('Chat loaded! 📂')
        setTimeout(() => setMascotStatus('Ready to help! 🌞'), 2000)
      }
    } catch { }
  }

  // Start a new chat
  function newChat() {
    setMessages([])
    setConversationId(null)
    setMascotState('idle')
    setMascotStatus('Ready to help! 🌞')
    setLangLabel('🌐 Auto')
  }

  // Preset message from dashboard
  useEffect(() => {
    const first = sessionStorage.getItem('firstMessage')
    if (first) { sessionStorage.removeItem('firstMessage'); setTimeout(() => sendMessage(first), 400) }
  }, [user])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Language detection
  // Threshold raised to 0.25 to avoid English sentences with a single loan-word
  // (like "subsidy") being misclassified as Hinglish.
  function detectLang(text: string) {
    if (/[\u0A80-\u0AFF]/.test(text)) return { code: 'gu', label: 'ગુ Gujarati', tts: 'gu-IN' }
    if (/[\u0B80-\u0BFF]/.test(text)) return { code: 'ta', label: 'த Tamil', tts: 'ta-IN' }
    if (/[\u0980-\u09FF]/.test(text)) return { code: 'bn', label: 'ব Bengali', tts: 'bn-IN' }
    if (/[\u0C00-\u0C7F]/.test(text)) return { code: 'te', label: 'త Telugu', tts: 'te-IN' }
    if (/[\u0C80-\u0CFF]/.test(text)) return { code: 'kn', label: 'ಕ Kannada', tts: 'kn-IN' }
    if (/[\u0D00-\u0D7F]/.test(text)) return { code: 'ml', label: 'മ Malayalam', tts: 'ml-IN' }
    if (/[\u0A00-\u0A7F]/.test(text)) return { code: 'pa', label: 'ਪ Punjabi', tts: 'pa-IN' }
    
    // Devanagari translates to Marathi if in Maharashtra, else Hindi
    if (/[\u0900-\u097F]/.test(text)) {
      if (userState === 'Maharashtra') return { code: 'mr', label: 'म Marathi', tts: 'mr-IN' }
      return { code: 'hi', label: '🇮🇳 Hindi', tts: 'hi-IN' }
    }

    // Hinglish logic unchanged (checks for common Hindi words in latin script)
    const hindiWords = ['mujhe', 'kya', 'nahi', 'kaise', 'kitna', 'batao', 'yojana', 'milega', 'namaste', 'hoon', 'arre', 'aur', 'bhi', 'toh', 'hai']
    const words = text.toLowerCase().split(/\s+/)
    if (words.filter(w => hindiWords.includes(w)).length / words.length > 0.25)
      return { code: 'hi', label: '🇮🇳 Hinglish', tts: 'hi-IN' }
      
    return { code: 'en', label: '🇬🇧 English', tts: 'en-IN' }
  }

  // ── STREAMING TTS — speaks sentences as they arrive ─────────────────────
  const audioQueueRef = useRef<{ promise: Promise<string | null>; text: string }[]>([])
  const isPlayingQueueRef = useRef(false)
  const streamingAbortRef = useRef(false)

  // Fetch audio for a single sentence and return blob URL
  async function fetchAudioForSentence(sentence: string, langCode: string): Promise<string | null> {
    if (!sentence.trim() || isMutedRef.current) return null
    try {
      const lang = langCode.split('-')[0] || 'en'
      const speed = voicePrefsRef.current.speed
      const rateStr = speed === 1 ? '+0%' : speed > 1 ? `+${Math.round((speed - 1) * 100)}%` : `-${Math.round((1 - speed) * 100)}%`

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sentence, lang, rate: rateStr }),
      })
      if (!res.ok) return null
      const blob = await res.blob()
      return URL.createObjectURL(blob)
    } catch { return null }
  }

  // Play next audio in queue
  async function playNextInQueue() {
    if (streamingAbortRef.current || audioQueueRef.current.length === 0) {
      isPlayingQueueRef.current = false
      setIsPlaying(false); setIsPaused(false)
      setMascotState('idle'); setMascotStatus('Ready to help! \ud83c\udf1e')
      // Auto-listen if enabled and queue is done
      if (voicePrefsRef.current.autoListen && !isMutedRef.current) {
        setTimeout(() => toggleVoice(), 500)
      }
      return
    }

    isPlayingQueueRef.current = true
    const nextItem = audioQueueRef.current.shift()!
    const url = await nextItem.promise;

    if (!url || streamingAbortRef.current) {
      return playNextInQueue() // Skip if failed to fetch or aborted
    }

    const audio = new Audio(url)
    audio.volume = voicePrefsRef.current.volume
    audioRef.current = audio

    setIsPlaying(true); setIsPaused(false)
    setMascotState('talking'); setMascotStatus('Speaking... \ud83d\udd0a')

    audio.onplay = () => { setIsPlaying(true); setIsPaused(false); setMascotState('talking'); setMascotStatus('Speaking... \ud83d\udd0a') }
    audio.onpause = () => { setIsPaused(true); setMascotState('idle'); setMascotStatus('Paused \u23f8\ufe0f') }
    audio.onended = () => {
      URL.revokeObjectURL(url)
      playNextInQueue() // Play next sentence
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      playNextInQueue() // Skip on error, play next
    }
    audio.play().catch(() => playNextInQueue())
  }

  // Add a sentence promise to the queue and start playing if not already
  function queueSentencePromise(promise: Promise<string | null>, text: string) {
    audioQueueRef.current.push({ promise, text })
    if (!isPlayingQueueRef.current) {
      playNextInQueue()
    }
  }

  // Full speak (for replay — speaks entire text at once)
  async function speak(text: string, langCode: string) {
    if (isMutedRef.current || !text || typeof window === 'undefined') return
    stopAudio()
    setLastSpokenText(text); setLastSpokenLang(langCode)

    // Split into sentences and queue each
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]
    for (const sentence of sentences) {
      if (streamingAbortRef.current) break
      const trimmed = sentence.trim()
      if (!trimmed) continue
      // Start fetching concurrently and queue the promise immediately
      const promise = fetchAudioForSentence(trimmed, langCode)
      queueSentencePromise(promise, trimmed)
    }
  }

  function stopAudio() {
    streamingAbortRef.current = true
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    // Clear queue — revoke URLs when fetches complete
    audioQueueRef.current.forEach(item => {
      item.promise.then(url => { if (url) URL.revokeObjectURL(url) }).catch(() => {})
    })
    audioQueueRef.current = []
    isPlayingQueueRef.current = false
    setIsPlaying(false); setIsPaused(false)
    // Reset abort flag after a tick
    setTimeout(() => { streamingAbortRef.current = false }, 50)
  }

  function togglePauseResume() {
    if (!audioRef.current) return
    if (audioRef.current.paused) { audioRef.current.play() }
    else { audioRef.current.pause() }
  }

  async function replayLast() {
    if (lastSpokenText) await speak(lastSpokenText, lastSpokenLang)
  }

  function cleanupRecordingMonitor() {
    if (monitorFrameRef.current !== null) {
      cancelAnimationFrame(monitorFrameRef.current)
      monitorFrameRef.current = null
    }
    analyserRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => { })
      audioContextRef.current = null
    }
  }

  function setupRecordingMonitor(stream: MediaStream) {
    cleanupRecordingMonitor()
    speechDetectedRef.current = false

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return

    try {
      const audioContext = new AudioCtx()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.85

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser

      const data = new Uint8Array(analyser.fftSize)
      let consecutiveSilenceFrames = 0
      const framesForSilence = 60 * 2.5 // ~2.5 seconds at 60fps
      
      const detectSpeech = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteTimeDomainData(data)

        let sumSquares = 0
        for (let i = 0; i < data.length; i++) {
          const centered = (data[i] - 128) / 128
          sumSquares += centered * centered
        }

        const rms = Math.sqrt(sumSquares / data.length)
        if (rms > 0.035) {
          speechDetectedRef.current = true
          consecutiveSilenceFrames = 0
        } else if (speechDetectedRef.current) {
          // Only start counting silence after they've started talking
          consecutiveSilenceFrames++
        }

        if (consecutiveSilenceFrames > framesForSilence && isListeningRef.current) {
          console.log('[Voice] Auto-stopping Whisper STT after 2.5s of silence')
          isListeningRef.current = false
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop()
          }
          return
        }

        monitorFrameRef.current = requestAnimationFrame(detectSpeech)
      }

      detectSpeech()
    } catch (err) {
      console.warn('[Voice] Could not start audio monitor:', err)
    }
  }

  function isLikelyFakeSilenceTranscript(transcript: string) {
    const normalized = transcript.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    const knownHallucinations = new Set([
      'thank you',
      'thanks',
      'thankyou',
      'thanks for watching',
      'bye',
      'you',
    ])
    return knownHallucinations.has(normalized)
  }

  function submitVoiceTranscript(transcript: string) {
    const cleaned = transcript.trim()
    if (!cleaned) return

    setInput(cleaned)
    setMascotState('thinking')
    setMascotStatus('📝 Voice ko text mein badal diya — bhej raha hoon...')

    // Emergency reset in case it got stuck
    isSendingRef.current = false
    window.setTimeout(() => {
      sendMessage(cleaned)
    }, 150)
  }

  async function deleteConversation(id: string) {
    if (!confirm('Arre, kya aap sach mein yeh chat delete karna chahte hain?')) return
    try {
      const res = await fetch(`/api/chat/conversations/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setToastMsg('🗑️ Conversation deleted!')
      loadConversations()
      if (conversationId === id) newChat()
    } catch (err: any) {
      console.error('Delete error:', err)
      setToastMsg('❌ Failed to delete. Try again.')
    }
  }

  // ── SEND MESSAGE ─────────────────────────────────────────────────────────
  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    // Guard against concurrent sends (double-tap Enter or rapid button clicks)
    if (!text || loading || isSendingRef.current) return
    isSendingRef.current = true
    setInput('')
    const lang = detectLang(text)
    setLangLabel(lang.label)
    setMessages(prev => [...prev, { role: 'user', content: text, lang: lang.code }])
    setLoading(true)
    setMascotState('thinking')
    setMascotStatus('Soch raha hoon... 🤔')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId, userState, userCity }),
      })

      if (!res.ok) {
        let errMsg = `Error ${res.status}`
        try { const d = await res.json(); errMsg = d.error || errMsg } catch { }
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}`, lang: 'en' }])
        setMascotState('idle'); setMascotStatus('Ready to help! 🌞')
        setLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let spokenUpTo = 0  // Index up to which text has been sent to TTS
      setMessages(prev => [...prev, { role: 'assistant', content: '', lang: lang.code }])
      setMascotState('happy')
      setMascotStatus('Bata raha hoon... ✨')
      streamingAbortRef.current = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.conversationId) {
              setConversationId(parsed.conversationId)
              loadConversations() // refresh sidebar
            }
            if (parsed.error) full = `⚠️ ${parsed.error}`
            if (parsed.delta?.text) {
              full += parsed.delta.text
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = { role: 'assistant', content: full, lang: lang.code }
                return updated
              })
              // Use 'instant' inside the stream loop to avoid repeated smooth-scroll jank;
              // the final smooth scroll happens after the loop ends.
              bottomRef.current?.scrollIntoView({ behavior: 'instant' })

              // ── STREAMING TTS: detect completed sentences and speak them ──
              if (voicePrefsRef.current.autoSpeak && !isMutedRef.current) {
                const unspoken = full.slice(spokenUpTo)
                // Find the last sentence-ending punctuation
                const sentenceEndMatch = unspoken.match(/^([\s\S]*?[.!?।])\s/)
                if (sentenceEndMatch) {
                  const sentence = sentenceEndMatch[1].trim()
                  if (sentence.length > 5) { // Skip tiny fragments
                    spokenUpTo += sentenceEndMatch[0].length
                    // Queue the promise immediately to preserve exact sequence
                    const promise = fetchAudioForSentence(sentence, lang.tts)
                    queueSentencePromise(promise, sentence)
                  }
                }
              }
            }
          } catch { }
        }
      }

      // Speak any remaining unspoken text after stream ends
      if (voicePrefsRef.current.autoSpeak && !isMutedRef.current && spokenUpTo < full.length) {
        const remaining = full.slice(spokenUpTo).trim()
        if (remaining.length > 3) {
          // Queue final sentence promise
          const promise = fetchAudioForSentence(remaining, lang.tts)
          queueSentencePromise(promise, remaining)
        }
      }

      const finalText = full || '\ud83d\ude14 Kuch dikkat aayi. Dobara try karein please!'
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: finalText, lang: lang.code }
        return updated
      })
      setLoading(false)
      isSendingRef.current = false
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setLastSpokenText(finalText)
      setLastSpokenLang(lang.tts)

      // If we didn't stream-speak (muted or autoSpeak off), reset mascot
      if (!voicePrefsRef.current.autoSpeak || isMutedRef.current) {
        setMascotState('idle')
        setMascotStatus('Ready to help! \ud83c\udf1e')
      }

    } catch (err: any) {
      console.error('Chat error:', err)
      const errMsg = `⚠️ Network error: ${err?.message || 'Check your connection.'}`
      setMessages(prev => {
        const updated = [...prev]
        if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
          updated[updated.length - 1] = { role: 'assistant', content: errMsg, lang: 'en' }
          return updated
        }
        return [...updated, { role: 'assistant', content: errMsg, lang: 'en' }]
      })
      setMascotState('idle')
      setMascotStatus('Ready to help! 🌞')
    } finally {
      setLoading(false)
      isSendingRef.current = false
    }
  }

  // ── VOICE INPUT — Hybrid: Browser SpeechRecognition + Whisper fallback ─────
  const voiceRetryCountRef = useRef(0)

  // ── Helper: pick BCP-47 lang code from current langLabel ─────────────────
  function getSTTLang(): string {
    if (langLabel.includes('Hindi') || langLabel.includes('Hinglish')) return 'hi-IN'
    if (langLabel.includes('Gujarati')) return 'gu-IN'
    if (langLabel.includes('Tamil')) return 'ta-IN'
    return 'en-IN'
  }

  // ── BROWSER STT PATH (Chrome / Edge) ─────────────────────────────────────
  // Uses continuous=true so recognition never stops mid-sentence.
  // isListeningRef controls whether onend auto-restarts (toggle logic).
  function scheduleRecognitionRestart(delay = 350, langOverride?: string) {
    if (!isListeningRef.current) return

    window.setTimeout(() => {
      if (!isListeningRef.current || recognitionRef.current) return
      startRecognition(langOverride)
    }, delay)
  }

  function startRecognition(langOverride?: string) {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setMascotState('idle')
      setMascotStatus('⚠️ Is browser mein voice support nahi — Chrome/Edge use karein')
      setBrowserWarning('⚠️ Your browser does not support voice input. Please use Chrome or Edge.')
      setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)
      return
    }

    // Never start if already running — guard against double-tap
    if (recognitionRef.current) {
      console.warn('[Voice] Recognition already active, ignoring start call')
      return
    }

    const r = new SpeechRecognition()
    r.lang = langOverride || getSTTLang()
    r.continuous = true         // Keep listening — don't stop after one word/pause
    r.interimResults = true     // Show words live as user speaks
    r.maxAlternatives = 1       // Only need the best result

    r.onstart = () => {
      console.log('[Voice] Mic started — continuous mode, lang:', r.lang)
      voiceRetryCountRef.current = 0
      setIsRecording(true)
      setSttMode('browser')
      setMascotState('listening')
      setMascotStatus('Sun raha hoon... 🎤 (bolein, phir ruko — auto-send hoga)')
    }

    r.onresult = (e: any) => {
      let interimTranscript = ''
      let newFinal = ''

      // Only process results since the last event (avoids double-counting)
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          newFinal += transcript + ' '
        } else {
          interimTranscript += transcript
        }
      }

      if (newFinal) {
        finalTranscriptRef.current += newFinal
      }

      // Live feedback: show combined final + current interim in the input box
      setInput((finalTranscriptRef.current + interimTranscript).trim())

      // Auto-send on silence (1 second)
      if ((window as any)._voiceSilenceTimeout) {
        clearTimeout((window as any)._voiceSilenceTimeout)
      }
      (window as any)._voiceSilenceTimeout = setTimeout(() => {
        const currentText = (finalTranscriptRef.current + interimTranscript).trim()
        if (currentText && isListeningRef.current) {
          console.log('[Voice] Auto-sending after 1s of silence')
          isListeningRef.current = false // Stop the loop
          
          if (recognitionRef.current) {
            try { recognitionRef.current.stop() } catch {}
            recognitionRef.current = null
          }
          
          setIsRecording(false)
          setMascotState('thinking')
          setMascotStatus('Samajh raha hoon... 🤔')
          sendMessage(currentText)
          finalTranscriptRef.current = ''
        }
      }, 1000)
    }

    r.onend = () => {
      console.log('[Voice] onend — isListeningRef:', isListeningRef.current)
      const shouldKeepListening = isListeningRef.current
      const textSoFar = finalTranscriptRef.current.trim()
      recognitionRef.current = null
      setIsRecording(false)

      if (shouldKeepListening) {
        // User hasn't pressed stop — auto-restart to handle the ~60s browser timeout
        // and "no-speech" pauses without dropping the session
        if (textSoFar) {
          // We have a final result — send it, then restart for next utterance
          finalTranscriptRef.current = ''
          setInput('')
          setMascotState('thinking')
          setMascotStatus('Samajh raha hoon... 🤔')
          sendMessage(textSoFar)
          scheduleRecognitionRestart(700)
        } else {
          // No speech yet — restart immediately to catch the next attempt
          setMascotState('listening')
          setMascotStatus('🎤 Waiting for speech...')
          scheduleRecognitionRestart(250)
        }
      } else {
        // User pressed stop — finalize and clean up
        const toSend = textSoFar
        if (toSend) {
          finalTranscriptRef.current = ''
          setInput('')
          setMascotState('thinking')
          setMascotStatus('Samajh raha hoon... 🤔')
          sendMessage(toSend)
        } else {
          finalTranscriptRef.current = ''
          setMascotState('idle')
          setMascotStatus('Ready to help! 🌞')
        }
      }
    }

    r.onerror = (e: any) => {
      console.error('[Voice] SpeechRecognition error:', e.error)

      if (e.error === 'not-allowed') {
        // Hard stop — user explicitly denied permission
        isListeningRef.current = false
        setMicPermission('denied')
        recognitionRef.current = null
        finalTranscriptRef.current = ''
        setIsRecording(false)
        setMascotState('idle')
        setMascotStatus('🚫 Mic blocked — browser settings mein allow karein')
        setToastMsg(
          '🚫 Microphone access blocked. Click the 🔒 lock in the address bar → Microphone → Allow, then refresh.'
        )

      } else if (e.error === 'no-speech') {
        // non-fatal — browser's built-in silence timeout fired.
        // onend will fire next and auto-restart if isListeningRef is still true.
        console.log('[Voice] no-speech — will auto-restart via onend')
        setMascotStatus('🎤 Waiting for speech...')

      } else if (e.error === 'network') {
        // Non-fatal if we have internet — usually a transient blip
        console.warn('[Voice] Network error during STT')
        setMascotStatus('⚠️ Network hiccup — retry ho rahi hai...')
        recognitionRef.current = null

      } else if (e.error === 'audio-capture') {
        isListeningRef.current = false
        recognitionRef.current = null
        finalTranscriptRef.current = ''
        setIsRecording(false)
        setMascotState('idle')
        setMascotStatus('🎙️ Mic nahi mila — kya mic connected hai?')
        setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)

      } else if (e.error === 'language-not-supported') {
        // Retry with en-US fallback
        console.warn('[Voice] Language not supported, retrying with en-US')
        recognitionRef.current = null
        setMascotStatus('🔄 Language fallback to English...')
        if (isListeningRef.current) {
          scheduleRecognitionRestart(300, 'en-US')
        }

      } else if (e.error === 'aborted') {
        // Triggered when we call r.stop() ourselves — not an error, ignore
        console.log('[Voice] Recognition aborted (user stopped)')

      } else {
        // Any other error — show to user but don't hard-stop
        setMascotStatus(`⚠️ Mic error: ${e.error} — dobara try karein`)
        setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)
      }
    }

    try {
      recognitionRef.current = r
      r.start()
      console.log('[Voice] Recognition started successfully')
    } catch (err: any) {
      console.error('[Voice] Failed to start recognition:', err)
      recognitionRef.current = null
      if (isListeningRef.current && voiceRetryCountRef.current < 2) {
        voiceRetryCountRef.current += 1
        setMascotState('listening')
        setMascotStatus('🔄 Mic reconnect kar raha hoon...')
        scheduleRecognitionRestart(400 * voiceRetryCountRef.current, langOverride)
      } else {
        isListeningRef.current = false
        finalTranscriptRef.current = ''
        setIsRecording(false)
        setMascotState('idle')
        setMascotStatus('⚠️ Mic start nahi hua — browser refresh karein')
        setTimeout(() => setMascotStatus('Ready to help! 🌞'), 3000)
      }
    }
  }



  // ── WHISPER FALLBACK PATH (Firefox / browsers without SpeechRecognition) ──
  function startWhisperRecording(stream: MediaStream) {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
          ? 'audio/ogg;codecs=opus'
          : 'audio/ogg'

    let mediaRecorder: MediaRecorder
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType })
    } catch {
      mediaRecorder = new MediaRecorder(stream)
    }

    audioChunksRef.current = []
    mediaRecorderRef.current = mediaRecorder
    recordingStartedAtRef.current = Date.now()
    setupRecordingMonitor(stream)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = async () => {
      cleanupRecordingMonitor()
      stream.getTracks().forEach(t => t.stop())
      setIsRecording(false)

      const chunks = audioChunksRef.current
      const durationMs = Date.now() - recordingStartedAtRef.current
      if (chunks.length === 0) {
        setMascotState('idle')
        setMascotStatus('😶 Koi audio nahi mili — dobara try karein')
        setTimeout(() => setMascotStatus('Ready to help! 🌞'), 3000)
        setIsProcessing(false)
        return
      }

      const blob = new Blob(chunks, { type: mediaRecorder.mimeType || mimeType })
      const likelySilence = !speechDetectedRef.current || durationMs < 700 || blob.size < 3500
      if (likelySilence) {
        setMascotState('idle')
        setMascotStatus('🎤 Awaaz clear nahi mili — thoda zor se bolkar dobara try karein')
        setTimeout(() => setMascotStatus('Ready to help! 🌞'), 3500)
        setIsProcessing(false)
        audioChunksRef.current = []
        return
      }

      setIsProcessing(true)
      setMascotState('thinking')
      setMascotStatus('⏳ Voice ko text mein badal raha hoon...')

      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const langCode = langLabel.includes('Hindi') || langLabel.includes('Hinglish') ? 'hi'
        : langLabel.includes('Gujarati') ? 'gu'
          : langLabel.includes('Tamil') ? 'ta'
            : 'auto'
      formData.append('lang', langCode)

      try {
        const res = await fetch('/api/stt', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok && data.transcript?.trim()) {
          const transcript = data.transcript.trim()
          if (!speechDetectedRef.current && isLikelyFakeSilenceTranscript(transcript)) {
            setMascotState('idle')
            setMascotStatus('🎤 Mujhe clear speech nahi mili — dobara try karein')
            setTimeout(() => setMascotStatus('Ready to help! 🌞'), 3500)
          } else {
            submitVoiceTranscript(transcript)
          }
        } else {
          const errMsg = data.error || 'Koi transcript nahi mili'
          setMascotState('idle')
          setMascotStatus(`😶 ${errMsg}`)
          setTimeout(() => setMascotStatus('Ready to help! 🌞'), 4000)
        }
      } catch (err: any) {
        console.error('[Voice] Whisper fetch error:', err)
        setMascotState('idle')
        setMascotStatus('⚠️ Whisper error — internet check karein')
        setTimeout(() => setMascotStatus('Ready to help! 🌞'), 4000)
      } finally {
        speechDetectedRef.current = false
        audioChunksRef.current = []
        setIsProcessing(false)
      }
    }

    mediaRecorder.start(250)
    setSttMode('whisper')
    setIsRecording(true)
    setMascotState('listening')
    setMascotStatus('🎤 Recording... boliye, phir mic dobara dabakar text bana dunga')
  }

  // ── TOGGLE VOICE — Main entry point ─────────────────────────────────────────
  function toggleVoice() {
    // Guard: don't allow new recording while Whisper is uploading
    if (isProcessing) {
      setMascotStatus('⏳ Processing... please wait')
      return
    }

    // ── STOP path ──────────────────────────────────────────────────────────
    if (isRecording || isListeningRef.current) {
      isListeningRef.current = false  // signal onend NOT to auto-restart

      if (sttMode === 'whisper') {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      } else {
        // SpeechRecognition: stop() triggers onend which will see isListeningRef=false
        if (recognitionRef.current) {
          try { recognitionRef.current.stop() } catch { }
          recognitionRef.current = null
        }
        setIsRecording(false)
        setMascotState('idle')
        setMascotStatus('Ready to help! 🌞')
      }
      return
    }

    // ── START path ──────────────────────────────────────────────────────────

    // HTTPS guard — getUserMedia silently fails on HTTP at non-localhost origins
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    if (window.location.protocol !== 'https:' && !isLocalhost) {
      setMascotState('idle')
      setMascotStatus('⚠️ Voice requires HTTPS — localhost par test karein ya HTTPS use karein')
      setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)
      return
    }

    // Stop any playing TTS audio first
    stopAudio()

    const hasSpeechAPI = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    const canRecordAudio = typeof MediaRecorder !== 'undefined'

    // Legacy browsers without getUserMedia
    if (!navigator.mediaDevices?.getUserMedia) {
      if (hasSpeechAPI) {
        isListeningRef.current = true
        startRecognition()
      } else {
        setBrowserWarning('⚠️ Voice input not supported in this browser. Please use Chrome or Edge.')
        setMascotState('idle')
        setMascotStatus('⚠️ Is browser mein voice support nahi — Chrome/Edge use karein')
        setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)
      }
      return
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        setMicPermission('granted')
        finalTranscriptRef.current = ''
        setInput('')

        if (canRecordAudio) {
          // Primary flow: record audio first, then transcribe it with Groq Whisper.
          startWhisperRecording(stream)
        } else if (hasSpeechAPI) {
          // Fallback for browsers that can listen live but cannot record.
          stream.getTracks().forEach(t => t.stop())
          isListeningRef.current = true
          startRecognition()
        } else {
          stream.getTracks().forEach(t => t.stop())
          setBrowserWarning('⚠️ Voice recording is not supported in this browser. Please use Chrome or Edge.')
          setMascotState('idle')
          setMascotStatus('⚠️ Is browser mein audio recording support nahi hai')
          setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)
        }
      })
      .catch((err: any) => {
        console.error('[Voice] getUserMedia error:', err)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicPermission('denied')
          setMascotState('idle')
          setMascotStatus('🚫 Mic access denied — browser settings mein allow karein')
          setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)
          setToastMsg(
            '🚫 Microphone access blocked. Click the 🔒 lock in the address bar → Microphone → Allow, then refresh.'
          )
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setMascotState('idle')
          setMascotStatus('🎙️ Koi microphone nahi mila — mic connect karein')
          setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)
        } else {
          setMascotState('idle')
          setMascotStatus(`⚠️ Mic error: ${err.name || err.message}`)
          setTimeout(() => setMascotStatus('Ready to help! 🌞'), 5000)
        }
      })
  }




  // Format AI message
  function formatMsg(text: string) {
    return text
      .replace(/\[LANG:[a-z-]+\]/g, '')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#FFB800">$1</strong>')
      .replace(/^#{1,3} (.+)$/gm, '<div style="font-weight:700;color:#FFB800;margin:8px 0 4px">$1</div>')
      .replace(/^[•\-\*] (.+)$/gm, '<div style="padding:2px 0 2px 18px;position:relative"><span style="position:absolute;left:0;color:#FF6B00">•</span>$1</div>')
      .replace(/\n{2,}/g, '<br><br>')
      .replace(/\n/g, '<br>')
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  // ── KEYBOARD SHORTCUTS ────────────────────────────────────────────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Escape → stop audio
      if (e.key === 'Escape') { stopAudio(); return }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Audio bars for talking
  const AudioBars = () => (
    <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '24px' }}>
      {[10, 18, 24, 16, 10, 20, 14].map((h, i) => (
        <span key={i} style={{
          width: '4px', height: `${h}px`,
          background: `hsl(${30 + i * 10},100%,55%)`,
          borderRadius: '2px', display: 'block',
          animation: `barBounce 0.5s ease-in-out ${i * 0.07}s infinite alternate`
        }} />
      ))}
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--deep-sky)', overflow: 'hidden', position: 'relative' }}>

      {/* Background grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(255,184,0,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,184,0,0.02) 1px,transparent 1px)', backgroundSize: '50px 50px', zIndex: 0 }} />

      {/* ── USER INFO MODAL ────────────────────────────────────── */}
      <AnimatePresence>
        {showUserInfoModal && (
          <motion.div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '30px', width: '100%', maxWidth: '400px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(255,184,0,0.1)',
              textAlign: 'center'
            }}
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>👋</div>
              <h2 style={{ fontFamily: '"Baloo 2",cursive', fontSize: '24px', fontWeight: 800, color: 'var(--sun-yellow)', marginBottom: '8px' }}>
                Welcome to Surya Mittra!
              </h2>
              <p style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.5 }}>
                Ek choti si jankari batao phir jaldi se baatcheet shuru karte hain!
              </p>
              
              <form onSubmit={async e => {
                e.preventDefault()
                
                // Save to database
                try {
                  const token = localStorage.getItem('token')
                  if (token && (modalName || modalAge)) {
                    const response = await fetch('/api/user/profile', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        name: modalName || undefined,
                        age: modalAge ? parseInt(modalAge) : undefined
                      })
                    })
                    
                    if (response.ok) {
                      const data = await response.json()
                      setUser(data.user)
                      setToastMsg('✅ Profile saved successfully!')
                    } else {
                      console.error('Failed to save profile')
                      setToastMsg('❌ Failed to save profile')
                    }
                  }
                } catch (error) {
                  console.error('Error saving profile:', error)
                  setToastMsg('❌ Error saving profile')
                }
                
                sessionStorage.setItem('userInfoModalShown', 'true')
                setShowUserInfoModal(false)
                if (modalName) {
                  setUser((prev: any) => prev ? { ...prev, name: modalName } : { name: modalName })
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>Aapka Naam (Your Name)</label>
                  <input type="text" value={modalName} onChange={e => setModalName(e.target.value)} required placeholder="" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'Poppins,sans-serif' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px', fontWeight: 600 }}>Aapki Umar (Your Age)</label>
                  <input type="number" min="5" max="100" value={modalAge} onChange={e => setModalAge(e.target.value)} required placeholder="" style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface2)', color: 'white', fontSize: '14px', outline: 'none', fontFamily: 'Poppins,sans-serif' }} />
                </div>
                <button type="submit" style={{ marginTop: '10px', width: '100%', padding: '14px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,var(--sun-orange),var(--sun-yellow))', color: 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer', fontFamily: '"Baloo 2",cursive', boxShadow: '0 4px 15px rgba(255,107,0,0.3)', transition: 'transform 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseOut={e => (e.currentTarget.style.transform = 'scale(1)')}>
                  Chat Shuru Karein 🚀
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* TOPBAR */}
      <nav style={{
        position: 'relative', zIndex: 10, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px clamp(12px,3vw,24px)', background: 'rgba(10,22,40,0.95)',
        backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)',
        gap: '8px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg viewBox="60 60 180 180" width="34" height="34">
            <circle cx="150" cy="150" r="60" fill="#FFB800" />
            <circle cx="150" cy="150" r="60" fill="none" stroke="#FF8C00" strokeWidth="3" />
          </svg>
          <span style={{ fontFamily: '"Baloo 2",cursive', fontSize: '19px', fontWeight: 800, color: 'var(--sun-yellow)' }}>SuryaMitra AI</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--sun-yellow)', background: 'rgba(255,184,0,0.1)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '100px' }}>{langLabel}</span>
          <button
            onClick={() => updatePrefs({ autoListen: !voicePrefs.autoListen })}
            title="Auto-listen after bot speaks"
            aria-label={voicePrefs.autoListen ? 'Auto-listen enabled — click to disable' : 'Auto-listen disabled — click to enable'}
            style={{ background: voicePrefs.autoListen ? 'rgba(0,230,118,0.1)' : 'none', border: `1px solid ${voicePrefs.autoListen ? 'var(--green)' : 'var(--border)'}`, padding: '6px 14px', borderRadius: '8px', color: voicePrefs.autoListen ? 'var(--green)' : 'var(--muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s' }}>
            {voicePrefs.autoListen ? '🔄 Auto-Listen' : '🔄 Manual'}
          </button>
          <button
            onClick={() => { if (isMuted) stopAudio(); setIsMuted(!isMuted) }}
            aria-label={isMuted ? 'Voice muted — click to unmute' : 'Voice on — click to mute'}
            style={{ background: isMuted ? 'rgba(255,82,82,0.1)' : 'none', border: `1px solid ${isMuted ? '#FF5252' : 'var(--border)'}`, padding: '6px 14px', borderRadius: '8px', color: isMuted ? '#FF5252' : 'var(--muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s' }}>
            {isMuted ? '🔇 Muted' : '🔊 Voice On'}
          </button>
          <button onClick={() => setShowVoiceSettings(!showVoiceSettings)} title="Voice settings" aria-label="Voice settings" style={{ background: showVoiceSettings ? 'rgba(255,184,0,0.1)' : 'none', border: `1px solid ${showVoiceSettings ? 'var(--sun-yellow)' : 'var(--border)'}`, padding: '6px 10px', borderRadius: '8px', color: showVoiceSettings ? 'var(--sun-yellow)' : 'var(--muted)', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s' }}>⚙️</button>
          <button onClick={() => setShowLocationSettings(!showLocationSettings)} title="Location settings" aria-label="Location settings" style={{ background: showLocationSettings ? 'rgba(0,200,255,0.1)' : 'none', border: `1px solid ${showLocationSettings ? '#00C8FF' : 'var(--border)'}`, padding: '6px 10px', borderRadius: '8px', color: showLocationSettings ? '#00C8FF' : 'var(--muted)', cursor: 'pointer', fontSize: '15px', transition: 'all 0.2s', marginLeft: '4px' }}>📍</button>
          <button onClick={logout} aria-label="Log out" style={{ background: 'none', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '8px', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Poppins,sans-serif' }}>Logout</button>
        </div>
      </nav>

      {/* ── LOCATION SETTINGS PANEL ───────────────────────── */}
      {showLocationSettings && (
        <div style={{ position: 'relative', zIndex: 10, padding: '12px 24px', background: 'rgba(10,22,40,0.98)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', animation: 'slideUp 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>State</span>
            <select value={userState} onChange={e => {
              const val = e.target.value; 
              setUserState(val); 
              localStorage.setItem('suryamitra_state', val);
            }} style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--surface2)', color: 'white', border: '1px solid var(--border)', fontSize: '13px', outline: 'none' }}>
              <option value="">-- Select State --</option>
              {['Andhra Pradesh', 'Assam', 'Bihar', 'Delhi', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>City</span>
            <input type="text" placeholder="Enter City (Optional)" value={userCity} onChange={e => {
              const val = e.target.value;
              setUserCity(val);
              localStorage.setItem('suryamitra_city', val);
            }} style={{ padding: '6px 12px', borderRadius: '6px', background: 'var(--surface2)', color: 'white', border: '1px solid var(--border)', fontSize: '13px', width: '160px', outline: 'none' }} />
          </div>
          <button onClick={() => setShowLocationSettings(false)} style={{ padding: '6px 16px', borderRadius: '6px', background: '#00C8FF', color: 'black', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '13px', marginLeft: 'auto' }}>Done</button>
        </div>
      )}

      {/* ── VOICE SETTINGS PANEL ──────────────────────────── */}
      {showVoiceSettings && (
        <div style={{ position: 'relative', zIndex: 10, padding: '12px 24px', background: 'rgba(10,22,40,0.98)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap', animation: 'slideUp 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Speed</span>
            {[0.75, 1, 1.25, 1.5].map(s => (
              <button key={s} onClick={() => updatePrefs({ speed: s })} style={{ padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s', background: voicePrefs.speed === s ? 'var(--sun-orange)' : 'var(--surface2)', color: voicePrefs.speed === s ? 'white' : 'var(--muted)', border: voicePrefs.speed === s ? 'none' : '1px solid var(--border)' }}>
                {s}x
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>🔊</span>
            <input type="range" min="0" max="1" step="0.1" value={voicePrefs.volume} onChange={e => { const v = parseFloat(e.target.value); updatePrefs({ volume: v }); if (audioRef.current) audioRef.current.volume = v }} style={{ width: '80px', accentColor: 'var(--sun-orange)' }} />
            <span style={{ fontSize: '11px', color: 'var(--muted)', width: '30px' }}>{Math.round(voicePrefs.volume * 100)}%</span>
          </div>
          <button onClick={() => updatePrefs({ autoSpeak: !voicePrefs.autoSpeak })} style={{ padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s', background: voicePrefs.autoSpeak ? 'rgba(0,230,118,0.1)' : 'var(--surface2)', color: voicePrefs.autoSpeak ? 'var(--green)' : 'var(--muted)', border: `1px solid ${voicePrefs.autoSpeak ? 'var(--green)' : 'var(--border)'}` }}>
            {voicePrefs.autoSpeak ? '🔊 Auto-Speak On' : '🔇 Auto-Speak Off'}
          </button>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid rgba(255,184,0,0.2)', paddingTop: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--sun-yellow)', fontWeight: 600 }}>
              Made by Developers: HARSHAL TAPRE , MAYUR GHARJARE , NISHANK ZADE
            </span>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Esc to stop • Microsoft Neural Voice</span>
          </div>
        </div>
      )}

      {/* ── BROWSER COMPATIBILITY WARNING ────────────────── */}
      {browserWarning && (
        <div style={{
          position: 'relative', zIndex: 10, padding: '8px 20px',
          background: browserWarning.startsWith('⚠️') ? 'rgba(255,82,82,0.12)' : 'rgba(255,184,0,0.08)',
          borderBottom: `1px solid ${browserWarning.startsWith('⚠️') ? 'rgba(255,82,82,0.3)' : 'rgba(255,184,0,0.2)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          animation: 'slideUp 0.2s ease',
        }}>
          <span style={{ fontSize: '12px', color: browserWarning.startsWith('⚠️') ? '#FF5252' : 'var(--sun-yellow)', fontFamily: 'Poppins,sans-serif' }}>
            {browserWarning}
          </span>
          <button onClick={() => setBrowserWarning(null)}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '16px', padding: '0 4px', flexShrink: 0 }}>
            ✕
          </button>
        </div>
      )}


      {/* ── TOAST NOTIFICATION (Snackbar style) ────────────── */}
      <AnimatePresence>
      {toastMsg && (
        <motion.div style={{
          position: 'fixed', bottom: '100px', left: '50%',
          zIndex: 100, padding: '12px 24px',
          background: 'rgba(20,30,50,0.95)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,82,82,0.4)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '15px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px rgba(255,82,82,0.1)',
        }}
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 10, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
          <span style={{ fontSize: '14px', color: '#FF5252', fontFamily: 'Poppins,sans-serif', fontWeight: 500 }}>
            {toastMsg}
          </span>
          <button onClick={() => setToastMsg(null)} aria-label="Dismiss notification"
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
            ✕
          </button>
        </motion.div>
      )}
      </AnimatePresence>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', zIndex: 1 }}>

        {/* ── CONVERSATION SIDEBAR ──────────────────────────── */}
        <div style={{
          width: sidebarOpen ? '260px' : '0px', flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: sidebarOpen ? '1px solid var(--border)' : 'none',
          background: 'rgba(8,18,35,0.95)', overflow: 'hidden',
          transition: 'width 0.3s ease',
          ...(isMobile
            ? {
                position: 'absolute' as const,
                left: 0,
                top: 0,
                bottom: 0,
                zIndex: 30,
                borderRight: '1px solid var(--border)',
                boxShadow: sidebarOpen ? '20px 0 50px rgba(0,0,0,0.55)' : 'none',
              }
            : {}),
        }}>
          {/* Sidebar header */}
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: '"Baloo 2",cursive', fontSize: '15px', fontWeight: 700, color: 'var(--sun-yellow)' }}>💬 Chats</span>
            <button onClick={newChat}
              style={{
                background: 'linear-gradient(135deg,var(--sun-orange),var(--sun-yellow))',
                border: 'none', borderRadius: '8px', padding: '5px 12px',
                color: 'white', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s',
              }}>
              + New Chat
            </button>
          </div>

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {conversations.length === 0 && (
              <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--muted)', fontSize: '12px' }}>
                Koi purani chat nahi hai.<br />Naya chat shuru karein! 🌞
              </div>
            )}
            {conversations.map(conv => (
              <div key={conv.id} style={{ position: 'relative', marginBottom: '4px' }}>
                <button
                  onClick={() => resumeConversation(conv.id)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '10px 12px',
                    background: conversationId === conv.id ? 'rgba(255,184,0,0.1)' : 'transparent',
                    border: conversationId === conv.id ? '1px solid rgba(255,184,0,0.3)' : '1px solid transparent',
                    borderRadius: '10px', cursor: 'pointer',
                    transition: 'all 0.2s', fontFamily: 'Poppins,sans-serif',
                    paddingRight: '35px',
                  }}
                  onMouseOver={e => {
                    if (conversationId !== conv.id) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'
                        ; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                    }
                  }}
                  onMouseOut={e => {
                    if (conversationId !== conv.id) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent'
                        ; (e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                    }
                  }}>
                  <div style={{
                    fontSize: '13px', fontWeight: 500,
                    color: conversationId === conv.id ? 'var(--sun-yellow)' : 'var(--text)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    marginBottom: '3px',
                  }}>
                    {conv.title || 'New Chat'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                    <span>{new Date(conv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <span>{conv.message_count} msgs</span>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id) }}
                  title="Delete chat"
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'rgba(255,82,82,0.4)',
                    cursor: 'pointer', padding: '5px', fontSize: '14px', transition: 'color 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.color = '#FF5252'}
                  onMouseOut={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,82,82,0.4)'}>
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile backdrop to close sidebar */}
        {isMobile && sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 25,
              background: 'rgba(0,0,0,0.35)',
              border: 'none',
              cursor: 'pointer',
            }}
          />
        )}

        {/* Toggle sidebar button */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            left: isMobile ? '10px' : (sidebarOpen ? '248px' : '4px'),
            top: isMobile ? '88px' : '50%',
            transform: isMobile ? 'none' : 'translateY(-50%)',
            zIndex: 40,
            width: '24px', height: '48px', borderRadius: '0 8px 8px 0',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderLeft: 'none', cursor: 'pointer', color: 'var(--muted)',
            fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'left 0.3s ease, top 0.2s ease',
          }}>
          {sidebarOpen ? '◀' : '▶'}
        </button>

        {/* ── MASCOT PANEL ────────────────────────────────── */}
        <div className="chat-mascot-panel" style={{
          width: '270px', flexShrink: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '24px 16px',
          borderRight: '1px solid var(--border)', background: 'rgba(10,22,40,0.5)',
          position: 'relative', overflow: 'hidden', gap: '8px',
        }}>

          {/* Mascot SVG */}
          <SuryaMascot state={mascotState} />

          {/* Audio bars — visible when talking */}
          <div style={{ height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: mascotState === 'talking' ? 1 : 0, transition: 'opacity 0.3s' }}>
            <AudioBars />
          </div>

          {/* Name + status */}
          <div style={{ fontFamily: '"Baloo 2",cursive', fontSize: '20px', fontWeight: 800, color: 'var(--sun-yellow)', textShadow: '0 0 20px rgba(255,184,0,0.5)', marginTop: '2px' }}>SuryaMitra</div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              width: '7px', height: '7px', borderRadius: '50%', display: 'inline-block',
              background: mascotState === 'listening' ? '#00C8FF' : mascotState === 'talking' ? '#FF6B00' : mascotState === 'thinking' ? '#A064FF' : 'var(--green)',
              animation: 'pulseDot 2s infinite',
            }} />
            {mascotStatus}
          </div>

          {/* Quick chips */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 600, textAlign: 'center' }}>Quick Topics</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
              {[['☀️', 'Solar'], ['🌾', 'Kisan'], ['🏠', 'Awas'], ['🏥', 'Health'], ['💰', 'Loan'], ['⚡', 'Bijli']].map(([e, l]) => (
                <button key={l}
                  onClick={() => sendMessage(`${l} scheme ke baare mein details batao`)}
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', color: 'var(--text)', cursor: 'pointer', fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s' }}
                  onMouseOver={e => { (e.target as HTMLElement).style.borderColor = 'var(--sun-orange)'; (e.target as HTMLElement).style.color = 'var(--sun-orange)' }}
                  onMouseOut={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--text)' }}>
                  {e} {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CHAT AREA ───────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Welcome */}
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', padding: '40px', animation: 'fadeIn 0.5s ease' }}>
                <div style={{ fontSize: '52px', marginBottom: '14px', animation: 'float 3s ease-in-out infinite' }}>🌞</div>
                <h2 style={{ fontFamily: '"Baloo 2",cursive', fontSize: '26px', fontWeight: 800, color: 'var(--sun-yellow)', marginBottom: '10px' }}>
                  Namaste{user ? `, ${user.name}` : ''}! 🙏
                </h2>
                <p style={{ color: 'var(--muted)', maxWidth: '420px', lineHeight: 1.7, fontSize: '14px' }}>
                  Main SuryaMitra hoon — aapka solar energy aur government schemes ka AI friend!<br />
                  Type karein ya <strong style={{ color: 'var(--sun-yellow)' }}>🎤 mic</strong> dabayein
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginTop: '28px', width: '100%', maxWidth: '520px' }}>
                  {[
                    ['☀️', 'Solar Subsidy', 'PM Surya Ghar 3kW ke liye kitni subsidy milegi?'],
                    ['🌾', 'Kisan Schemes', 'Main UP ka kisan hoon, mujhe kaunsi yojana milegi?'],
                    ['🏠', 'Housing Loan', 'PM Awas Yojana mein apply kaise karein?'],
                    ['🏥', 'Ayushman Card', 'Ayushman Bharat card kaise banwayein?'],
                  ].map(([icon, title, q]) => (
                    <motion.button key={title} onClick={() => sendMessage(q as string)}
                      whileHover={{ y: -3, borderColor: 'var(--sun-orange)', boxShadow: '0 8px 20px rgba(255,107,0,0.15)' }}
                      whileTap={{ scale: 0.98 }}
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '14px', textAlign: 'left', cursor: 'pointer', fontFamily: 'Poppins,sans-serif' }}>
                      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
                      <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '4px', color: 'var(--sun-yellow)' }}>{title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.5 }}>{q}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <motion.div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}
                initial={{ opacity: 0, y: 12, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.role === 'user' ? 'var(--surface2)' : 'transparent', border: msg.role === 'user' ? '1px solid var(--border)' : 'none', fontSize: msg.role === 'user' ? '16px' : 'unset', overflow: 'hidden' }}>
                  {msg.role === 'user' ? '👤' : (
                    <svg viewBox="80 80 140 140" width="34" height="34">
                      <circle cx="150" cy="150" r="55" fill="#FFB800" />
                      <circle cx="134" cy="148" r="8" fill="#1A0A00" />
                      <circle cx="166" cy="148" r="8" fill="#1A0A00" />
                      <path d="M135 168 Q150 178 165 168" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <div style={{
                  maxWidth: '72%', padding: '13px 16px', borderRadius: '16px', fontSize: '14px', lineHeight: 1.7,
                  background: msg.role === 'user' ? 'linear-gradient(135deg,rgba(255,107,0,0.18),rgba(255,184,0,0.1))' : 'var(--surface)',
                  border: msg.role === 'user' ? '1px solid rgba(255,184,0,0.3)' : '1px solid var(--border)',
                  borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                  borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                  color: 'var(--text)',
                }} dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? formatMsg(msg.content) : msg.content }} />
              </motion.div>
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
            {loading && (
              <motion.div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <svg viewBox="80 80 140 140" width="34" height="34" style={{ flexShrink: 0 }}>
                  <circle cx="150" cy="150" r="55" fill="#FFB800" />
                  <circle cx="134" cy="148" r="7" fill="#1A0A00" />
                  <circle cx="166" cy="148" r="7" fill="#1A0A00" />
                  <path d="M135 168 Q150 176 165 168" stroke="#8B4513" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', borderTopLeftRadius: '4px', padding: '14px 18px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                  {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--sun-yellow)', display: 'block', animation: `typingDot 1.2s ${d}s infinite` }} />)}
                </div>
              </motion.div>
            )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* ── AUDIO CONTROLS BAR ─────────────────────────────── */}
          {(isPlaying || isPaused) && (
            <div style={{ padding: '8px 20px', borderTop: '1px solid var(--border)', background: 'rgba(255,107,0,0.05)', display: 'flex', gap: '8px', alignItems: 'center', animation: 'fadeIn 0.2s ease', flexShrink: 0 }}>
              <button onClick={togglePauseResume} title={isPaused ? 'Resume' : 'Pause'} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '14px', color: 'var(--text)', transition: 'all 0.2s' }}>
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
              </button>
              <button onClick={stopAudio} title="Stop" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', fontSize: '14px', color: 'var(--text)', transition: 'all 0.2s' }}>
                ⏹️ Stop
              </button>
              <span style={{ fontSize: '11px', color: 'var(--sun-orange)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sun-orange)', animation: 'pulseDot 1s infinite' }} />
                {isPaused ? 'Paused' : 'Speaking...'}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--muted)' }}>Esc to stop</span>
            </div>
          )}

          {/* ── REPLAY BUTTON (when audio finished) ────────────── */}
          {!isPlaying && !isPaused && lastSpokenText && (
            <div style={{ padding: '6px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <button onClick={replayLast} title="Replay last response" aria-label="Replay last AI response" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', color: 'var(--muted)', fontFamily: 'Poppins,sans-serif', transition: 'all 0.2s' }}
                onMouseOver={e => { (e.target as HTMLElement).style.borderColor = 'var(--sun-orange)'; (e.target as HTMLElement).style.color = 'var(--sun-orange)' }}
                onMouseOut={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; (e.target as HTMLElement).style.color = 'var(--muted)' }}>
                🔄 Replay Last Response
              </button>
            </div>
          )}

          {/* ── INPUT BAR ──────────────────────────────────────── */}
          <div style={{ padding: '14px 20px 18px', borderTop: '1px solid var(--border)', background: 'rgba(10,22,40,0.85)', backdropFilter: 'blur(20px)', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'var(--surface)', border: `1.5px solid ${isRecording ? 'var(--sun-orange)' : 'var(--border)'}`, borderRadius: '14px', padding: '10px 12px', transition: 'border-color 0.2s', boxShadow: isRecording ? '0 0 20px rgba(255,107,0,0.2)' : 'none' }}>
              <textarea
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder={isRecording ? '🎤 Listening... speak now!' : 'Koi bhi yojana ke baare mein poochein... (Hindi ya English)'}
                rows={1}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: '14px', fontFamily: 'Poppins,sans-serif', resize: 'none', maxHeight: '120px', lineHeight: 1.5, padding: '4px 0' }}
              />
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                {/* Mic button — FIX: disabled + spinner while Whisper is processing */}
                <button
                  onClick={toggleVoice}
                  disabled={isProcessing}
                  aria-label={
                    isProcessing ? 'Processing audio, please wait'
                      : isRecording
                        ? 'Stop voice recording'
                        : 'Start voice input'
                  }
                  title={
                    isProcessing ? 'Processing audio…'
                      : isRecording
                        ? `Stop recording (${sttMode === 'whisper' ? 'Whisper' : 'Browser'} mode)`
                        : 'Click to speak'
                  }
                  style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: isProcessing
                      ? 'rgba(160,100,255,0.2)'
                      : isRecording
                        ? 'linear-gradient(135deg,rgba(255,107,0,0.3),rgba(255,60,60,0.3))'
                        : 'var(--surface2)',
                    border: `1.5px solid ${isProcessing ? '#A064FF' : isRecording ? '#FF5252' : 'var(--border)'}`,
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: isRecording && !isProcessing ? 'pulse-glow 0.8s infinite' : 'none',
                    transition: 'all 0.2s',
                    opacity: isProcessing ? 0.7 : 1,
                  }}>
                  {isProcessing ? '⏳' : isRecording ? '⏹️' : '🎤'}
                </button>
                {/* Send button */}
                <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                  aria-label="Send message"
                  style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: (loading || !input.trim()) ? 'var(--surface2)' : 'linear-gradient(135deg,var(--sun-orange),var(--sun-yellow))',
                    border: 'none', cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                    color: 'white', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: (loading || !input.trim()) ? 'none' : '0 4px 14px rgba(255,107,0,0.4)',
                  }}>
                  ➤
                </button>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'center', marginTop: '8px' }}>
              Enter to send • Shift+Enter for new line • 🎤 voice input • Esc to stop voice • ⚙️ settings for speed/volume
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
