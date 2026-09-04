# Project: OutlookAI — AI Mock Interview Coach 
# Role: You are a senior full-stack engineer building a production backend  
# and integration layer. The UI already exists (built in Stitch, wired  
# through Antigravity) — do not design or restyle any UI. Your job is  
# authentication, architecture, data, real-time processing, and the API  
# contract the existing frontend will call. 

## ENGINEERING STANDARDS (non-negotiable) 
- TypeScript throughout, strict mode on — no `any` on request/response  
  boundaries 
- No hardcoded secrets — environment variables via a typed config module,  
  validated at startup (fail fast if a required var is missing), with a  
  `.env.example` committed 
- Layered architecture: routes → services → repositories. No business  
  logic inside route handlers. 
- Zod schema validation on every request body 
- Structured logging (pino) with a request ID traceable through a session's  
  lifecycle 
- Centralized error-handling middleware — custom error classes mapped to  
  correct HTTP status codes, never a bare 500 
- Unit tests (vitest) for real logic: fusion scoring, FAQ selection,  
  disfluency detection, auth middleware 
- Rate limiting (express-rate-limit) on session-creation and answer- 
  submission routes — you're paying per Groq call, this isn't optional 
- CORS locked to the actual frontend origin, not `*` 
- `helmet` for standard security headers 
- Request size limits set explicitly on audio-upload routes 

## TECH STACK 
- Backend: Node.js + Express + TypeScript 
- Auth: Firebase Authentication (email/password, optionally Google sign-in)  
  — handled CLIENT-SIDE via the Firebase client SDK. The Express backend  
  does NOT implement its own login/signup endpoints; it only verifies  
  Firebase ID tokens sent by the client on protected requests, via the  
  Firebase Admin SDK. 
- Persistence: Firestore — sessions, question attempts, and reports (this  
  replaces the earlier local-JSON-file report/index approach entirely) 
- FAQ ground truth: unchanged — plain JSON files in `/data/faqs/`, loaded  
  into memory at startup. Not related to the auth/persistence change. 
- STT: Groq's hosted Whisper API 
- LLM: Groq API (question rephrasing + RAG-grounded grading) 
- Sentiment: `@xenova/transformers`, local emotion classification, no  
  external call 
- Client-side (already wired by the existing UI): MediaPipe Tasks Vision  
  for pose/gaze, `meyda.js` for audio prosody — backend only ever receives  
  summary metrics from these, plus the final audio blob for transcription 

## AUTH FLOW 
1. Frontend handles signup/login/logout directly against Firebase Auth  
   (client SDK) — this is standard Firebase pattern, do not rebuild it  
   server-side. 
2. Every authenticated request from the frontend includes  
   `Authorization: Bearer <Firebase ID token>`. 
3. Express `authMiddleware` verifies the token via Firebase Admin SDK  
   (`admin.auth().verifyIdToken()`), attaches `req.uid`, rejects with 401  
   on invalid/expired tokens. 
4. Every service method that touches session or report data takes `uid`  
   explicitly — never trust a uid from the request body, only from the  
   verified token. 

## DATA MODEL 
FAQ ground truth (file, unchanged): 
```json 
{ 
  "domain": "string", 
  "type": "technical | non_technical", 
  "questions": [ 
    {"id": "string", "question": "string", "ideal_answer": "string",  
     "key_points": ["string"]} 
  ] 
} 
``` 

Firestore — single `sessions` collection:
sessions/{sessionId}
 uid: string
 domainId: string
 status: "in\_progress" | "completed"
 questions: [{ faqQuestionId, rephrasedText }]
 attempts: [{
 questionId, transcript, audioMetrics, visualMetrics,
 sentimentProfile, contentGrading
 }]
 report: {
 confidenceBand: "developing" | "comfortable" | "strong"
 strengths: string[],
 growthAreas: string[],
 perQuestionBreakdown: [...],
 deliveryPatternFlag: boolean
 } | null
 startedAt: timestamp
 completedAt: timestamp | null  

Query for a candidate's history: 
`sessions.where('uid','==',uid).where('status','==','completed').orderBy('completedAt','desc')` 
— requires a composite index; document this in the README so it's not a 
surprise on first deploy.

## FIRESTORE SECURITY RULES
Even though the Admin SDK (server-side) bypasses rules, set them correctly 
in case any client-direct Firestore reads are ever added later:

match /sessions/{sessionId} {
 allow read: if request.auth != null && request.auth.uid == resource.data.uid;
 allow write: if false; // all writes go through the verified backend only
 }  


## API CONTRACT (all routes below require a valid Firebase ID token except GET /domains)
- `GET /domains` → public, list of domains for the selection screen
- `POST /sessions` `{domainId}` → creates a Firestore session doc for 
  `req.uid`, picks 3 random questions, returns `{sessionId, firstQuestion}`
- `POST /sessions/:id/answers` `{questionId, audioBlob, visualMetrics, 
  audioProsodyMetrics}` → verifies the session belongs to `req.uid`, runs 
  STT + disfluency + sentiment + RAG grading, appends the attempt, returns 
  next question or `{sessionComplete: true}`
- `GET /sessions/:id/report` → verifies ownership, returns the report (may 
  trigger FusionService if not yet generated)
- `GET /candidates/me/reports` → Firestore query described above, returns 
  summaries for the history/dashboard screen
- All endpoints return typed errors `{error: {code, message}}`; ownership 
  mismatches return 403, not 404 (don't leak existence of other users' 
  sessions)

## CORE SERVICES
- `AuthMiddleware` — verifies Firebase ID tokens, attaches `req.uid`
- `QuestionService` — selects questions via FaqRepository, LLM-rephrases 
  each into interview phrasing
- `TranscriptionService` — Groq Whisper API wrapper
- `DisfluencyService` — filler words, repetitions, pause count
- `SentimentService` — local emotion classification
- `GradingService` — RAG grading against the FAQ entry's ideal_answer/
  key_points
- `FusionService` — combines all signals into the session-level report
- `SessionRepository` — Firestore reads/writes for the `sessions` 
  collection, always scoped by `uid`

## EVALUATION PHILOSOPHY (implement literally)
- No raw numeric scores in any API response — bands only: `developing | 
  comfortable | strong`
- FusionService aggregates across the whole session, not single moments
- Report text leads with strengths, phrases growth areas as observations, 
  never uses "failed," "bad," or "poor"
- `deliveryPatternFlag` is a soft signal with neutral supporting text, 
  never framed as an accusation

## FOLDER STRUCTURE
src/

config/        # env validation, firebase-admin init, typed settings

routes/

services/

repositories/  # FaqRepository (file-based), SessionRepository (Firestore)

middleware/    # auth, error handler, request logging, rate limiting

schemas/      # zod schemas

types/

data/

faqs/          # ground-truth JSON, per domain — unchanged, file-based

```

## DELIVERABLES
1. Full Express + TypeScript backend matching the above, runnable locally 
   with `.env` + `npm run dev`
2. Firebase project setup instructions (Auth providers to enable, Firestore 
   in native mode, the composite index needed)
3. Seed FAQ JSON for 2 domains (1 technical, 1 non-technical)
4. README covering setup, required env vars (Groq API key, Firebase Admin 
   service account), and local run instructions
5. Test suite for FusionService, GradingService, DisfluencyService, and 
   AuthMiddleware (mocked token verification)

for this give me .md file and strictly dont alter any content from this give me same do not miss anything 
