# Architecture

## System overview

CodeMentor AI is a React single-page application backed by an Express API and MongoDB.

```text
Browser
  └─ React Router pages
      └─ React data hooks
          └─ Axios
              └─ Express routes
                  └─ Controllers
                      └─ Services
                          ├─ MongoDB / Mongoose
                          ├─ In-process memory cache
                          ├─ SMTP delivery (optional)
                          └─ Gemini (optional)
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

Technology classifies Courses. Course is the central learning unit. Learning Paths reference ordered Courses without owning them. Learner state belongs to Enrollment and CoursePlan.

## Frontend

- `src/api/` contains Axios wrappers grouped by domain.
- Domain data hooks load API data with normal React state/effects.
- `useAsyncData` exposes data, loading, error, and refetch state.
- `useAsyncAction` runs writes and refreshes mounted data after success.
- React Router handles public, onboarding, learner, and admin routes.
- React Hook Form and Zod handle forms and validation.
- Loading, empty, error, unavailable, locked, and archived states are shown explicitly.

The Mentor page renders messages as normal pre-wrapped text and uses one effect to scroll to the latest message.

## Backend

Express routes apply authentication, role checks, rate limits, request validation, and controllers. Controllers call service functions for domain work.

Services handle:

- Authentication and password/email flows
- Course and Learning Path onboarding
- Assessment grading
- Roadmap creation
- Lesson completion and quizzes
- Progress and revisions
- Two-attempt project/interview practice
- Mentor context lookup
- Admin content lifecycle rules

MongoDB stores users, catalog entities, curriculum, enrollments, CoursePlans, progress, attempts, revisions, chats, reports, and basic AI usage records.

## Core flows

### Roadmap generation

1. Load the learner's current Enrollment.
2. Load the published Course + level Roadmap Template.
3. Optionally ask Gemini to adjust module wording/order.
4. Archive the previous active CoursePlan if one exists.
5. Create the new CoursePlan and Progress record.
6. Mark onboarding complete and return the roadmap.

The flow uses normal sequential Mongoose operations.

### Project and interview attempts

Each task/question allows two attempts:

1. Count the learner's existing attempts.
2. Reject the request when two attempts already exist.
3. Otherwise create attempt 1 or attempt 2.
4. Save Gemini review when available, or scoreless fallback guidance when unavailable.

### Mentor context

The Mentor uses the active CoursePlan, current Lesson, recent quiz mistakes, weak topics, and simple keyword matching against published Lessons from the same Course. This is normal MongoDB content lookup, not a separate retrieval infrastructure.

## Admin lifecycle

All admin content follows:

```text
Draft / Published / Active
          ↓
       Archive
          ↓
       Archived
       ↙      ↘
   Restore    Delete
```

- Permanent deletion requires Archived state.
- Archiving a Course archives its owned Topics, Lessons, Questions, Projects, Interview Questions, and Roadmap Templates.
- Restoring a Course returns the Course and publishable children to Draft; Topics become Active.
- Lower-level actions never change their parent.
- Technology, Learning Path, and prerequisite references do not cascade and may block an action.
- Blocked actions return a clear reason and a simple resolution instruction.

## Gemini

Gemini integration keeps only the application-level behavior needed by learners:

- daily per-feature limits
- maximum input lengths
- response validation where structured JSON is required
- simple success/failure usage records
- deterministic/stored fallback content when Gemini is unavailable

## Cache and health

The cache is a small in-process JavaScript `Map` for short-lived reads. The application remains correct with caching disabled.

- `/health` reports process liveness.
- `/health/ready` checks MongoDB and configured optional services.
