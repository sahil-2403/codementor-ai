# Junior MERN project scope

CodeMentor AI is intentionally maintained as a strong junior-level MERN portfolio project. The goal is to demonstrate correct full-stack development, secure APIs, MongoDB data modelling, practical React state/data handling, optional Gemini integration, testing, and deployment without unnecessary infrastructure.

## Final project rule

**Hireflow (`sahil-2403/Hireflow`, current `main`) is the architecture and complexity ceiling for CodeMentor AI.**

CodeMentor may use simpler code than Hireflow, but it must not introduce architecture, infrastructure, abstractions, security flows, state-management patterns, or backend concepts that are more advanced than the patterns already used in Hireflow unless the project scope is explicitly changed by the user.

Before implementing any requested feature, bug fix, or refactor:

1. First decide whether the change can be implemented within the current junior/Hireflow scope.
2. If it can, use the simplest normal React, Axios, Express, Mongoose, MongoDB, and JavaScript solution that keeps the feature correct.
3. If it would require architecture beyond Hireflow, explain that before implementation and do not add the advanced solution unless the user explicitly chooses to raise the project scope.

Prefer clear business rules and straightforward sequential code over perfect handling of rare production-scale edge cases that are outside this portfolio project's scope.

## Reference architecture

The preferred request flow follows the same foundation as Hireflow:

```text
Frontend
Page / Component
  -> local useState + useEffect
  -> API wrapper
  -> Axios
  -> Express

Backend
Route
  -> validation / authentication / role middleware
  -> Controller
  -> Service
  -> Mongoose Model
```

Feature-owned code should stay easy to trace. Shared middleware and utilities are used only when they are genuinely reusable. Avoid adding abstraction layers only to make the project look more production-like.

## Included engineering scope

The project demonstrates:

- React, React Router, Axios, forms, validation, loading, error, locked, and fallback states
- Page-local React state/effects for API loading and mutation state
- Express routes, controllers, services, middleware, and centralized errors
- MongoDB and Mongoose schemas, references, indexes, and straightforward CRUD rules
- Cookie-based access/refresh JWT authentication with one token version, CSRF protection, CORS, rate limiting, email verification, and password recovery
- Course/Learning Path onboarding, Roadmap Templates, CoursePlans, quiz scoring, revisions, projects, interviews, and reports
- Multiple learner Enrollments with one explicit current Enrollment
- Simple sequential Learning Path course advancement
- Course-owned curriculum with backend ownership/dependency validation
- Simple two-attempt limits for Projects and Interview practice
- Optional Gemini features with daily/input limits, response schemas, and honest scoreless fallbacks
- Focused unit/source-contract tests and a repeatable release-check command

## Authentication boundary

Authentication should stay at the Hireflow level:

- short-lived access JWT in an HttpOnly cookie
- longer-lived refresh JWT in an HttpOnly cookie
- one `tokenVersion` on the User
- refresh verifies the refresh token and token version, then issues a new access token
- refresh tokens are not stored as hashes and are not rotated on every refresh
- logout clears browser cookies
- logout-all and password reset increment `tokenVersion` to invalidate existing sessions
- frontend session restoration uses `me -> refresh -> me`
- one Axios response interceptor retries a failed authenticated request once after refresh
- CSRF uses a simple token cookie/header comparison

Do not add refresh-token families, refresh-token databases, token reuse detection, device-session tables, distributed session stores, or similar systems unless the project scope is explicitly raised.

## Frontend data boundary

Normal feature data should follow the Hireflow pattern:

- API functions live in small API wrapper files
- pages/components use normal `useState`, `useEffect`, and event handlers
- mutations explicitly update local state or reload the data they need
- authentication may use AuthContext because it is shared application state

Do not add a custom server-state framework, global refresh bus, query-key system, application data cache, optimistic cache layer, or third-party server-state library.

## Backend boundary

Backend request handling should stay easy to trace:

- routes define middleware and controller
- controllers handle request/response work
- services contain feature business logic
- Mongoose models handle persistence
- small reusable helpers are acceptable where they remove real duplication

Do not add application caching, queues/workers, transaction-heavy flows, repository layers, event buses, command/query buses, dependency-injection frameworks, distributed locks, or migration/backfill infrastructure for this disposable demo database.

## Reliability rules

- Mentor Lesson context must belong to the authenticated learner's current CoursePlan.
- Learner requests must resolve one explicit current Enrollment so Dashboard, Roadmap, Lessons, Quizzes, Revisions, Projects, Interview, Reports, and Mentor stay on the same Course.
- Projects and Interview questions must belong to the learner's current Course.
- Learning Path completion must move the learner to the next configured Course with simple sequential state updates.
- Authentication and CSRF cookies share the configured security policy.
- Cookie lifetimes follow configured JWT durations.
- Successful AI review data is not replaced when later logging/progress work fails.
- Weekly reports are unique for each user, CoursePlan, and UTC week.
- User-controlled filters are validated and escaped before regular-expression matching.
- Frontend API calls use relative `/api` requests by default.
- Rendering failures show a recovery screen and unknown routes show a real not-found page.
- Admin permanent deletion always requires an Archived item first.
- Parent Course lifecycle actions cascade downward only through Course-owned content.
- A Course used by an active learner roadmap cannot be archived until that learner dependency is no longer active.
- A Quiz Question used by an active learner roadmap cannot be archived independently.

## Intentional limitations

The following are outside the scope of this portfolio project:

- Full CI/CD deployment automation
- Kubernetes or container orchestration
- Microservices
- Distributed application infrastructure
- Distributed tracing and enterprise monitoring stacks
- Multiple AI providers or agent frameworks
- A complete TypeScript rewrite
- Enterprise privacy/compliance automation
- Complex asynchronous processing infrastructure
- Sophisticated frontend server-response caching
- Migration/backfill infrastructure for disposable demo data
- Distributed locks or transaction-heavy concurrency control for rare simultaneous requests

The simple two-attempt check can theoretically be exceeded by truly simultaneous requests. The frontend prevents normal double submissions, and production-grade distributed/transaction locking is intentionally outside this project's scope.

Roadmap generation also uses a normal check-then-create request flow. It repairs an already-created roadmap if a normal retry occurs, but two truly simultaneous generation requests are not protected by distributed locks or database transactions. The UI prevents normal duplicate generation, and production-scale concurrency control is intentionally outside this project's scope.

## Before demonstrating or deploying

Install dependencies, then run:

```bash
node scripts/release-check.mjs
```

Manually verify registration, verification, login, onboarding resume, Course/Learning Path selection, roadmap creation, Lesson completion, Learning Path advancement, Quiz scoring, Mentor handoff, Project/Interview attempts, AI-disabled fallbacks, reports, enrollment switching, admin lifecycle operations, refresh recovery, logout, and logout-all-devices.

The project should be evaluated by whether these flows are correct, understandable, and deployable—not by how much infrastructure it contains.
