# Architecture

## System overview

CodeMentor AI is a React single-page application backed by an Express API and MongoDB. Its architecture intentionally stays at the same complexity level as Hireflow.

```text
Browser
  └─ React Router page / component
      └─ local useState + useEffect
          └─ domain API wrapper
              └─ Axios
                  └─ Express route
                      └─ Controller
                          └─ Service
                              ├─ MongoDB / Mongoose
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
currentEnrollment
    ↓
Enrollment
    ↓
CoursePlan / Progress
```

Technology classifies Courses. Course is the central learning unit. Learning Paths reference ordered Courses without owning them. A learner may have multiple Enrollments, while `User.currentEnrollment` tells learner-facing requests which Enrollment and Course to use.

## Frontend

- `src/api/` contains small Axios wrappers grouped by domain.
- Pages and feature components load data with normal `useState`, `useEffect`, and event handlers.
- Writes call the relevant API wrapper and then update local state or reload the affected page data.
- Authentication is shared through `AuthContext`; one Axios response interceptor handles a single refresh retry after a 401.
- React Router handles public, onboarding, learner, and admin routes.
- React Hook Form and Zod handle forms and validation.
- Loading, empty, error, unavailable, locked, and archived states are shown explicitly.
- The Profile page provides the simple learner Course/Enrollment switcher.

There is no custom query layer, global data-refresh bus, frontend server-response cache, or third-party server-state library.

The Mentor page renders messages as normal pre-wrapped text and uses one effect to scroll to the latest message.

## Backend

Express routes apply authentication, role checks, rate limits, request validation, and controllers. Controllers call service functions for domain work.

Services handle:

- Authentication and password/email flows
- Course and Learning Path onboarding
- Current Enrollment selection
- Assessment grading
- Roadmap creation and simple retry recovery
- Lesson completion and Learning Path course advancement
- Quizzes, progress, and revisions
- Two-attempt Project/Interview practice
- Mentor learning-context lookup
- Admin content lifecycle rules

MongoDB stores users, catalog entities, curriculum, Enrollments, CoursePlans, Progress, attempts, Revisions, chats, reports, and basic AI usage records.

There is no application cache, queue/worker layer, repository layer, event bus, migration framework, or transaction-heavy workflow.

## Core flows

### Current learner Course

1. A learner may have multiple active/completed Enrollments.
2. `User.currentEnrollment` identifies the Enrollment currently used by learner pages.
3. Dashboard, Roadmap, Lessons, Quizzes, Revisions, Mentor, Projects, Interview, and Reports resolve data through that Enrollment.
4. The learner can switch Enrollment from Profile.
5. If an older user record has no current pointer, the backend chooses the latest active Enrollment, then falls back to the latest completed one.

### Roadmap generation

1. Load the learner's selected Enrollment.
2. Load the published Course + level Roadmap Template.
3. Optionally ask Gemini to adjust module wording/order.
4. Archive the previous active version for that same Course if one exists.
5. Create the new CoursePlan and Progress record.
6. Mark onboarding complete, set the Enrollment as current, and return the roadmap.
7. If a retry finds an existing CoursePlan, ensure its Progress record exists before returning it.

Roadmap versions are counted per Course inside the Enrollment. The flow uses normal sequential Mongoose operations.

### Learning Path progression

When all Lessons in the current Learning Path Course are complete:

1. Archive that CoursePlan when another Course follows.
2. Set `Enrollment.currentCourse` to the next ordered Course.
3. Use that path entry's `defaultLevel` when configured; otherwise keep the Enrollment level.
4. Set onboarding to `roadmap_pending`.
5. Send the learner through the normal roadmap generation request for the next Course.
6. If there is no next Course, mark the Learning Path Enrollment completed.

### Project and interview attempts

Each task/question allows two attempts:

1. Count the learner's existing attempts.
2. Reject the request when two attempts already exist.
3. Otherwise create attempt 1 or attempt 2.
4. Save Gemini review when available, or scoreless fallback guidance when unavailable.

Project Tasks and Interview Questions are always filtered to the learner's current Course.

### Mentor context

The Mentor uses the current CoursePlan, current Lesson, recent quiz mistakes, weak topics, and simple keyword matching against published Lessons from the same Course. This is normal MongoDB content lookup, not a separate retrieval or embedding system.

## Admin lifecycle

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
- A Course with active learner CoursePlans cannot be archived.
- Archiving a Course archives its owned Topics, Lessons, Questions, Projects, Interview Questions, and Roadmap Templates.
- Restoring a Course returns the Course and publishable children to Draft; Topics become Active.
- Quiz Questions used by active learner roadmaps cannot be archived independently.
- Lower-level actions never change their parent.
- Technology, Learning Path, and prerequisite references do not cascade and may block an action.
- Technology hierarchy is intentionally limited to one parent level.
- Published Learning Paths and Course level settings are checked for compatibility.
- Blocked actions return a clear reason and a simple resolution instruction.

## Gemini

Gemini integration keeps only the application-level behavior needed by learners:

- daily per-feature limits
- maximum input lengths
- response validation where structured JSON is required
- simple success/failure usage records
- deterministic/stored fallback content when Gemini is unavailable

Assessment completion and Gemini personalization are separate states: completing a diagnostic remains recorded even when Gemini falls back to the standard template.

## Health

`GET /health` is the single lightweight health endpoint. MongoDB connection failures are handled during application startup rather than through a separate readiness architecture.
