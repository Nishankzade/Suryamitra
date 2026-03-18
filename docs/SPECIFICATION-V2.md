# SuryaMitra — Complete Workflow & Feature Specification v2.0

> **Intelligent Solar Advisor** · Next.js 14 App Router · Groq LLM + Whisper · Edge TTS · Real-Time Voice Loop

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Authentication & Navigation Flow](#2-authentication--navigation-flow)
3. [Dashboard Experience](#3-dashboard-experience)
4. [Chatbot Text Workflow](#4-chatbot-text-workflow)
5. [Voice Features — TTS](#5-voice-features--text-to-speech-tts)
6. [Voice Features — STT](#6-voice-features--speech-to-text-stt)
7. [Real-Time Continuous Voice Loop](#7--real-time-continuous-voice-loop-new)
8. [Wake-Word Detection](#8--wake-word-detection-new)
9. [Mascot Animation Engine](#9-mascot-animation-engine)
10. [Smart Conversation Memory](#10--smart-conversation-memory-new)
11. [Predictive Input Suggestions](#11--predictive-input-suggestions-new)
12. [Emotion-Aware TTS](#12--emotion-aware-tts-new)
13. [Offline Cache Mode](#13--offline-cache-mode-new)
14. [Multi-modal Input](#14--multi-modal-input-image-upload-new)
15. [Solar Profile Personalisation](#15--solar-profile-personalisation-new)
16. [Page-Level Micro-Interactions](#16-page-level-micro-interactions)
17. [Error Handling & Edge Cases](#17-error-handling--edge-cases)
18. [Environment & Configuration](#18-environment--configuration)
19. [Known Limitations & Roadmap](#19-known-limitations--roadmap)

---

## 1. High-Level Architecture

### 1.1 Framework & Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 App Router — React Server + Client Components |
| **Database** | Neon PostgreSQL via `src/lib/db.ts` |
| **AI — LLM** | Groq `llama3-70b-8192` — token streaming via SSE |
| **AI — STT** | Groq Whisper `whisper-large-v3` |
| **AI — Vision** | Groq multi-modal (image input) |
| **Voice — TTS** | `edge-tts-universal` → Microsoft Azure Neural voices |
| **Auth** | JWT HS256, httpOnly cookies, bcrypt cost-12 |
| **Global State** | Zustand — voice state machine + mascot state |
| **Wake Word** | Picovoice Porcupine WASM (Web Worker) |
| **Offline** | Service Worker + Background Sync API |
| **UI Motion** | Framer Motion (declarative animations) |

### 1.2 Route Map

| Type | Route | Responsibility |
|------|-------|----------------|
| **Public** | `/`, `/login`, `/register` | Landing, auth entry points, token redirect |
| **Protected** | `/dashboard`, `/chat` | Middleware-guarded; JWT verified before page load |
| **API** | `/api/auth/*` | Login, register, me, logout |
| **API** | `/api/chat` | SSE streaming conversation endpoint |
| **API** | `/api/chat/conversations` | List all user conversations |
| **API** | `/api/chat/messages/:id` | Load a specific conversation |
| **API** | `/api/chat/suggestions` | Autocomplete suggestion chips |
| **API** | `/api/tts` | Edge TTS audio generation |
| **API** | `/api/stt` | Whisper transcription |

### 1.3 Architecture Diagram

```
User Browser
    |
    +---> / (root)          ---> verifyToken ---> /dashboard  OR  /login
    |
    +---> /login            ---> POST /api/auth/login   ---> Neon DB
    +---> /register         ---> POST /api/auth/register ---> Neon DB
    |
    +---> /dashboard        ---> GET /api/auth/me        ---> Neon DB
    |        |
    |        +---> navigate ---> /chat
    |
    +---> /chat
             +---> POST /api/chat   ---> Groq LLM stream ---> Neon DB
             +---> POST /api/tts    ---> edge-tts-universal ---> Audio blob
             +---> POST /api/stt    ---> Groq Whisper     ---> Transcript
```

---

## 2. Authentication & Navigation Flow

### 2.1 Entry Point `/`

Server component calls `verifyToken` against `suryamitra_token` cookie:

- **Valid token** → 307 redirect to `/dashboard`
- **Missing / expired / tampered** → 307 redirect to `/login`

This runs at the edge in `middleware.ts` before any React hydration — zero flash of unauthenticated content.

### 2.2 Registration `/register`

**Step 1 — Account Details**

- Full name, email, password (strength meter shown, min 8 chars)
- Phone number (optional; reserved for future SMS OTP)

**Step 2 — Solar Profile** (NEW)

- State / city (used for region-specific solar irradiance context)
- Roof type, approximate area (sqft), monthly electricity bill
- Existing solar system? If yes: capacity (kW), brand, age
- Preferred language for AI responses

**On submit → `POST /api/auth/register`:**

- Zod schema validation; returns 422 with field-level errors on failure
- bcrypt hash (cost 12) + single-transaction DB write (user + solar_profile)
- JWT HS256 signed; 7-day expiry; set as httpOnly + secure + sameSite=strict cookie
- Redirect to `/dashboard`

### 2.3 Login `/login`

- Email + password form → `POST /api/auth/login`
- Rate-limited: 5 attempts per 15 min per IP (NEW)
- On success: sets `suryamitra_token` cookie; redirect to `/dashboard`
- On failure: generic "Invalid credentials" (never reveals which field is wrong)

### 2.4 Middleware Guard

`src/middleware.ts` intercepts all `/dashboard/**` and `/chat/**` requests:

- **Valid token** → injects `x-user-id`, `x-user-email`, `x-user-name` headers; continues
- **Invalid token** → clears stale cookie; 307 redirect to `/login?next=<path>`
- After login, client reads `next` param and returns user to the original page

---

## 3. Dashboard Experience

### 3.1 On-Load Sequence

1. Middleware already verified token server-side.
2. Client calls `GET /api/auth/me`; if 401 → redirect to `/login`.
3. Personalised greeting: time-of-day phrase + first name + solar profile summary.
   - Example: *"Good morning, Ravi! Your 3 kW system in Nagpur is producing well this season."*

### 3.2 UI Blocks

**Hero Section**

- Animated SuryaMascot in `idle` or `happy` state on first post-login visit (Motion float animation)
- Headline adapts to solar profile vs. generic CTA for new users
- "Start Chatting Now" navigates to `/chat`

**Popular Topics** (Enhanced)

- Chips fetched dynamically from `/api/chat/suggested-topics` based on user region + profile
- Topics: subsidy eligibility, net metering, battery storage, maintenance tips, MNRE schemes
- Click → stores prefilled question in `sessionStorage['firstMessage']` → routes to `/chat`
- Auto-sent within 400 ms of chat page mount
- Motion: stagger children, hover lift, spring transitions

**Solar Dashboard Widget** (NEW)

- Mini card: capacity, city, estimated monthly savings (animated count-up)
- AI-generated solar tip of the day, personalised to season + location
- Link to chat for deeper follow-up on the tip

**Info Cards** (Enhanced)

- Language support: EN / HI / GU / TA / Hinglish with flag icons
- Voice answers: mic icon + continuous voice mode explainer
- Chat history: shows conversation count
- Offline mode badge when service worker is active
- Motion: staggered fade-in, hover lift

### 3.3 Logout

`POST /api/auth/logout` → server clears cookie → client redirects to `/login`. Zustand voice and mascot state reset to prevent stale UI on next login.

---

## 4. Chatbot Text Workflow

### 4.1 Page Initialisation

- Auth check: `GET /api/auth/me`; redirect to `/login` if 401
- Sidebar: `GET /api/chat/conversations` — sorted by `updatedAt` desc
- `sessionStorage['firstMessage']` consumed and auto-sent after 400 ms if present
- Voice settings rehydrated from `localStorage` (speed, volume, auto-speak, auto-listen)

### 4.2 Sending a Message

**Client-side pre-processing:**

- Language detection: regex + Unicode character-range heuristics (EN / HI / GU / TA / Hinglish)
- Profanity filter: client-side word list warns user before sending (NEW)
- Char limit: 1000 chars; live counter in textarea corner
- UI immediately appends user bubble; mascot transitions to `thinking`
- Motion: message bubbles slide in with direction-based animation (user from right, assistant from left)

**API call — `POST /api/chat`:**

Payload: `{ message, conversationId?, lang, imageBase64? }`  
Response: Server-Sent Events stream (`data: {token}` per chunk, then `data: [DONE]`)

**Backend processing:**

1. Auth: extract `userId` from `x-user-id` header
2. Conversation: create row if no `conversationId`; save user message
3. Memory: load last 10 messages; if conversation > 20 msgs, prepend semantic summary (NEW)
4. System prompt: SuryaMitra persona + user solar profile + language + season/region + response format
5. LLM: Groq streaming; tokens streamed as SSE
6. Post-stream: save full reply to DB; update conversation title (first 60 chars)
7. Intent tag: classify response intent (`info / urgent / happy / empathetic`) → final SSE meta event (NEW)

**Frontend stream handling:**

- `ReadableStream` reader appends tokens to assistant bubble in real-time
- Final meta event: intent tag → triggers mascot state change
- 3 AI-generated follow-up suggestion chips appear below bubble (NEW)
- Scroll-to-bottom throttled to once per 100 ms during streaming

### 4.3 Conversation Sidebar (Enhanced)

- Shows: title, message count, language flag, relative timestamp ("2 hrs ago")
- Keyword search bar filters conversations in real-time (NEW)
- Clicking loads all messages via `GET /api/chat/messages/:id`
- "Load earlier" button for paginated fetch of long conversations (NEW)
- Delete conversation with confirmation toast

---

## 5. Voice Features — Text-to-Speech (TTS)

### 5.1 Settings & Persistence

Voice preferences stored in `localStorage`:

- Speed (0.5× – 2.0×), Volume (0–100)
- Auto-speak toggle, Auto-listen toggle
- Gender preference for voice selection

### 5.2 TTS Request Flow

**Sentence segmentation:**

- Boundary detection: `.`, `!`, `?`, `|`, `।` (Devanagari danda), clause commas at 200+ chars
- Minimum segment: 8 chars; Maximum: 200 chars

**TTS Pre-processor** (`tts-preprocessor.ts`) (Enhanced):

- Strip markdown: `**`, `*`, `#`, `` ` ``, `>`, `[ ]`
- Number expansion: `10000` → "das hazaar" (HI) / "ten thousand" (EN)
- Abbreviation expansion: `PM` → Prime Minister, `kW` → kilowatt, `MNRE` → full form
- Scheme normalisation: "PM-Kusum" → "Pradhan Mantri Kusum Yojana"
- Emoji strip before TTS

**Audio Queue Manager** (Enhanced):

- Each segment: `POST /api/tts { text, lang, rate, voice? }`
- Backend selects voice by `lang + gender` preference from user profile
- Response: `audio/mpeg` stream → Blob URL
- Playback: `Audio` element; `onended` fires next item
- **Pre-fetch**: clip N+1 fetches while clip N plays — zero gaps (NEW)

### 5.3 User Controls

- Volume and speed sliders (persisted in `localStorage`)
- Mute toggle: disables auto-speak; text still streams
- Replay last answer button: re-queues most recent TTS segments
- Skip sentence button: skips current clip, advances queue (NEW)

---

## 6. Voice Features — Speech-to-Text (STT)

### 6.1 Capability Detection (on mount)

- Browser support for `SpeechRecognition` / `webkitSpeechRecognition`
- Support for `getUserMedia` + `MediaRecorder`
- Microphone permission state via Permissions API

### 6.2 Whisper Path (Primary)

**Recording:**

- `getUserMedia({ audio: true, echoCancellation: true, noiseSuppression: true, sampleRate: 16000 })`
- `MediaRecorder` in `audio/webm;codecs=opus` at 16 kbps
- Chunks collected every 250 ms

**Real-time Silence Detection** (Enhanced):

- `Web Audio AnalyserNode` samples RMS amplitude every 50 ms
- Dynamic threshold: baseline noise floor measured in first 300 ms; speech = 3× above baseline
- Silence timer: auto-stop after 1200 ms continuous silence (configurable)
- Visual VAD amplitude bar on screen

**Upload & transcription:**

- `FormData: { audio: Blob, lang, conversationId }`
- `POST /api/stt` → Groq Whisper with language hint
- Returns `{ transcript, confidence, detectedLang }` or `{ error: 'no_speech' }`
- If `confidence < 0.6` → "Did you mean…?" confirmation chip shown (NEW)

### 6.3 Browser STT Fallback

- `SpeechRecognition`: `continuous: true, interimResults: true`
- Live interim text shown in textarea (greyed, italic)
- `onend` auto-restarts if still in `LISTENING` state
- Final transcript triggers same `sendMessage` flow as Whisper path

### 6.4 Constraints & Error Handling

- Requires HTTPS or localhost for mic access
- Friendly messages for: mic blocked, no device, network issues, unsupported browsers

---

## 7. Real-Time Continuous Voice Loop (NEW)

> **Goal:** The app should feel like a live phone call with a solar advisor — speak, get a response, and it automatically hands the turn back.

### 7.1 Voice State Machine (Zustand)

```
IDLE ---> LISTENING ---> UPLOADING ---> THINKING ---> STREAMING ---> SPEAKING
  ^                                                                      |
  +---------------------- AUTO_LISTEN <-----------------------------------+
                           |
                     (auto-listen ON)
```

| State          | Entry                          | Exit                        |
|----------------|--------------------------------|-----------------------------|
| `IDLE`         | Default; TTS ends, auto-listen OFF | Mic tap or wake-word   |
| `LISTENING`    | Mic opened; MediaRecorder started | Silence > 1.2 s or stop tap |
| `UPLOADING`    | Audio blob sent to `/api/stt`  | Transcript received or error |
| `THINKING`     | `sendMessage` called           | First SSE token arrives     |
| `STREAMING`    | LLM tokens arriving            | Final SSE `done` event      |
| `SPEAKING`     | TTS queue has clips; `Audio.play()` | All clips exhausted   |
| `AUTO_LISTEN`  | Speaking ends; auto-listen ON  | → `LISTENING`               |
| `WAKE_LISTENING` | App idle; wake-word mode active | Hotword detected → `LISTENING` |

### 7.2 Barge-in Support (NEW)

While in `SPEAKING` state, `AnalyserNode` continues sampling:

- If RMS exceeds threshold for 300 ms → treated as barge-in
- Immediately: pause `Audio`, clear TTS queue, cancel in-flight TTS fetches
- Transition to `LISTENING`; mascot switches to listening animation
- Prevents the frustrating wait for Surya to finish speaking

### 7.3 Interruption & Recovery

| Failure                    | Behaviour                                           |
|---------------------------|-----------------------------------------------------|
| Network error during STT  | Retry once after 1 s; toast "Connection issue"      |
| LLM stream timeout (> 8 s)| Abort; toast "Surya is thinking… try again"         |
| TTS fetch failure         | Skip segment silently; show subtitle text only      |
| Mic permission revoked    | Exit voice loop; show re-enable prompt              |

---

## 8. Wake-Word Detection (NEW)

Passive background listening for **"Hey Surya"** — runs in a Web Worker:

- Uses **Picovoice Porcupine WASM** or a lightweight keyword-spotter model
- Active only when chat page is in focus and voice mode is enabled
- Detection → stop any TTS → transition to `LISTENING`
- **Visual indicator**: small pulsing teal dot on the mic button when active
- **Privacy**: audio processed entirely on-device; never sent to server in wake-word mode

---

## 9. Mascot Animation Engine

### 9.1 All 12 Animation States

| State        | Trigger           | Animation                          | Visual FX                        |
|-------------|-------------------|------------------------------------|----------------------------------|
| `idle`      | Default           | 14px float, 3.5s + breathe scale 2%| Orange glow ring slow pulse      |
| `listening` | Mic open          | Fast pulse 1.4s                    | 3 sonar rings; VAD bar; blue glow|
| `thinking`  | STT uploaded      | Bob + 2° tilt, 2s                  | 3 purple bouncing dots           |
| `streaming` | Tokens arriving   | Side-to-side reading motion        | Orange dots; amber glow          |
| `talking`   | TTS playing       | Tight shake 0.4s                   | 5 green audio bars               |
| `happy`     | Intent = happy    | Multi-stage bounce                 | Confetti; gold glow              |
| `empathetic`| Intent = empathetic | Slow soft sway                   | Lavender glow                    |
| `urgent`    | Intent = urgent   | Fast alert motion                  | Alert orange glow                |
| `error`     | API / network error | Shake ±10px with tilt            | 50% desaturate; red glow         |
| `wake_ready`| Wake-word mode ON | Gentle ear-perk 8px, 1.5s          | Teal dot; teal glow              |
| `offline`   | No network        | Opacity 0.4 ↔ 0.7 slow pulse       | 80% greyscale                    |
| `celebrating`| Goal complete    | Spin 360° + bounce overlay         | Max gold glow; confetti          |

### 9.2 Amplitude-synced Mouth Animation (NEW)

During `SPEAKING`, `AnalyserNode` connected to `Audio` output:

- Mouth bar height from frequency bin (80–300 Hz) every 50 ms
- Three bars of varying height create lip-movement illusion
- CSS custom property `--bar-height` updated via JS for GPU-composited animation

### 9.3 State Transition Rules

```
User taps mic ----------------> idle -> listening
Silence detected -------------> listening -> uploading
Transcript received ----------> uploading -> thinking
First LLM token --------------> thinking -> streaming
TTS starts playing -----------> streaming -> talking
TTS exhausted (auto OFF) -----> talking -> idle
TTS exhausted (auto ON) ------> talking -> auto_listen -> listening
Barge-in detected ------------> talking -> listening
API error --------------------> any -> error
Intent = happy ----------------> streaming/talking -> happy (2s) -> previous
Wake word detected -----------> wake_listening -> listening
```

---

## 10. Smart Conversation Memory (NEW)

When a conversation exceeds **20 messages**, the backend auto-creates a semantic summary:

1. Secondary Groq call condenses older messages into a 200-token summary
2. Summary stored in `conversations.summary` column
3. Every subsequent LLM call prepends summary before last 10 messages
4. Model retains context about solar setup, prior decisions, user preferences
5. Summary regenerated every 10 new messages beyond threshold

---

## 11. Predictive Input Suggestions (NEW)

As the user types, client debounces 600 ms then calls `GET /api/chat/suggestions?partial=<text>`:

- Backend returns 3 autocomplete suggestions based on partial text + conversation context
- Shown as pill chips below textarea; clicking fills the input
- Respects user's detected language
- Example: typing "subsidy" → chips for subsidy-related queries in Maharashtra, PM Surya Ghar, battery storage

---

## 12. Emotion-Aware TTS (NEW)

Intent tag from LLM meta event maps to SSML prosody hints:

| Intent        | Rate  | Pitch | Volume |
|---------------|-------|-------|--------|
| `happy`       | +10%  | +5%   | normal |
| `urgent`      | +5%   | neutral | +10% |
| `empathetic`  | -10%  | -3%   | -5%    |
| `neutral`     | user  | user  | user   |
| `informational` | -5% | neutral | normal |

---

## 13. Offline Cache Mode (NEW)

**Service Worker** caches:

- All static assets (JS, CSS, fonts, mascot images)
- Last 20 assistant responses (text)
- Last 5 TTS audio blobs

**Behaviour when offline:**

- Chat input disabled; cached responses as "Cached Answers" chips
- Banner: *"You are offline. Showing recent answers."*
- Mascot enters `offline` state (greyed out, slow pulse)

**On reconnect:**

- Background Sync API queues messages sent while offline
- Toast: *"Back online! Sending queued messages…"*

---

## 14. Multi-modal Input: Image Upload (NEW)

Users can attach an image (roof photo, electricity bill, panel installation):

- File picker or camera; max 5 MB; JPEG / PNG / WEBP
- Image base64-encoded and sent with message in `POST /api/chat`
- Backend passes image to Groq vision model
- **Use cases:** shading analysis, panel count, bill consumption
- Thumbnail in message bubble with expand-on-click lightbox

---

## 15. Solar Profile Personalisation (NEW)

User's solar profile stored at registration and used throughout:

| Field               | Usage                                   |
|---------------------|-----------------------------------------|
| State / city        | Region-specific scheme lookup           |
| Roof area (sqft)    | Panel count estimation                  |
| Monthly bill (₹)    | ROI and payback calculations            |
| Existing capacity   | Upgrade recommendations                 |
| Preferred language  | Default chat language; TTS voice        |

---

## 16. Page-Level Micro-Interactions (Motion / Framer Motion)

### Login / Register

- Background: animated solar-panel grid with slow parallax
- Form card: slide-up entrance, glassmorphism with orange glow on focus
- Password strength meter: colour bar + label
- Register: step indicator with animated progress line
- Error: field-level shake animation + red border
- Stats cards: stagger fade-in, hover scale

### Dashboard

- Hero mascot: Motion float animation; transitions to happy on first load
- Topic chips: stagger children, hover lift, spring transitions
- Info cards: staggered fade-in (100 ms delay between each)
- CTA button: hover scale, tap feedback

### Chat Page

- Background: subtle grid pattern, slow drift (opacity 0.03)
- User bubble: slides in from right with fade
- Assistant bubble: slides in from left with fade
- Typing indicator: AnimatePresence entrance/exit
- Toast: slide up from bottom; spring animation; AnimatePresence exit
- Quick topic chips: Motion hover lift
- Message list: direction-based entrance animations

---

## 17. Error Handling & Edge Cases

| Error                    | Cause                 | User-facing Behaviour                         |
|--------------------------|-----------------------|-----------------------------------------------|
| `401 Unauthorised`       | Token expired         | Toast "Session expired" → redirect in 2 s     |
| `429 Rate Limited`       | Too many login attempts | Toast with cooldown timer                   |
| `503 LLM Unavailable`    | Groq API outage       | Mascot `error` state; retry button            |
| `STT no_speech`          | Silent recording      | Toast "No speech detected. Please try again." |
| `STT low_confidence`     | Unclear speech        | Confirmation chip "Did you mean: …"           |
| `TTS fetch failure`      | edge-tts timeout      | Skip segment; show subtitle only              |
| Mic permission denied    | User blocked mic      | Friendly prompt to enable in settings         |
| Image upload too large   | > 5 MB file           | Client validation; resize suggestion          |

---

## 18. Environment & Configuration

| Variable                   | Required | Purpose                               |
|---------------------------|----------|---------------------------------------|
| `JWT_SECRET`              | Yes      | HS256 signing key; min 32 chars       |
| `DATABASE_URL`            | Yes      | Neon PostgreSQL connection string     |
| `GROQ_API_KEY`            | Yes      | LLM + Whisper + Vision                |
| `NEXT_PUBLIC_APP_URL`     | Yes      | Email links, CORS                     |
| `WAKE_WORD_MODEL_URL`     | Optional | Porcupine WASM path                   |
| `TTS_VOICE_OVERRIDE`      | Optional | Force specific Microsoft Neural voice |
| `RATE_LIMIT_WINDOW_MS`    | Optional | Login rate-limit (default: 900000)    |
| `OFFLINE_CACHE_MAX`       | Optional | Max cached responses (default: 20)    |
| `STT_CONFIDENCE_THRESHOLD`| Optional | Min confidence for auto-send (0.6)    |
| `MEMORY_SUMMARY_THRESHOLD`| Optional | Message count before summarisation (20) |

---

## 19. Known Limitations & Roadmap

### Current Limitations

- Single-role auth: No admin or fine-grained permissions
- Wake-word licensing: Porcupine requires commercial license for production
- Emotion TTS: SSML prosody varies by voice; tested on `en-IN` and `hi-IN` only
- Vision model: Accuracy depends on Groq multi-modal model at deploy time
- Offline mode: Caches responses only; new conversations need connectivity
- Context window: Semantic summary mitigates but does not fully remove token limits

### Roadmap

- SMS OTP for phone-number login (Twilio / MSG91)
- Role-based access: installer portal, admin analytics dashboard
- Push notifications for daily solar tip
- Exportable chat history as PDF
- Real-time solar generation data (inverter API or DISCOM)
- A/B testing for mascot designs and prompt variants
- Multi-user household mode (multiple profiles, one account)
- WhatsApp integration for voice messages

---

*SuryaMitra v2.0 — Built with ☀️ for India's solar future*
