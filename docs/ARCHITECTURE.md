# Architecture

## System overview

CodeMentor AI is a React single-page application backed by an Express API and MongoDB.

```text
Browser
  └─ React Router pages
      └─ React domain data hooks
          └─ Axios
              └─ Express routes and middleware
                  └─ Controllers
                      └─ Domain services
                          ├─ MongoDB / Mongoose
                          ├─ In-process memory cache
                          ├─ SMTP delivery (optional)
                          └─ Gemini + learning context (optional)
```

## Product hierarchy

```text
Technology ↔ Course
                ↓
              Level
                ↓
        RoadmapTemplate
                ↓
             Modules
                ↓
       Course-owned content

LearningPath
    ↓
Ordered Courses

User
    ↓
Enrollment
    ↓
CoursePlan / Progress
```

Technology is catalog classification. Course is the central learning unit. Learning Paths reference ordered Courses without owning them. Learner runtime state belongs to Enrollment and CoursePlan.

## Frontend architecture

### Routing and access control

- Public routes contain landing, authentication, verification, and recovery screens.
- Protected learner routes require authentication.
- `OnboardingGuard` loads server onboarding status before allowing setup or course routes.
- Admin routes require the `admin` role and use a separate content-management layout.

The browser does not decide whether onboarding is complete, whether a module is locked, or whether an attempt is available. It renders server-owned state.

### Data access

- `src/api/` contains small Axios wrappers grouped by domain.
- `src/queries/` contains domain hooks implemented with normal React hooks.
- `useAsyncData` loads server data and exposes loading/error/refetch state.
- `useAsyncAction` runs writes and triggers a simple refresh signal after success.
- `DataRefreshContext` tells currently mounted data hooks to reload after successful writes.
- There is no frontend server-response cache. Pages load current server data when mounted or refreshed.
- The Axios instance sends credentialed cookies, obtains CSRF tokens for protected writes, performs the application refresh-token flow, and normalizes API errors.

### UI and domain contracts

- Shared components use semantic design tokens.
- Loading, empty, error, unavailable, locked, and archived states are explicit.
- Expected interview answers are gated until an attempt is saved.
- Fallback project/interview reviews remain scoreless.

## Backend architecture

### Request pipeline

The Express application applies security, CORS, parsing, request logging, rate limiting, CSRF protection, domain routes, not-found handling, and centralized error handling.

Routes compose authentication, role checks, rate limits, validation, and controllers. Controllers delegate domain behavior to services.

### Service layer

Services own:

- Authentication and token rotation
- Course/Learning Path onboarding
- Assessment grading and reports
- Roadmap creation and versioning
- Lesson completion and module unlocking
- Quiz scoring and weak-topic merging
- Revision scheduling
- Project/interview attempt limits and reviews
- Mentor context assembly
- Admin content lifecycle validation
- Cache invalidation

### Persistence

MongoDB stores users, catalog entities, course-owned curriculum, enrollments, course plans, progress, attempts, revisions, chats, reports, and AI usage records.

Important integrity rules include:

- One active CoursePlan per Enrollment
- Course-scoped curriculum references
- Unique project/interview attempt slots
- Published-content validation before learner exposure
- Archive-before-delete lifecycle rules
- Parent Course lifecycle cascading only through Course-owned content

## Core flows

### Authentication

1. Registration creates an unverified user and verification token.
2. Email delivery uses SMTP or development log mode.
3. Login requires verified credentials.
4. Access and refresh tokens are stored in HTTP-only cookies.
5. Protected writes require CSRF validation.
6. Refresh rotates session state; logout-all invalidates sessions.

### Onboarding and roadmap generation

1. Learner chooses a Course or Learning Path.
2. Learner chooses an available level and preferences.
3. Intermediate/advanced learners may take or skip a Course-specific diagnostic.
4. The server persists onboarding state and returns the next route.
5. Roadmap creation happens directly in the request using the published Course + level template and optional Gemini adjustment.
6. The new CoursePlan is persisted, Progress is created, and the learner is redirected to the Dashboard.
7. A later diagnostic can create a new active roadmap version while retaining earlier versions.

### Lessons, quizzes, and progress

1. Only Lessons in the active CoursePlan can be opened.
2. Completing module Lessons unlocks later work according to the roadmap rules.
3. Module quizzes use the server-provided question set.
4. Scoring is deterministic from stored answers.
5. Wrong answers update quiz statistics, weak topics, and revision items.
6. Dashboard and Progress pages read persisted CoursePlan/Progress state.

### Projects and interview practice

- Each task/question has bounded atomic attempt slots.
- The learner answer/submission is saved before review.
- Successful Gemini review may save a score and weak-topic signals.
- Provider failure stores scoreless fallback guidance.
- Retrying review reuses the saved attempt.

### Mentor and retrieval

The Mentor builds bounded context from the active CoursePlan, current Lesson, weak topics, quiz history, and matching published Lesson content. When Gemini is unavailable, saved explanations remain available instead of fabricating live AI output.

## Cache behavior

The cache is a small in-process JavaScript `Map` used for short-lived dashboard/content reads. Writes invalidate affected cache prefixes. The application remains correct with caching disabled.

## Admin lifecycle

All admin content follows the same deletion rule:

```text
Draft / Published / Active
          ↓
       Archive
          ↓
       Archived
       ↙      ↘
   Restore    Delete
```

Course lifecycle actions cascade downward through Course-owned content. Lower-level content actions do not change parents. Technology, Learning Path, and prerequisite references do not cascade and may block an operation with a clear resolution message.

## Operational health

- `/health` reports process liveness.
- `/health/ready` reports required MongoDB readiness and optional email/Gemini configuration.
- The API handles termination signals and closes the HTTP server and MongoDB connection cleanly.
