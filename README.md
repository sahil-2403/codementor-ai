# CodeMentor AI

CodeMentor AI is a MERN learning platform for structured coding practice. Learners can start an individual course or follow an ordered learning path, receive a course-level roadmap, study lessons, complete quizzes and projects, practise interview questions, review progress, and use optional Gemini-assisted guidance.

## Product principles

- **The server owns learning state.** Enrollments, roadmaps, unlocks, attempts, scores, weak topics, revisions, and content lifecycle are persisted in MongoDB.
- **Courses own curriculum.** Topics, lessons, questions, project tasks, interview practice, and roadmap templates are scoped to a Course.
- **Technologies classify content.** A learner can start a Course directly without selecting a programming language first.
- **Deterministic learning features do not require AI.** Authentication, onboarding, template roadmaps, lessons, quizzes, projects, interview attempts, progress, and admin content management remain available when Gemini is disabled.
- **AI output is labelled honestly.** Provider failures fall back to stored course guidance without presenting fallback content as generated analysis.
- **The codebase stays junior-friendly.** Data loading uses React hooks and Axios, backend workflows stay in Express services, and infrastructure is intentionally kept small.

## Main capabilities

### Learners

- Registration, email verification, login, password recovery, and session invalidation
- Course and Learning Path catalog
- Beginner, intermediate, and advanced entry levels
- Preferences and optional course-specific diagnostics
- Versioned template or assessment-personalized roadmaps
- Ordered modules, lesson completion, and module quizzes
- Weak-topic and revision tracking
- Contextual Gemini Mentor with saved course explanations as fallback
- Project tasks and interview practice with bounded attempts
- Dashboard, progress, and weekly reports
- Multiple independent enrollments with current-course switching

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

Admin content uses a consistent lifecycle: active/draft/published content is archived before permanent deletion, parent Course lifecycle actions cascade through Course-owned curriculum, and dependency blockers provide clear resolution instructions.

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

### Backend

- JavaScript
- Node.js
- Express
- MongoDB and Mongoose
- Zod
- JWT authentication with HTTP-only cookies
- Nodemailer-compatible SMTP delivery
- Google Gemini API
- In-process memory cache

## Repository layout

```text
backend/
  src/
    ai/               Gemini integration and learning-context retrieval
    controllers/      HTTP request/response orchestration
    services/         Domain workflows and data integrity
    models/           Mongoose schemas and indexes
    routes/           Authenticated and role-scoped routes
    validations/      Zod request validation
  test/unit/          Backend contract and policy tests

frontend/
  src/
    api/              Axios clients grouped by domain
    queries/          Domain data hooks built with React hooks
    hooks/            Shared async/data hooks and app hooks
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

Health endpoints:

- `GET /health`
- `GET /health/ready`

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

Gemini-assisted features include roadmap adjustment, Mentor answers, quiz explanations, project reviews, interview feedback, and weekly summaries. Each feature keeps an honest stored/deterministic fallback where appropriate.

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
- Persistence: `MONGO_URI`, optional MongoDB transactions
- Cache: `ENABLE_CACHE` and cache TTL values
- AI: Gemini configuration, limits, and timeouts
- Email: SMTP settings and sender addresses
- Frontend API: optional `VITE_API_BASE_URL`

Never commit real credentials or production `.env` files.

## Further documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Junior project scope](docs/JUNIOR_PROJECT_SCOPE.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
