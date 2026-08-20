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
                              ├─ Brevo email API (optional)
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
- Learner/admin pages share `SiteLayout`; public pages use `PublicLayout` for public-page spacing.
- React Hook Form and Zod handle forms and validation.
- Loading, empty, error, unavailable, locked, and archived states are shown explicitly.
- The Dashboard provides the learner Course/Enrollment switcher and new-enrollment entry point.

There is no custom query layer, global data-refresh bus, frontend server-response cache, or third-party server-state library.

The Mentor page renders messages as normal pre-wrapped text and uses one effect to scroll to the latest message.

## Backend

Express routes apply authentication, role checks, rate limits, request validation, and controllers. Learner-only routers require the learner role, while `/api/admin` requires the admin role. Controllers call service functions for domain work.

Services handle:

- Authentication and password/email flows
- Fresh isolated demo-account provisioning
- Course and Learning Path onboarding
- Current Enrollment selection
- Assessment grading
- Roadmap creation and retry recovery
- Lesson completion and Learning Path course advancement
- Quizzes, progress, and revisions
- Two-attempt Practice/Interview flows
- Mentor learning-context lookup
- Admin content lifecycle rules

MongoDB stores users, catalog entities, curriculum, Enrollments, CoursePlans, Progress, attempts, Revisions, chats, reports, and basic AI usage records.

There is no application cache, queue/worker layer, repository layer, event bus, migration framework, or transaction-heavy workflow.

## Core flows

### Current learner Course

1. A learner may have multiple active/completed Enrollments.
2. `User.currentEnrollment` identifies the Enrollment currently used by learner pages.
3. Dashboard, Roadmap, Lessons, Quizzes, Revisions, Mentor, Practice, Interview, and Reports resolve data through that Enrollment.
4. The learner can switch Enrollment from the Dashboard after confirmation.
5. The Dashboard can send the learner through the existing onboarding flow to add another Course or Learning Path.
6. If the current pointer is missing or invalid, the backend resolves an appropriate active/completed Enrollment.

### Fresh demo account

1. The Login page requests a fresh demo account only after the user clicks the demo action.
2. The backend creates a unique verified `isDemo` learner with generated credentials.
3. The backend creates a Beginner Complete JavaScript Enrollment and uses the normal template roadmap service to prepare the starter roadmap and Progress.
4. If provisioning fails after the demo User is created, the backend removes the partial demo Progress, CoursePlan, Enrollment, and User records before returning the error.
5. The generated credentials are returned to the Login page and filled into the normal form.
6. The visitor logs in through the same normal authentication flow as every other learner.
7. Because each demo request creates a separate User and Enrollment, changes made by one visitor do not affect another visitor.

### Onboarding

The current learner setup flow is intentionally small:

```text
Catalog
  ↓
Level
  ↓
Beginner ───────────────→ Roadmap
  ↓
Intermediate / Advanced
  ↓
Optional Skill Check
  ↓
Roadmap
```

There are no Preferences or Goal onboarding pages. The server returns the current onboarding state and next path so refresh/retry behavior stays deterministic.

### Roadmap generation

1. Load the learner's selected Enrollment and current Course.
2. Load the published Roadmap Templates from Beginner through the learner's selected level.
3. Build one cumulative roadmap so lower-level modules remain available for revision.
4. If a completed skill check exists, map verified weak topics to real Lessons/modules in the cumulative roadmap.
5. Mark matched modules as high priority and store the weak-topic scores.
6. Optionally ask Gemini for short explanatory text for those already-verified focus areas.
7. Archive the previous active CoursePlan for the same Course when creating a replacement version.
8. Create the new CoursePlan and carry forward matching completed Lesson IDs.
9. Ensure Progress exists, mark onboarding complete, and set the Enrollment as current.

The backend owns module selection and priority. Gemini cannot rename/reorder modules or invent which modules are weak.

CoursePlan keeps a simple numeric `version`. Previous versions remain archived for progress carry-over/history in MongoDB, but there is no separate learner roadmap-history API or linked `parentCoursePlan` chain.

### Learning Path progression

When all current-level Lessons in the current Learning Path Course are complete:

1. Archive that CoursePlan when another Course follows.
2. Set `Enrollment.currentCourse` to the next ordered Course.
3. Use that path entry's `defaultLevel` when configured; otherwise keep the Enrollment level.
4. Set onboarding to `roadmap_pending`.
5. Send the learner through the normal roadmap generation request for the next Course.
6. If there is no next Course, mark the Learning Path Enrollment completed.

Learning Path advancement is implemented in the active progress workflow; there is no parallel progression service.

### Practice and interview attempts

Each task/question allows two attempts:

1. Count the learner's existing attempts.
2. Reject the request when two attempts already exist.
3. Otherwise create attempt 1 or attempt 2.
4. Save Gemini review when available, or scoreless fallback guidance when unavailable.

Practice Tasks and Interview Questions are filtered to the learner's current Course and allowed level.

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
- Archiving a Course archives its owned Topics, Lessons, Questions, Practice Tasks, Interview Questions, and Roadmap Templates.
- Restoring a Course returns the Course and publishable children to Draft; Topics become Active.
- Quiz Questions used by active learner roadmaps cannot be archived independently.
- Lower-level actions never change their parent.
- Technology, Learning Path, and prerequisite references do not cascade and may block an action.
- Technology hierarchy is intentionally limited to one parent level.
- Published Learning Paths and Course level settings are checked for compatibility.
- Blocked actions return a clear reason and a simple resolution instruction.

The admin content services are split by real content domain (catalog, lessons, questions, templates, dependency lifecycle, etc.). This keeps the standard route → controller → service → model flow without adding repository/event-bus architecture.

## Gemini

Gemini integration keeps only the application-level behavior needed by learners:

- daily per-feature limits
- maximum input lengths from the single validated environment configuration
- response validation where structured JSON is required
- simple best-effort success/failure usage records
- deterministic/stored fallback content when Gemini is unavailable

Assessment scoring and roadmap focus selection remain valid even when Gemini is disabled or fails. Gemini is an explanation/review layer, not the source of learning-state truth.

## Email

Verification and password-reset templates remain application-owned. When email delivery is enabled, the backend sends them through Brevo's transactional email REST API using `BREVO_API_KEY`, sender details, and the existing `sendEmail` wrapper. When delivery is disabled in development, the existing development-link logging fallback can be used.

## Health

`GET /health` is the single lightweight health endpoint. MongoDB connection failures are handled during application startup rather than through a separate readiness architecture.
