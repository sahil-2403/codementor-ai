# Architecture

## System overview

CodeMentor AI is split into a React single-page application and an Express API backed by MongoDB. Redis, BullMQ, SMTP, and Gemini are optional integrations rather than requirements for the deterministic learner workflow.

```text
Browser
  └─ React Router pages
      └─ TanStack Query hooks
          └─ Axios instance (cookies, CSRF, refresh retry)
              └─ Express routes and middleware
                  └─ Controllers
                      └─ Domain services
                          ├─ MongoDB / Mongoose
                          ├─ Cache abstraction (memory or Redis)
                          ├─ BullMQ jobs and workers (optional)
                          ├─ SMTP delivery (optional)
                          └─ Gemini + retrieval context (optional)
```

## Frontend architecture

### Routing and access control

- Public routes contain landing, authentication, verification, and recovery screens.
- Protected learner routes require an authenticated user.
- `OnboardingGuard` reads server onboarding status before allowing onboarding or course routes.
- Admin routes require the `admin` role and use a separate content-management layout.

The browser does not decide whether onboarding is complete, whether a module is locked, or whether an attempt is available. It renders the state returned by the API.

### Data access

- `src/api/` contains small HTTP wrappers grouped by domain.
- `src/queries/` owns TanStack Query keys, mutations, and cache invalidation.
- Write mutations invalidate the exact learner/admin data affected by the change.
- The Axios instance sends credentialed cookies, obtains CSRF tokens for protected writes, retries one expired session through refresh, and normalizes API errors.

### UI and domain contracts

- Shared components use semantic design tokens rather than page-specific colors.
- `domainEnums.js` mirrors API-facing status values and is checked against backend definitions by the frontend test suite.
- Loading, empty, error, unavailable, locked, and archived states are rendered explicitly.
- Expected interview answers are gated until an attempt is saved.
- Fallback project/interview reviews never display a score.

## Backend architecture

### Request pipeline

The Express application applies middleware in this order:

1. Request ID
2. Security headers
3. CORS
4. JSON and cookie parsing
5. Request logging
6. API rate limiting
7. CSRF protection
8. Domain routes
9. Not-found and centralized error handling

Routes compose authentication, role checks, rate limits, parameter/body validation, and controllers. Controllers remain thin and delegate learning behavior to services.

### Service layer

The service layer owns:

- Authentication and token rotation
- Onboarding state transitions
- Assessment grading and reports
- Template/AI roadmap creation and versioning
- Lesson completion and module unlocking
- Quiz scoring and weak-topic merging
- Revision scheduling
- Project/interview attempt limits and reviews
- Mentor context assembly
- Admin content lifecycle validation
- Cache invalidation and idempotency

### Persistence

MongoDB stores users, content, learning goals, course plans, progress, attempts, revisions, chats, reports, jobs, and AI usage logs. Mongoose schemas provide enum validation and indexes.

Important integrity rules include:

- One active learning goal per user
- One active course plan per user
- Unique project/interview attempt slots
- Unique roadmap job/idempotency keys
- Published-content validation before learner exposure
- Archived content is read-only

## Core flows

### Authentication

1. Registration creates an unverified user and a hashed verification token.
2. Email delivery uses SMTP or a development log mode.
3. Login requires verified credentials.
4. Access and refresh tokens are stored in HTTP-only cookies.
5. Protected writes require a CSRF token.
6. Refresh rotates the session token state; logout-all invalidates all sessions.

### Onboarding and roadmap generation

1. The learner chooses a goal and level.
2. Beginners provide preferences; intermediate/advanced learners may take or skip a diagnostic.
3. The server advances a persisted onboarding state and returns `nextPath`.
4. Roadmap generation reuses an existing result, runs synchronously, or creates an idempotent queue job.
5. A reliable template remains available when AI personalization cannot run.
6. Completing a personalized diagnostic can create a new active roadmap version while retaining history.

### Lessons, quizzes, and progress

1. Only lessons in the active course can be opened.
2. Completing all lessons in a module unlocks the next module.
3. A module quiz accepts the exact server-provided question set.
4. Scoring is deterministic from stored correct answers.
5. Wrong answers update quiz statistics, weak topics, and revision items.
6. Dashboard and progress responses are built from persisted course/progress records.

### Projects and interview practice

- Each task/question has two atomic attempt slots.
- The answer/submission is saved before review begins.
- A successful Gemini review may save a score and weak-topic signals.
- A provider failure saves scoreless fallback guidance and can be retried against the same attempt.
- Retry does not consume another attempt slot.

### Mentor and retrieval

When Gemini is configured, the mentor service builds bounded context from the current lesson, module, course, weak topics, recent quiz mistakes, and retrieved learning content. Input guards, usage limits, timeouts, and prompt fingerprints are applied before provider calls.

When Gemini is not configured or fails, freeform AI chat is not fabricated. The frontend exposes saved lesson/interview explanations instead.

## Cache and queue behavior

### Cache

The cache service supports memory and Redis drivers. Short-lived dashboard/content entries are invalidated after writes that change learner state or published content.

### Queues

BullMQ workers are optional and require Redis. The worker process can start:

- Roadmap generation
- Weekly report generation
- Learning-content embedding

Do not enable queues without running the worker. The API and UI expose queued, processing, completed, failed, retry, and fallback states rather than assuming background work succeeded.

## Admin content lifecycle

```text
Draft
  ├─ editable
  ├─ not learner-visible
  └─ publish requires explicit confirmation and validation

Published
  ├─ learner-visible
  ├─ cannot return to draft
  └─ may be archived

Archived
  ├─ removed from learner-facing selection
  └─ read-only history
```

Roadmap templates receive additional validation for goal/level uniqueness, module ordering, published lesson slugs, and quiz tags.

## Operational health

- `/health` reports process liveness.
- `/health/ready` reports dependency readiness and returns an unavailable status when required dependencies are not ready.
- The API and worker process handle termination signals for graceful shutdown.
