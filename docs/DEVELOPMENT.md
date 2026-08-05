# Development and operations

## Local processes

A typical local setup uses two processes:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

The frontend uses relative `/api` requests. Vite proxies them to `http://localhost:5000` during local development.

Add a third process only when queue support is enabled:

```bash
cd backend
npm run worker
```

## Installation

Use `npm ci` when reproducing the checked-in lockfile and `npm install` when intentionally changing dependencies.

```bash
cd backend && npm ci
cd ../frontend && npm ci
```

Copy both environment examples before starting the applications.

## Database and seed data

`npm run seed` is intended for local/demo databases. It clears application collections and recreates topics, lessons, questions, templates, tasks, and example accounts/content.

Before running it:

1. Confirm `MONGO_URI` points to the intended database.
2. Back up any data that must survive.
3. Never run it casually against production.

## Backend commands

```bash
npm run dev
npm start
npm run worker
npm run seed
npm test
npm run check:gemini
npm run migrate:attempt-numbers
npm run migrate:attempt-indexes
npm run migrate:roadmap-indexes
```

Run the number backfill before enforcing attempt indexes on an existing database.

## Frontend commands

```bash
npm run dev
npm test
npm run build
npm run preview
```

The frontend tests use `node:test`, so they run without a browser or extra testing packages. They protect cross-layer contracts; they do not replace manual responsive/accessibility testing.

## Feature modes

### Minimal deterministic mode

```env
ENABLE_AI=false
ENABLE_QUEUE=false
ENABLE_CACHE=true
CACHE_DRIVER=memory
EMAIL_ENABLED=false
ALLOW_DEV_EMAIL_LOG=true
```

This mode supports the complete deterministic learner/admin workflow and development email links.

### Gemini-enabled mode

```env
ENABLE_AI=true
GEMINI_API_KEY=...
```

Keep the per-feature usage and input limits enabled. Provider errors should be tested because the UI must remain honest and usable in fallback mode.

### Redis and workers

```env
CACHE_DRIVER=redis
REDIS_URL=redis://localhost:6379
ENABLE_QUEUE=true
```

Start the worker before exercising queued features. If the worker is absent, jobs remain queued/processing and the learner UI will not receive a completed roadmap/report.

## Review recovery and weekly reports

Project and interview reviews in `reviewing` state may be retried after five minutes. This prevents a server interruption from permanently locking a saved attempt.

Weekly reports use a UTC Monday week boundary. Only one report is stored for each learner, active course, and UTC week. When Gemini is unavailable, the report is created from deterministic progress data.

## Email testing

With delivery disabled and `ALLOW_DEV_EMAIL_LOG=true`, inspect backend logs for verification/reset URLs. For SMTP testing:

1. Configure host, port, secure mode, user, and password.
2. Set a valid from address.
3. Keep connection verification enabled initially.
4. Test registration, resend verification, forgot password, and reset password.

The recovery UI intentionally uses generic success messages to prevent account enumeration.

## Test sequence before a commit

```bash
cd backend
npm test

cd ../frontend
npm test
npm run build
```

Also exercise the affected flow manually when changing routing, cookies, CSRF, onboarding transitions, content publishing, queue behavior, or Gemini fallback states.

## Manual critical-path checklist

1. Register and verify an account.
2. Log in and resume the correct onboarding step after refresh.
3. Generate or reuse a roadmap.
4. Complete lessons and confirm the next module unlocks.
5. Submit a quiz and confirm dashboard/progress invalidation.
6. Create project and interview attempts; confirm the two-attempt limit.
7. Leave a review in a stale `reviewing` state and confirm retry recovery.
8. Disable Gemini and verify scoreless fallbacks.
9. Generate a weekly report twice and confirm the existing report is reused.
10. Re-enable Gemini and retry the same saved review.
11. Publish and archive admin content through confirmation dialogs.
12. Log out and test logout-all-devices.

## Production configuration notes

- Use HTTPS and secure cookies.
- Route `/api` from the frontend host to the Express API, or set `VITE_API_BASE_URL` explicitly.
- Configure exact frontend origins and proxy trust.
- Keep MongoDB, Redis, SMTP, and Gemini credentials in the deployment secret store.
- Run API and worker as independently supervised processes.
- Do not use in-memory cache when multiple API instances require shared cache behavior.
- Disable development email logging.
- Disable demo mode unless the deployment is intentionally a demo.
- Monitor readiness separately from liveness.

## Troubleshooting

### Login succeeds but the next API call fails

Check credentialed CORS, cookie domain/same-site settings, HTTPS, the `/api` reverse proxy, and any `VITE_API_BASE_URL` override.

### Protected writes return invalid CSRF token

Confirm the browser can receive both CSRF cookies, authentication and CSRF cookies use the same domain/same-site policy, and proxies preserve cookies and headers.

### Roadmap stays queued

Confirm `ENABLE_QUEUE=true`, Redis is reachable, and `npm run worker` is running. Otherwise disable queues and use the synchronous path.

### Project or interview review stays in progress

Wait five minutes and retry the saved review. A stale review is recoverable and does not consume another attempt slot.

### Gemini buttons show unavailable/fallback guidance

Confirm `ENABLE_AI`, the API key, model name, provider connectivity, feature limits, and request size limits. Provider failures are expected to preserve the saved attempt without a score.

### Admin publish fails

Read the returned validation message. Common causes are missing required lesson content, MCQ answer mismatch, unpublished related lessons, incomplete interview answer checklists, invalid template lesson slugs, or duplicate published goal/level templates.

See [Junior MERN project scope](JUNIOR_PROJECT_SCOPE.md) for the intentional limits of this portfolio project.
