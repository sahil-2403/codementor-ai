# CodeMentor AI

CodeMentor AI is a MERN learning platform for structured coding practice. Learners can start an individual Course or follow an ordered Learning Path, receive a Course-level roadmap, study Lessons, complete Quizzes and Practice tasks, practise Interview questions, review progress, and use optional Gemini-assisted guidance.

## Product principles

- **The server owns learning state.** Enrollments, roadmaps, unlocks, attempts, scores, weak topics, revisions, and content lifecycle are persisted in MongoDB.
- **Courses own curriculum.** Topics, Lessons, Questions, Practice Tasks, Interview practice, and Roadmap Templates are scoped to a Course.
- **Technologies classify content.** A learner can start a Course directly without selecting a programming language first.
- **Deterministic learning features do not require AI.** Authentication, onboarding, template roadmaps, Lessons, Quizzes, Practice, Interview attempts, Progress, and admin content management remain available when Gemini is disabled.
- **Skill-check personalization is backend-owned.** Assessment results identify weak topics and the backend maps those topics to verified roadmap modules. Gemini may explain the focus areas, but it does not decide which modules are weak or rename/reorder the roadmap.
- **AI output is labelled honestly.** Provider failures use stored/deterministic fallback guidance without presenting fallback content as generated analysis.
- **Hireflow is the complexity ceiling.** CodeMentor may be simpler than Hireflow, but it must not introduce architecture beyond the current Hireflow project unless the project scope is explicitly raised.

## Main capabilities

### Learners

- Registration, email verification, login, password recovery, and session invalidation
- Fresh isolated demo accounts created on demand from Login
- Course and Learning Path catalog
- Beginner, Intermediate, and Advanced entry levels
- Optional Course-specific skill checks for Intermediate and Advanced learners
- Cumulative roadmaps that keep lower-level content available for revision
- Assessment-personalized priority modules linked to verified weak topics
- Ordered modules, Lesson completion, and module Quizzes
- Weak-topic and Revision tracking
- Contextual Gemini Mentor with saved Course explanations as fallback
- Practice Tasks and Interview practice with two attempts
- Dashboard, Progress, and weekly Reports
- Multiple independent Enrollments with current-Course switching

### Administrators

- Technologies
- Courses
- Learning Paths
- Topics
- Lessons
- Quiz Questions and Skill Checks
- Interview Questions
- Practice Tasks
- Roadmap Templates

Admin content uses a consistent lifecycle: active/draft/published content is archived before permanent deletion. Archiving a Course archives its owned curriculum; restoring it returns the Course and publishable child content to Draft while Topics become Active. External references can block archive or deletion and return clear resolution instructions.

## Technology

### Frontend

- JavaScript and JSX
- React 18
- React Router 6
- Axios
- React Hook Form and Zod
- Tailwind CSS 3
- Lucide React
- Sonner
- Vite 5

Frontend feature data follows a simple Hireflow-style flow:

```text
Page / Component
  -> useState + useEffect
  -> domain API wrapper
  -> Axios
```

Authentication is the only shared application state and uses `AuthContext` plus a small Axios refresh interceptor.

### Backend

- JavaScript
- Node.js
- Express
- MongoDB and Mongoose
- Zod
- JWT authentication with HttpOnly cookies
- Brevo transactional email REST API
- Google Gemini API

Backend request flow stays straightforward:

```text
Route
  -> middleware / validation
  -> Controller
  -> Service
  -> Mongoose Model
```

## Repository layout

```text
backend/
  src/
    ai/               Gemini client, response schemas, and prompt builders
    controllers/      HTTP request/response orchestration
    services/         Domain workflows and learning-context lookup
    models/           Mongoose schemas and indexes
    routes/           Authenticated and role-scoped routes
    validations/      Zod request validation
  test/unit/          Backend contract and policy tests

frontend/
  src/
    api/              Axios clients grouped by domain
    hooks/            Small application hooks such as useAuth
    pages/            Public, onboarding, learner, and admin screens
    components/       Shared UI and domain components
    constants/        Product enums and display configuration
    validations/      Client-side Zod schemas
  test/               Frontend source-contract tests

docs/
  ARCHITECTURE.md
  DEVELOPMENT.md
  JUNIOR_PROJECT_SCOPE.md
  RELEASE_CHECKLIST.md
```

## Quick start

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB locally or through MongoDB Atlas
- Optional Brevo API key for real verification/reset emails
- Optional Gemini API key for AI-assisted features

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Before running `npm run seed`, set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `backend/.env`. These credentials are intentionally not committed to the repository.

The API listens on `http://localhost:5000` by default.

> `npm run seed` is intended for a fresh development/demo database and refuses to run when `NODE_ENV=production`. Do not use it as a migration or update script against data you need to keep.

Health endpoint: `GET /health`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend listens on `http://localhost:5173`. During development, Vite proxies relative `/api` requests to the backend.

## Optional Gemini support

```env
ENABLE_AI=true
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-1.5-flash
```

Gemini-assisted features include Mentor answers, Quiz explanations, Practice reviews, Interview feedback, weekly summaries, and explanatory text for verified skill-check roadmap focus areas. Assessment scoring and roadmap priority mapping remain deterministic backend behavior.

## Email

For local development, `ALLOW_DEV_EMAIL_LOG=true` can log verification/reset links when delivery is disabled. For real delivery, configure Brevo and set:

```env
EMAIL_ENABLED=true
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM_NAME=CodeMentor AI
EMAIL_FROM_ADDRESS=verified-sender@example.com
ALLOW_DEV_EMAIL_LOG=false
```

Verification and password-reset messages keep CodeMentor's existing templates; only the delivery transport uses Brevo's transactional email REST API.

## Demo accounts

The Login page can create a fresh demo learner on demand. Each request creates a separate verified learner with its own Beginner Complete JavaScript enrollment, roadmap, progress, attempts, Mentor history, and other learner data. The generated credentials are filled into the Login form and are not shared with other demo users. If provisioning fails, partial demo records are removed before the error is returned.

## Tests and builds

```bash
cd backend
npm test

cd ../frontend
npm test
npm run build
```

Run the optional Gemini contract check when AI is configured:

```bash
cd backend
npm run check:gemini
```

## Environment groups

- Origins/proxy: `CLIENT_URL`, `ALLOWED_ORIGINS`, `TRUST_PROXY`
- Authentication: JWT and cookie settings
- Persistence: `MONGO_URI`
- Development seed: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`
- AI: Gemini configuration, daily limits, input limits, and timeout
- Email: `EMAIL_ENABLED`, `BREVO_API_KEY`, and sender/reply-to addresses
- Frontend API: optional `VITE_API_BASE_URL`

Never commit real credentials or production `.env` files.

## Further documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Junior project scope](docs/JUNIOR_PROJECT_SCOPE.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
