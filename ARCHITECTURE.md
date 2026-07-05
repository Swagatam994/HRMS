# AI Interviewer Agent Architecture

## Phase 1: Project Planning

This project is a production-oriented MERN application with a React interview console, an Express API, MongoDB persistence, Gemini-backed answer evaluation, and native browser speech APIs. The empty `Frontend` and `Backend` folders are used as the two application roots.

## System Overview

The candidate uses the React app to configure and run an interview. The backend loads role-specific questions from local JSON files, creates an interview session in MongoDB, accepts each answer transcript, sends it to Gemini for structured evaluation, stores the resulting score and feedback, and generates a final summary report.

## Component Architecture

### Frontend

- `src/components`: Reusable UI primitives and domain widgets such as cards, buttons, loaders, route guards, metric tiles, charts, and feedback lists.
- `src/pages`: Route-level screens for home, authentication, dashboard, interview setup, interview room, summary, history, profile, and 404.
- `src/hooks`: Browser API logic for speech recognition, speech synthesis, timers, and interview state helpers.
- `src/context`: Auth and theme providers shared across the app.
- `src/services`: Axios API client and endpoint wrappers.
- `src/utils`: Formatting, score helpers, constants, and PDF generation helpers.
- `src/layouts`: Authenticated app shell with navigation and page chrome.
- `src/assets`: Static UI assets and future brand/media assets.

### Backend

- `config`: Environment and MongoDB connection setup.
- `controllers`: HTTP request orchestration for auth, questions, interviews, and users.
- `routes`: Express route definitions and middleware composition.
- `middleware`: JWT protection, validation handling, and centralized error handling.
- `models`: Mongoose schemas for users, interviews, questions, answers, scores, and feedback.
- `services`: Business integrations such as Gemini and question loading.
- `prompts`: Reusable prompt builders for evaluation, question selection, and final summaries.
- `utils`: Shared helpers for async handlers, errors, JSON parsing, token generation, and report math.
- `questions`: Local JSON banks grouped by role/category.
- `uploads`: Reserved for future file-based question imports.

## Data Design

### User

Stores identity, hashed password, profile metadata, role, and timestamps.

### Interview

Stores the session owner, setup configuration, selected questions, answer transcripts, per-question evaluations, status, timing metadata, and final report.

### Question

Represents reusable question-bank items when questions are imported into MongoDB. The current app primarily reads questions from local JSON and snapshots them into each interview.

### Answer

Embedded in `Interview`. Stores question ID, prompt, expected answer, transcript, answer mode, duration, and feedback.

### Score

Embedded in `Interview.answers.feedback` and final report. Contains technical accuracy, communication, completeness, confidence, and total score out of 10.

### Feedback

Embedded feedback contains ideal answer, mistakes, suggestions, difficulty, strengths, weaknesses, and recommended topics.

## API Design

### Authentication

- `POST /api/auth/register`: Create a user with bcrypt password hashing and return JWT.
- `POST /api/auth/login`: Verify credentials and return JWT.

### Questions

- `GET /api/questions/:role`: Load role/category questions from local JSON files and optionally filter by difficulty, interview type, and limit.

### Interviews

- `POST /api/interview/start`: Create an interview from setup options and selected questions.
- `POST /api/interview/answer`: Evaluate one transcript with Gemini, store score and feedback, and return the updated answer.
- `POST /api/interview/end`: Generate and store the final report.
- `GET /api/interview/history`: Return the authenticated user's interview history.
- `GET /api/interview/:id`: Return one interview with all answers and report data.

### User

- `GET /api/user/profile`: Return authenticated profile and aggregate stats.
- `PATCH /api/user/profile`: Update profile fields.

## UI Design

The interface uses a dark premium interview-platform style with blue accents, translucent panels, compact operational layouts, smooth Framer Motion transitions, and responsive dashboards. The first authenticated screen is the actual dashboard, while the public home screen is a concise product entry point.

## Interview Flow

1. Candidate selects job role, experience level, difficulty, question count, and interview type.
2. Backend loads matching local questions and creates an interview.
3. Interview room greets the candidate with browser text-to-speech.
4. One question is shown and spoken aloud.
5. Candidate answers by voice or typing.
6. Frontend sends transcript to `/api/interview/answer`.
7. Backend prompts Gemini for strict JSON evaluation and stores the result.
8. Candidate advances to the next question.
9. Backend generates final summary through `/api/interview/end`.
10. Frontend displays score, chart, strengths, weaknesses, recommendations, and PDF download.

## AI Design

Gemini access lives only in `Backend/services/geminiService.js`. Controllers call service functions and never touch API keys or SDK details. Prompts are reusable builders in `Backend/prompts`. The service requests JSON-shaped output, validates parsed data, and falls back to deterministic local scoring when no Gemini key is configured so development can continue without exposing secrets.

## Security Design

JWT protects interview, profile, and history endpoints. Passwords are hashed with bcrypt. The Gemini key stays in backend `.env`. CORS is configurable, request payload sizes are bounded, and errors are normalized before returning to clients.

## Deployment Design

Frontend can deploy to Vercel/Netlify with `VITE_API_BASE_URL`. Backend can deploy to Render/Railway/Fly/Azure with `PORT`, `MONGO_URI`, `JWT_SECRET`, and `GEMINI_API_KEY`. MongoDB Atlas is the intended managed database.
