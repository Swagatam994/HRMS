# AI Interviewer Agent

Production-oriented MERN AI Interviewer Agent built with React, Vite, Tailwind CSS, Express, MongoDB, Mongoose, JWT auth, native browser speech APIs, Chart.js, jsPDF, and Google Gemini through the backend only.

## Phase 1: Planning

Architecture, API design, data model, UI plan, security boundaries, and deployment assumptions are documented in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Phase 2: Backend

Backend lives in `Backend/`.

- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Questions: `GET /api/questions/:role`
- Interviews: `POST /api/interview/start`, `POST /api/interview/answer`, `POST /api/interview/end`, `GET /api/interview/history`, `GET /api/interview/:id`
- Profile: `GET /api/user/profile`, `PATCH /api/user/profile`
- Gemini logic: `Backend/services/geminiService.js`
- Prompts: `Backend/prompts/`
- Local question banks: `Backend/questions/`

## Phase 3: Frontend

Frontend lives in `Frontend/`.

- Pages: Home, Login, Register, Dashboard, Create Interview, Interview Room, Interview Summary, Interview History, Profile, 404
- State: Auth and theme context
- Speech: native `SpeechRecognition` and `SpeechSynthesis`
- Charts: Chart.js and `react-chartjs-2`
- PDF: lazy-loaded jsPDF report download

## Phase 4: AI Integration

Gemini calls are isolated in `Backend/services/geminiService.js` and use backend environment variables only. If `GEMINI_API_KEY` is not configured, the backend uses a deterministic local fallback evaluator for development demos.

## Phase 5: Speech Integration

The interview room speaks the greeting and each question, supports microphone transcription, typing mode, pause/resume, progress, timers, and one-question-at-a-time scoring.

## Phase 6: Verification

Completed checks:

- Backend dependencies installed and audited with 0 vulnerabilities.
- Backend JavaScript syntax checked with `node --check`.
- Frontend dependencies installed and audited with 0 vulnerabilities after upgrading `jspdf`.
- Frontend production build passed with `npm run build`.

## Phase 7: Deployment

### Backend Environment

Copy `Backend/.env.example` to `Backend/.env`.

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-interviewer
JWT_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
CLIENT_URL=http://localhost:5173
```

### Frontend Environment

Copy `Frontend/.env.example` to `Frontend/.env`.

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Local Run

```bash
cd Backend
npm install
npm run dev
```

```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Production Targets

- Frontend: Vercel, Netlify, Azure Static Web Apps, or any static host serving `Frontend/dist`.
- Backend: Render, Railway, Fly.io, Azure App Service, or any Node host.
- Database: MongoDB Atlas.

Set `CLIENT_URL` on the backend to the deployed frontend origin and `VITE_API_BASE_URL` on the frontend to the deployed backend `/api` URL.
