# OutlookAI — AI Mock Interview Coach

A full-stack AI-powered mock interview platform with real-time audio processing, LLM-based grading, and detailed performance reports.

## Project Structure

```
OutlookAI/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/          # Source code (routes, services, middleware)
│   ├── tests/        # Vitest unit tests
│   ├── data/faqs/    # FAQ ground truth (question banks)
│   └── package.json
├── frontend/         # React + Vite + TypeScript UI
│   ├── src/          # Components, routing, auth, API client
│   └── package.json
├── OutlookAI_Project_Specification.md
└── README.md         # ← You are here
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React, TypeScript, Vite, TailwindCSS, Framer Motion |
| **Backend** | Node.js, Express, TypeScript |
| **Auth** | Firebase Authentication (Google Sign-In) |
| **Database** | Firestore (Native Mode) |
| **Speech-to-Text** | Groq Whisper (`whisper-large-v3`) |
| **LLM Grading** | Groq (`llama-3.1-70b-versatile`) |
| **Sentiment** | Xenova Transformers (local, no API) |
| **Testing** | Vitest |

---

## Getting Started

### Prerequisites
- Node.js v18+
- Firebase Project with Authentication + Firestore enabled
- Groq API Key

### 1. Backend Setup

```bash
cd backend
cp .env.example .env    # Fill in your Firebase + Groq credentials
npm install
npm run dev             # Starts on http://localhost:3001
```

### 2. Frontend Setup

```bash
cd frontend
# Create .env with your Firebase Web config (see below)
npm install
npm run dev             # Starts on http://localhost:3000
```

### Frontend `.env` Configuration

Create `frontend/.env` with your Firebase **Web App** config from the Firebase Console → Project Settings → General → Your Web App:

```env
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=outlookai-89f9f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=outlookai-89f9f
VITE_FIREBASE_STORAGE_BUCKET=outlookai-89f9f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:3001
```

### 3. Firebase Composite Index

Create this composite index in Firestore for the history query:

- **Collection**: `sessions`
- **Field 1**: `uid` (Ascending)
- **Field 2**: `status` (Ascending)  
- **Field 3**: `completedAt` (Descending)

---

## Available Scripts

### Backend (`cd backend`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled production build |
| `npm test` | Run Vitest test suite |
| `npm run lint` | TypeScript type-checking |

### Frontend (`cd frontend`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |

---

## API Contract

All protected endpoints require `Authorization: Bearer <firebase-id-token>`.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/domains` | No | List available interview domains |
| POST | `/sessions` | Yes | Create a new interview session |
| POST | `/sessions/:id/answers` | Yes | Submit answer with audio |
| GET | `/sessions/:id/report` | Yes | Get final interview report |
| GET | `/candidates/me/reports` | Yes | Get user's past sessions |
