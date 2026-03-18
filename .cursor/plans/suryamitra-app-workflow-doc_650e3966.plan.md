---
name: suryamitra-app-workflow-doc
overview: Describe the full end-user workflow and major features of the SuryaMitra app, including chatbot, voice, animations, and authentication.
todos:
  - id: confirm-understanding
    content: Confirm that this workflow description matches how you expect the SuryaMitra app to behave for auth, chatbot, voice features, and animations.
    status: completed
isProject: false
---

## SuryaMitra App – End-to-End Workflow

### 1. High-level architecture

- **Framework**: Next.js App Router with React client components.
- **Key routes**:
  - Public: `/`, `/login`, `/register`.
  - Protected: `/dashboard`, `/chat`.
- **Back-end APIs**:
  - Auth: `[src/app/api/auth/](src/app/api/auth)`* (login, register, me, logout).
  - Chat: `[src/app/api/chat/route.ts](src/app/api/chat/route.ts)` + conversation/message helpers.
  - Voice: `[src/app/api/tts/route.ts](src/app/api/tts/route.ts)`, `[src/app/api/stt/route.ts](src/app/api/stt/route.ts)`.
- **Database & auth helpers**:
  - DB: `[src/lib/db.ts](src/lib/db.ts)` for users, conversations, messages.
  - Auth: `[src/lib/auth.ts](src/lib/auth.ts)` for JWT + password hashing.
  - Middleware: `[src/middleware.ts](src/middleware.ts)` to guard protected routes.

```mermaid
flowchart TD
  user[User Browser]
  rootPage[/"/" page.tsx/]
  loginPage[/login]
  registerPage[/register]
  dashboardPage[/dashboard]
  chatPage[/chat]

  authApi[Auth APIs]
  chatApi[Chat API]
  ttsApi[TTS API]
  sttApi[STT API]
  db[(Neon DB)]

  user --> rootPage
  rootPage -->|no token| loginPage
  rootPage -->|valid token| dashboardPage

  loginPage -->|POST /api/auth/login| authApi
  registerPage -->|POST /api/auth/register| authApi
  dashboardPage -->|GET /api/auth/me| authApi
  chatPage -->|GET /api/auth/me| authApi

  authApi --> db

  dashboardPage -->|navigate to /chat| chatPage

  chatPage -->|POST /api/chat (messages)| chatApi
  chatApi --> db
  chatApi -->|LLM + Whisper| db

  chatPage -->|POST /api/tts| ttsApi
  chatPage -->|POST /api/stt| sttApi
  ttsApi --> db
  sttApi --> db
```



### 2. Authentication & navigation flow

- **Initial entry (`/`)**
  - Server checks `suryamitra_token` cookie using `verifyToken`.
  - If valid, redirect to `/dashboard`; if missing/invalid, redirect to `/login`.
- **Registration (`/register`)**
  - Two-step form collects account + profile info.
  - On submit, `POST /api/auth/register`:
    - Validates input, hashes password, creates user in DB.
    - Issues JWT and sets `suryamitra_token` httpOnly cookie.
    - Redirects to `/dashboard`.
- **Login (`/login`)**
  - Email/password form `POST /api/auth/login`.
  - On success, backend sets `suryamitra_token`; client redirects to `/dashboard`.
- **Protected routes**
  - `[src/middleware.ts](src/middleware.ts)` intercepts `/dashboard` and `/chat`:
    - If no/invalid token → redirect to `/login`.
    - If valid token → injects `x-user-`* headers and lets request continue.
  - `dashboard/page.tsx` and `chat/page.tsx` also call `/api/auth/me` on mount for extra safety.

### 3. Dashboard experience (`/dashboard`)

- **On load**
  - Calls `/api/auth/me`; if unauthenticated, sends user back to `/login`.
  - If authenticated, shows personalized greeting using user name + time of day.
- **Main UI pieces**
  - **Hero CTA**: “Start Chatting Now” button that navigates to `/chat`.
  - **Popular topics**: Clicking a topic stores a prefilled question in `sessionStorage` and routes to `/chat` so the first message is auto-sent.
  - **Info cards**: Explain language support, voice answers, and chat history.
- **Logout**
  - Button calls `/api/auth/logout` to clear cookie, then redirects to `/login`.

### 4. Chatbot text workflow (`/chat`)

- **Page initialization**
  - On mount, call `/api/auth/me`; if not logged in, redirect to `/login`.
  - Load conversation list via `GET /api/chat/conversations` to show sidebar history.
  - If a `firstMessage` exists from dashboard, auto-send it after mount.
- **Starting a new conversation**
  - User types in the textarea and presses Enter or clicks Send.
  - Client detects language (Hindi, Hinglish, English, Gujarati, Tamil) for labeling.
  - UI immediately appends a user message in local state.
  - `fetch('/api/chat')` sends `{ message, conversationId? }`.
  - Backend:
    - Validates auth (from cookie).
    - Creates a conversation if `conversationId` is missing; saves user message.
    - Builds LLM prompt with last ~10 messages + a persona-rich system prompt.
    - Streams tokens from Groq back as server-sent-style chunks.
    - Saves full assistant answer and updates conversation title in DB.
  - Frontend:
    - Displays an assistant bubble that updates as text chunks stream in.
    - Scrolls to bottom and updates the conversation list when a new conversation is created.
- **Resuming a past conversation**
  - Sidebar lists conversations with titles and message counts.
  - Clicking one calls `GET /api/chat/messages/:id` to load all messages.
  - Messages are rendered in order; subsequent user messages continue that thread.

### 5. Voice features – text-to-speech (TTS)

- **Preferences & state**
  - Voice settings (speed, volume, auto-speak, auto-listen) are stored in `localStorage` so they persist between visits.
- **TTS request flow**
  - As the assistant’s text streams in:
    - The client accumulates text and detects sentence boundaries.
    - For each complete sentence, it calls `POST /api/tts` with `{ text, lang, rate }`.
    - The backend (`tts/route.ts`) uses `edge-tts-universal` and language-specific Microsoft Neural voices.
    - It pre-processes text (`tts-preprocessor.ts`) to remove markdown, expand numbers/abbreviations, and normalize scheme names for clearer pronunciation.
  - The client keeps a queue of audio clips:
    - Plays them sequentially with an `Audio` element.
    - Animates the mascot and audio bars during playback.
    - After the queue finishes, it can optionally re-open the mic if auto-listen is enabled.
- **User controls**
  - Volume and speed sliders in a settings panel.
  - Buttons to pause/resume playback or replay the last answer.
  - A mute toggle to disable auto-speak while keeping the chatbot text.

### 6. Voice features – speech-to-text (STT)

- **Capability detection**
  - On mount, the chat page checks:
    - Browser support for `SpeechRecognition`/`webkitSpeechRecognition`.
    - Support for `getUserMedia` + `MediaRecorder`.
    - Microphone permission state (if permissions API is available).
- **Whisper-based STT path** (preferred where supported)
  - When user taps the mic button:
    - App stops any TTS audio and ensures no current STT upload is running.
    - Requests `getUserMedia({ audio: true })` and starts `MediaRecorder` in small chunks.
    - Uses Web Audio `AnalyserNode` to detect real speech vs silence.
  - On stopping recording:
    - If recording is silent or too short, it shows a “no speech detected” message and discards audio.
    - Otherwise, uploads a `FormData` with `audio` and `lang` to `POST /api/stt`.
  - Backend (`stt/route.ts`):
    - Uses Groq Whisper to transcribe.
    - Returns `{ transcript }` or a clear error if no speech was found.
  - Frontend:
    - Inserts the transcript into the input field and sets mascot to "thinking".
    - Calls the same `sendMessage` flow used for typed messages.
- **Browser STT fallback path**
  - If `SpeechRecognition` is available:
    - Starts continuous recognition with interim results.
    - Live interim text appears in the input as the user speaks.
    - On `onend`, if still in listening mode, it restarts automatically.
    - When a final transcript is ready and user stops listening, that text is sent as a chat message.
- **Error handling & constraints**
  - Requires HTTPS or localhost for mic access.
  - Shows friendly messages for mic blocked, no device, network issues, and unsupported browsers.

### 7. Animations and visual behaviour

- **Global animations (`globals.css`)**
  - Keyframes for mascot states: idle, listening, thinking, talking, happy.
  - Utility animations: float, glowPulse, sonar, typing dots, messageAppear, slide/fade transitions.
- **Mascot animations**
  - `SuryaMascot` component switches CSS classes based on app state:
    - `idle`: gentle breathing/float.
    - `listening`: pulsing and sonar-like rings while mic is active.
    - `thinking`: subtle pulsing dots when AI is generating a response.
    - `talking`: bar-bounce and glow tied to TTS playback.
    - `happy`: celebratory motion on successful answers.
- **Page-level micro interactions**
  - Login/register: gradient backgrounds with slow float/spin, cards with hover elevation.
  - Dashboard: mascot and cards float slightly; topic cards lift on hover.
  - Chat: background grid animation, message bubbles slide/fade in, typing indicator dots bounce while the AI is responding, toast messages slide up from the bottom.

### 8. Logout and session end

- **From dashboard or chat**
  - Logout button calls `/api/auth/logout`, which clears `suryamitra_token`.
  - Client redirects to `/login`.
- **After logout**
  - Subsequent visits to `/dashboard` or `/chat` hit `middleware.ts` and are redirected to `/login`.
  - Visiting `/` redirects to `/login` until the user logs in or registers again.

### 9. Notable limitations / assumptions

- **Single-role auth**: Only basic user auth is implemented; there are no admin roles or fine-grained permissions.
- **Context window**: Only the last ~10 messages are sent to the LLM for context, even though full history is stored in DB.
- **Environment requirements**: The app assumes valid `JWT_SECRET`, `DATABASE_URL`, and `GROQ_API_KEY` are configured; missing values break auth or AI features.
- **Voice support**: Voice features depend heavily on modern browser APIs and HTTPS; older/locked-down browsers may fall back to text-only use.

