# Junior MERN project scope

CodeMentor AI is intentionally maintained as a strong junior-level MERN portfolio project. The goal is to demonstrate correct full-stack development, secure APIs, MongoDB data modelling, practical React state/data handling, optional Gemini integration, testing, and deployment without unnecessary infrastructure.

## Project rule

Every feature, bug fix, refactor, and new piece of code must stay explainable and believable for a junior MERN developer.

Before implementing a requested change, first decide whether it can be solved within junior-level scope. If it can, use the simplest normal React, Express, Mongoose, MongoDB, and JavaScript solution that keeps the product correct. If the requested solution would require advanced engineering such as distributed locking, complex concurrency control, event-driven infrastructure, migrations/backfills, custom frameworks, or enterprise architecture, call that out before implementation instead of silently adding it.

Prefer clear business rules and straightforward sequential code over perfect handling of rare production-scale edge cases that are outside this portfolio project's scope.

## Included engineering scope

The project demonstrates:

- React, React Router, Axios, forms, validation, loading, error, locked, and fallback states
- Plain React hooks for server-data loading and mutation state
- Express routes, controllers, services, middleware, and centralized errors
- MongoDB and Mongoose schemas, references, indexes, and straightforward CRUD rules
- Cookie-based JWT authentication, refresh rotation, CSRF protection, CORS, rate limiting, email verification, and password recovery
- Course/Learning Path onboarding, Roadmap Templates, CoursePlans, quiz scoring, revisions, projects, interviews, and reports
- Course-owned curriculum with backend ownership/dependency validation
- Simple two-attempt limits for Projects and Interview practice
- Optional Gemini features with daily/input limits, response schemas, and honest scoreless fallbacks
- Focused unit/source-contract tests and a repeatable release-check command

## Reliability rules

- Mentor Lesson context must belong to the authenticated learner's active CoursePlan.
- Learner requests must resolve one explicit current Enrollment so Dashboard, Roadmap, Lessons, Projects, Interview, Reports, and Mentor stay on the same Course.
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

The current authentication model supports one active refresh-token chain per user. Logging in again may invalidate an earlier browser session. This is acceptable for the project scope and should be explained clearly during interviews.

## Before demonstrating or deploying

Install dependencies, then run:

```bash
node scripts/release-check.mjs
```

Manually verify registration, verification, login, onboarding resume, Course/Learning Path selection, roadmap creation, Lesson completion, Quiz scoring, Mentor handoff, Project/Interview attempts, AI-disabled fallbacks, reports, enrollment switching, admin lifecycle operations, and logout-all-devices.

The project should be evaluated by whether these flows are correct, understandable, and deployable—not by how much infrastructure it contains.
