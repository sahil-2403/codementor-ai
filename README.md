# CodeMentor AI

CodeMentor AI is a MERN learning platform for structured coding practice. Learners can start an individual Course or follow an ordered Learning Path, receive a Course-level roadmap, study Lessons, complete Quizzes and Projects, practise Interview questions, review progress, and use optional Gemini-assisted guidance.

## Product principles

- **The server owns learning state.** Enrollments, roadmaps, unlocks, attempts, scores, weak topics, revisions, and content lifecycle are persisted in MongoDB.
- **Courses own curriculum.** Topics, Lessons, Questions, Project Tasks, Interview practice, and Roadmap Templates are scoped to a Course.
- **Technologies classify content.** A learner can start a Course directly without selecting a programming language first.
- **Deterministic learning features do not require AI.** Authentication, onboarding, template roadmaps, Lessons, Quizzes, Projects, Interview attempts, Progress, and admin content management remain available when Gemini is disabled.
- **AI output is labelled honestly.** Provider failures use stored/deterministic fallback guidance without presenting fallback content as generated analysis.
- **Hireflow is the complexity ceiling.** CodeMentor may be simpler than Hireflow, but it must not introduce architecture beyond the current Hireflow project unless the project scope is explicitly raised.

## Main capabilities

### Learners

- Registration, email verification, login, password recovery, and session invalidation
- Course and Learning Path catalog
- Beginner, Intermediate, and Advanced entry levels
- Preferences and optional Course-specific diagnostics
- Versioned template or assessment-personalized roadmaps
- Ordered modules, Lesson completion, and module Quizzes
- Weak-topic and Revision tracking
- Contextual Gemini Mentor with saved Course explanations as fallback
- Project Tasks and Interview practice with two attempts
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
- Project Tasks
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
- Recharts
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
- Nodemailer-compatible SMTP delivery
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
- Optional SMTP account for real verification/reset emails
- Optional Gemini API key for AI-assisted features

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

The API listens on `http://localhost:5000` by default.

> `npm run seed` recreates the development/demo data. Do not use it against data you need to keep.

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

Gemini-assisted features include roadmap adjustment, Mentor answers, Quiz explanations, Project reviews, Interview feedback, and weekly summaries. Each feature keeps an honest stored/deterministic fallback where appropriate.

## Email

For local development, `ALLOW_DEV_EMAIL_LOG=true` can log verification/reset links when delivery is disabled. For real delivery, configure the SMTP variables and set:

```env
EMAIL_ENABLED=true
ALLOW_DEV_EMAIL_LOG=false
```

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
- AI: Gemini configuration, daily limits, input limits, and timeout
- Email: SMTP settings and sender addresses
- Frontend API: optional `VITE_API_BASE_URL`

Never commit real credentials or production `.env` files.

## Further documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Junior project scope](docs/JUNIOR_PROJECT_SCOPE.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
