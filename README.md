# CodeMentor AI

CodeMentor AI is a full-stack MERN + AI personalized learning platform. Learners choose a goal, select their level, receive a roadmap, study lessons, take quizzes, track weak topics, and use an AI mentor. The app is intentionally built as a portfolio/interview project with production-style architecture, not just a CRUD demo.

## v2 Upgrade Included

This ZIP includes the first v2 upgrade sprint:

- Stronger learner dashboard with today’s plan, recommendations, revision due, and roadmap versions
- Assessment diagnostic report before roadmap generation
- Roadmap versioning: template roadmap first, personalized versions later
- Recommendation service for next actions
- Weak-topic severity: low, medium, high, critical
- Revision planner generated from weak topics
- Personalized-later flow for intermediate/advanced users who skip the test
- AI remains optional and uses a mock provider by default

## Main Workflow

### Beginner

1. Choose `Junior MERN Stack Developer`
2. Choose `Beginner`
3. Fill preference form
4. App creates a beginner template roadmap
5. AI can adjust pace/style when enabled
6. Learner starts from fundamentals

### Intermediate

1. Choose `Intermediate`
2. Assessment is recommended but optional
3. If skipped, learner gets a standard intermediate roadmap
4. If taken, learner sees a diagnostic report first
5. Learner generates a personalized roadmap version from the report

### Advanced

1. Choose `Advanced`
2. Diagnostic is recommended but skippable
3. If skipped, learner gets a standard advanced roadmap
4. Learner can personalize later from dashboard

## Tech Stack

### Frontend

- React
- React Router
- TanStack Query
- Axios
- Tailwind CSS
- Recharts
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT with HTTP-only cookies
- Redis config
- BullMQ queue structure
- AI provider abstraction

## Important Architecture Decisions

### AI is optional

The project runs without real OpenAI/Gemini keys.

Default mode:

```env
ENABLE_AI=false
AI_PROVIDER=mock
```

This keeps the project cheap and runnable while preserving AI architecture.

### Admin content is the source of truth

The app does not depend on AI to invent all content. Lessons, questions, and roadmap templates are stored in MongoDB and seeded through the backend seed script.

### Roadmap versioning

Each generated roadmap gets a version:

- v1: initial template roadmap
- v2: assessment-personalized roadmap
- v3: future weak-topic-based roadmap

Older versions are archived but kept for history.

### Weak-topic intelligence

Weak topics track:

- topic
- source
- score
- attempts
- severity
- last detected date

Weak topics automatically create revision planner items.

## Local Setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

Backend runs on:

```txt
http://localhost:5000
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on:

```txt
http://localhost:5173
```

## Demo Users

Admin:

```txt
admin@codementor.ai
Admin@123
```

Learner:

```txt
learner@codementor.ai
Learner@123
```

## Docker

A Docker setup is included for later learning.

```bash
docker compose up --build
```

## Environment Variables

Backend `.env.example` includes:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/codementor_ai
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
COOKIE_SECURE=false
REDIS_URL=redis://localhost:6379
ENABLE_QUEUE=true
AI_PROVIDER=mock
ENABLE_AI=false
ENABLE_RAG=false
DAILY_MENTOR_LIMIT=10
DAILY_ROADMAP_LIMIT=1
DAILY_QUIZ_EXPLANATION_LIMIT=3
```

## What To Study First

Recommended order:

1. Auth flow
2. Onboarding flow
3. Roadmap template generation
4. Assessment diagnostic report
5. Progress and weak-topic tracking
6. Recommendation service
7. Revision planner
8. AI mentor mock provider
9. Admin content system
10. Redis/BullMQ structure

## Future v3 Improvements

Recommended next upgrades:

- Real BullMQ roadmap generation status screen
- Admin job monitoring page
- Activity logs
- Backend tests with Jest/Supertest
- Swagger API documentation
- Optional MongoDB Atlas Vector Search/RAG

## Portfolio Summary

> Built CodeMentor AI, a MERN + AI personalized learning platform with level-based onboarding, optional diagnostics, roadmap versioning, lessons, quizzes, weak-topic analytics, revision planning, AI mentor support, admin content management, and production-style backend architecture.

## v2 Sprint 2 AI Upgrade

Sprint 2 makes the AI layer feel like part of the learning product instead of a generic chatbot. The app still runs in `AI_PROVIDER=mock` mode by default, so no paid API key is required.

### Added in Sprint 2

- Contextual AI mentor responses using:
  - active roadmap and level
  - current lesson and module
  - weak topics
  - recent quiz mistakes
  - related lesson content
- Suggested mentor prompts:
  - Explain simply
  - Real project example
  - Interview answer
  - Practice question
  - Explain my mistake
  - Revision notes
- Basic lesson retrieval/citation flow:
  - search matching lesson titles, tags, theory, and explanations
  - attach top lesson sources to mentor answers
  - display "Context used" chips in the chat UI
- AI quiz mistake explanation:
  - user can request an AI explanation from the quiz result page
  - explanation uses wrong answers, weak topics, user level, and related lessons
  - saved on the quiz attempt
- Richer AI usage logs:
  - provider/model
  - token estimates
  - latency
  - prompt fingerprint
  - context source count
  - metadata for debugging

### Why this matters

This upgrade improves the interview value of the project because AI is now connected to real product state. The mentor is no longer just answering a raw message; it receives structured learning context from the backend and records usage for cost/rate-limit awareness.


## v2 Sprint 3 Project + Interview Upgrade

Sprint 3 adds the features that make CodeMentor AI feel less like a course dashboard and more like a serious learning product.

### Added in Sprint 3

- Project-based learning module:
  - learner can browse practical MERN project tasks
  - tasks include requirements, hints, expected output, and evaluation checklist
  - learner can submit code, pseudocode, or explanation
- AI project submission review:
  - AI reviews the submission against the task checklist
  - feedback includes score, strengths, improvements, and detected weak topics
  - weak topics from project submissions update learner progress
- Interview practice mode:
  - learner chooses MERN interview questions
  - learner writes an answer
  - AI reviews the answer with score, expected answer, strengths, and improvements
  - weak topics from interview answers update progress
- New frontend pages:
  - `/projects`
  - `/projects/:taskId`
  - `/interview`
- New backend modules:
  - `ProjectTask`
  - `ProjectSubmission`
  - `InterviewQuestion`
  - `InterviewAttempt`
  - project service/controller/routes
  - interview service/controller/routes
- New AI usage features:
  - `project_review`
  - `interview_feedback`
  - daily limits for both features

### Why Sprint 3 matters

This upgrade improves interview value because the app now supports a full learning loop:

```txt
Study lesson
↓
Take quiz
↓
Detect weak topics
↓
Practice project task
↓
Submit implementation
↓
Receive AI review
↓
Practice interview answer
↓
Track improvement
```

This is stronger than a normal course platform because it combines learning content, practical tasks, AI feedback, interview preparation, and progress intelligence.

### New environment variables

```env
DAILY_PROJECT_REVIEW_LIMIT=5
DAILY_INTERVIEW_FEEDBACK_LIMIT=5
```

### Updated study order

After understanding Sprint 1 and Sprint 2, study Sprint 3 in this order:

1. `ProjectTask` model
2. `ProjectSubmission` model
3. `project.service.js`
4. `/api/projects` routes
5. Projects frontend pages
6. `InterviewQuestion` model
7. `InterviewAttempt` model
8. `interview.service.js`
9. `/api/interview` routes
10. Interview frontend page
11. How project/interview weak topics update progress

## v2 Sprint 4 Admin CMS Upgrade

Sprint 4 upgrades the admin side from a basic create/list interface into a more production-like content management system.

### Added in Sprint 4

- Admin content lifecycle:
  - `draft`
  - `published`
  - `archived`
- Lesson CMS improvements:
  - create lesson
  - edit lesson
  - publish/unpublish lesson
  - archive lesson
  - search lessons
  - filter by topic, difficulty, and status
  - paginated API responses
- Question CMS improvements:
  - create question
  - edit question
  - publish/unpublish question
  - archive question
  - search questions
  - filter by topic, difficulty, type, and status
  - paginated API responses
- Roadmap template CMS improvements:
  - create template
  - edit template
  - duplicate template
  - publish/unpublish template
  - archive template
  - search/filter/pagination
  - editable module JSON schema
- Topic management improvements:
  - edit topics
  - delete unused topics safely
  - pagination and search
- Admin list APIs now support:
  - `page`
  - `limit`
  - `search`
  - `status`
  - `difficulty`
  - `topic`
  - `type`
  - `role`
- Users and AI usage logs now use pagination/filtering instead of loading everything at once.

### Why Sprint 4 matters

This upgrade improves interview value because learning platforms depend heavily on content quality and content operations. A real admin CMS needs lifecycle states, editing, search, filtering, pagination, and safe archiving. This is much closer to how production content systems work than a simple CRUD page.

### New study order after Sprint 4

1. Admin route protection
2. Admin pagination utility
3. Lesson status lifecycle
4. Lesson CMS frontend flow
5. Question CMS frontend flow
6. Roadmap template schema and JSON modules
7. Template duplicate/publish/archive flow
8. Users and AI usage pagination
9. How admin CMS controls learner-facing content

## Updated Future Improvements After Sprint 4

Recommended next upgrades:

- Real BullMQ roadmap generation status screen
- Admin job monitoring page
- Activity logs/audit trail
- Backend tests with Jest/Supertest
- Swagger API documentation
- Stronger auth: refresh rotation, logout all devices, password reset mock flow
- Optional MongoDB Atlas Vector Search/RAG

## v2 Sprint 5 — Backend Architecture Upgrade

Sprint 5 makes the project feel more production-oriented on the backend while preserving the existing UI/UX style.

### Added in Sprint 5

- **Queue-backed roadmap generation flow**
  - Roadmap personalization can now create an `AIJob` record.
  - If Redis/BullMQ is enabled, the job is queued and processed by the worker.
  - If Redis is unavailable or queues are disabled, the app falls back to synchronous generation so local development still works.

- **Roadmap generation status screen**
  - The frontend can poll `/api/roadmaps/jobs/:jobId`.
  - The generating page shows queued, processing, completed, or failed status.

- **Admin job monitoring**
  - New admin page: `/admin/jobs`
  - Admins can search and filter background jobs by status/type.
  - Job records show attempts, output, errors, and user details.

- **Activity log / audit trail**
  - New model: `ActivityLog`
  - New admin page: `/admin/activity`
  - Tracks important events such as login, lesson completion, quiz submission, roadmap generation, mentor questions, project submissions, and admin CMS changes.

- **Auth/security improvements**
  - Refresh-token rotation with token versioning.
  - `/api/auth/refresh-token`
  - `/api/auth/logout-all`
  - Mock password reset endpoints for demo/learning.
  - Frontend Axios interceptor attempts token refresh before failing a 401 request.

- **Docker worker service**
  - `docker-compose.yml` now includes a separate `worker` service for BullMQ workers.

### Sprint 5 study order

1. Start with `backend/src/services/job.service.js`.
2. Then study `backend/src/workers/roadmap.worker.js`.
3. Review the `AIJob` and `ActivityLog` models.
4. Study `/admin/jobs` and `/admin/activity` pages in the frontend.
5. Finally review token refresh logic in `auth.service.js`, `token.service.js`, and `axiosInstance.js`.

### Running workers locally

In one terminal:

```bash
cd backend
npm run dev
```

In another terminal, if Redis is running and `ENABLE_QUEUE=true`:

```bash
cd backend
npm run worker
```

Or use Docker:

```bash
docker compose up --build
```

## v2 Sprint 9 Notes — Caching, Performance, and Data Integrity

This sprint adds production-style caching and data-integrity hardening before the final test/docs polish stage.

- Added cache key helpers, cache TTL constants, and `getOrSetCache`.
- Cached dashboard payloads, roadmap templates, resolved template modules, project task lists, interview question lists, and admin analytics.
- Added content-cache invalidation after admin content changes.
- Added user-learning cache invalidation after lesson completion, quiz attempts, mentor interactions, project reviews, interview feedback, and roadmap generation.
- Added reusable active-course/data-integrity helpers for lesson/module/question ownership checks.
- Added stronger database indexes for high-traffic query paths.
- Added revision-item completion/skipping flow.
- Added frontend query stale-time constants and more consistent cache invalidation.

Tests and full API docs are intentionally kept for the final project polish stage.
