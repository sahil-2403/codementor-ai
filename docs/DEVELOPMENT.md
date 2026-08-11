# Development and operations

## Local processes

A normal local setup uses two processes:

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

The frontend uses relative `/api` requests. Vite proxies them to `http://localhost:5000` during local development.

## Installation

Install dependencies after cloning or whenever package definitions change:

```bash
cd backend && npm install
cd ../frontend && npm install
```

Copy both environment examples before starting the applications.

## Database and seed data

`npm run seed` is intended for local/demo databases. It recreates the application catalog, Course-owned curriculum, templates, example enrollments/content, and demo accounts.

Before running it:

1. Confirm `MONGO_URI` points to the intended development database.
2. Back up anything you need to keep.
3. Do not run it against production data.

## Backend commands

```bash
npm run dev
npm start
npm run seed
npm test
npm run check:gemini
npm run migrate:attempt-numbers
npm run migrate:attempt-indexes
npm run migrate:question-archive-indexes
```

## Frontend commands

```bash
npm run dev
npm test
npm run build
npm run preview
```

Frontend tests use Node's built-in test runner. They protect important source and cross-layer contracts but do not replace manual browser testing.

## Runtime modes

### Standard mode

```env
ENABLE_AI=false
ENABLE_CACHE=true
EMAIL_ENABLED=false
ALLOW_DEV_EMAIL_LOG=true
```

This supports the deterministic learner/admin workflow and development email links.

### Gemini-enabled mode

```env
ENABLE_AI=true
GEMINI_API_KEY=...
```

Keep feature/input limits configured. Provider failures should be tested because learner-facing fallbacks must remain clear and honest.

## Roadmap generation

Roadmap generation is a normal API request. The backend validates the current Enrollment, loads the published Course + level template, optionally applies Gemini personalization, writes the CoursePlan and Progress, then returns the result.

The learner generation page should stay open while that request is running. If the request fails, the learner can explicitly retry from the same page.

## Frontend data loading

Frontend data access intentionally stays simple:

- Axios functions live in `src/api/`.
- Domain hooks live in `src/queries/`.
- `useAsyncData` handles request/loading/error/refetch state.
- `useAsyncAction` handles writes.
- Successful writes trigger a small application refresh signal so mounted server-data hooks reload.
- There is no frontend server-response cache or optimistic cache layer.

Prefer explicit server refresh after writes over complex client-side synchronization.

## Review recovery and weekly reports

Project and interview reviews in `reviewing` state may be retried after five minutes. This prevents an interrupted AI review from permanently locking a saved attempt.

Weekly reports use a UTC Monday boundary. Only one report is stored for each learner, active CoursePlan, and UTC week. When Gemini is unavailable, the report uses deterministic progress data.

## Email testing

With delivery disabled and `ALLOW_DEV_EMAIL_LOG=true`, inspect backend logs for verification/reset URLs. For SMTP testing:

1. Configure host, port, secure mode, user, and password.
2. Set a valid from address.
3. Keep connection verification enabled initially.
4. Test registration, resend verification, forgot password, and reset password.

Recovery screens intentionally use generic success messages to reduce account enumeration risk.

## Test sequence before a commit

```bash
cd backend
npm test

cd ../frontend
npm test
npm run build
```

Also exercise the affected browser flow when changing routing, cookies, CSRF, onboarding transitions, content publishing, roadmap creation, or Gemini fallbacks.

## Manual critical path

1. Register and verify an account.
2. Log in and resume the correct onboarding step after refresh.
3. Choose a Course or Learning Path, level, and preferences.
4. Generate a roadmap.
5. Complete Lessons and confirm progression updates.
6. Submit a Quiz and confirm Dashboard/Progress updates.
7. Open Mentor from a Lesson and confirm the preloaded prompt sends once.
8. Create Project and Interview attempts and verify limits.
9. Disable Gemini and verify honest fallback behavior.
10. Generate a weekly report.
11. Exercise admin archive/restore/delete and dependency messages.
12. Switch between independent learner enrollments.
13. Log out and test logout-all-devices.

## Production notes

- Use HTTPS and secure cookies.
- Route `/api` to the Express API or set `VITE_API_BASE_URL` explicitly.
- Configure exact frontend origins and proxy trust.
- Keep MongoDB, SMTP, and Gemini credentials in deployment secrets.
- Disable development email logging.
- Disable demo mode unless intentionally demonstrating demo behavior.
- Monitor readiness separately from liveness.

## Troubleshooting

### Login succeeds but the next API call fails

Check credentialed CORS, cookie domain/same-site settings, HTTPS, the `/api` reverse proxy, and any `VITE_API_BASE_URL` override.

### Protected writes return invalid CSRF token

Confirm authentication and CSRF cookies share the expected browser/domain policy and the proxy preserves cookies and headers.

### Roadmap generation fails

Read the returned learner-facing error, confirm the selected Course is published, confirm the chosen level has a published Roadmap Template, and verify any referenced Lessons/Quiz coverage are published.

### Project or interview review stays in progress

Wait five minutes and retry the saved review. Recovery reuses the saved attempt.

### Gemini features show unavailable guidance

Confirm `ENABLE_AI`, the API key, model name, provider connectivity, feature limits, and request-size limits.

### Admin publish fails

Read the returned validation and “How to resolve” instructions. Course-owned references must belong to the same Course and required learner content must be published before dependent content can be published.

See [Junior project scope](JUNIOR_PROJECT_SCOPE.md) for the intentional limits of this portfolio project.
