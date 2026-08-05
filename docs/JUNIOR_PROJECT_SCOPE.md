# Junior MERN project scope

CodeMentor AI is intentionally maintained as a strong junior-level MERN portfolio project. The goal is to demonstrate correct full-stack development, secure APIs, MongoDB data modelling, React server-state management, optional AI integration, testing, and deployment without introducing enterprise infrastructure that the project does not need.

## Included engineering scope

The project demonstrates:

- React, React Router, TanStack Query, forms, validation, loading, error, locked, and fallback states
- Express routes, controllers, services, middleware, and centralized errors
- MongoDB and Mongoose schemas, references, indexes, and atomic attempt limits
- Cookie-based JWT authentication, refresh rotation, CSRF protection, CORS, rate limiting, email verification, and password recovery
- Server-owned onboarding, roadmap progress, quiz scoring, revisions, projects, interviews, and reports
- Optional Gemini features with input limits, usage limits, response schemas, and honest scoreless fallbacks
- Optional Redis and BullMQ support for learning how queues and shared caching work
- Focused unit and source-contract tests plus a repeatable release-check command

## Reliability rules

- Mentor lesson context must belong to the authenticated learner's active roadmap.
- Authentication and CSRF cookies share the configured secure, SameSite, domain, and path policy.
- Cookie lifetimes follow the configured JWT durations.
- Project and interview reviews may be retried when a previous `reviewing` state is older than five minutes.
- Successful AI review data is not replaced when a later cache, logging, or progress update fails.
- Weekly reports are unique for each user, course, and UTC week.
- Weekly report generation uses AI limits when Gemini is available and deterministic fallback content otherwise.
- User-controlled interview topic filters are validated and escaped before regular-expression matching.
- The frontend uses relative `/api` requests by default; Vite proxies them to the local backend during development.
- Rendering failures show a recovery screen, unknown routes show a real not-found page, and page bundles are lazy loaded.

## Intentional limitations

The following are outside the scope of this portfolio project:

- Full CI/CD deployment automation
- Kubernetes, service meshes, or container orchestration
- Microservices
- Multi-device session management
- Distributed tracing and enterprise monitoring stacks
- Redis-backed infrastructure as a production requirement
- Multiple AI providers or agent frameworks
- A complete TypeScript rewrite
- Enterprise privacy and compliance automation
- Complex queue dashboards, dead-letter systems, or worker autoscaling

The current authentication model supports one active refresh-token chain per user. Logging in again may invalidate an earlier browser session. This is acceptable for the project scope and should be explained honestly during interviews.

## Before demonstrating or deploying

Run:

```bash
node scripts/release-check.mjs
```

Then manually verify registration, email verification, login, refresh, onboarding resume, roadmap creation, lesson completion, quiz scoring, project attempts, interview attempts, AI-disabled fallbacks, weekly reports, admin publishing, and logout-all-devices.

The project should be evaluated by whether these flows are correct, understandable, and deployable—not by whether it imitates enterprise infrastructure.
