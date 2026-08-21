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

```bash
cd backend && npm install
cd ../frontend && npm install
```

Copy both environment examples before starting the applications.

## Database and seed data

`npm run seed` is intended for a fresh disposable local/demo database. It recreates the catalog, Course-owned curriculum, templates, and local seed accounts/content; it is not a migration or existing-data update script.

Before running it:

1. Confirm `MONGO_URI` points to the intended development database.
2. Set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `backend/.env`.
3. Back up anything you need to keep.
4. Do not run it against production data. The script refuses to run when `NODE_ENV=production`.

The admin seed credentials are intentionally supplied through local environment variables rather than committed in source.

Fresh demo users are different from seed accounts. They are created on demand from Login and each receive their own User, Enrollment, CoursePlan, and Progress.

## Backend commands

```bash
npm run dev
npm start
npm run seed
npm test
npm run test:watch
npm run check:gemini
```

## Frontend commands

```bash
npm run dev
npm run build
npm run preview
```

## Backend tests

Backend tests use Vitest. Unit tests exercise small exported business rules directly, while integration tests use Supertest against the Express app and MongoDB Memory Server for an isolated temporary database.

```text
backend/tests/
├── setup.js
├── helpers/
├── unit/
└── integration/
```

The suite intentionally focuses on behavior such as authentication, role authorization, onboarding/enrollment switching, admin lifecycle rules, attempt limits, quiz policy, AI response handling, and seed-data integrity. It does not test source-file strings or enforce architecture by regex.

## Runtime modes

### Standard mode

```env
ENABLE_AI=false
EMAIL_ENABLED=false
ALLOW_DEV_EMAIL_LOG=true
```

This supports the deterministic learner/admin workflow and development email links.

### Gemini-enabled mode

```env
ENABLE_AI=true
GEMINI_API_KEY=...
```

Gemini uses simple daily feature limits and maximum input lengths. Provider failures should be tested because learner-facing fallbacks must remain clear and honest.

## Roadmap generation

Roadmap generation is a normal API request:

1. Validate the current Enrollment and selected Course/level.
2. Load the published Roadmap Templates from Beginner through the selected level.
3. Build one cumulative roadmap so completed lower-level content remains available for revision.
4. If a completed skill check exists, the backend maps verified weak topics to real roadmap Lessons/modules and marks those modules as high priority.
5. Optionally ask Gemini for short explanatory text for the already-verified focus areas.
6. Archive the previous active CoursePlan if a replacement version is being created.
7. Create the new CoursePlan, carry matching completed Lesson IDs forward, and ensure Progress exists.
8. Return the result.

Gemini does not choose weak modules, rename modules, or reorder the roadmap. If Gemini is unavailable, the deterministic skill-check personalization remains intact and uses backend fallback explanations.

The learner generation page should stay open while the request is running. If it fails, the learner can retry; a retry can reuse an already-created active roadmap and ensure its Progress record exists.

## Frontend data loading

- Axios domain functions live in `src/api/`.
- Pages/components use normal `useState` and `useEffect` for server data.
- Mutations use normal async event handlers.
- After a successful write, update the relevant local state or reload that page's data explicitly.
- Authentication uses `AuthContext` because it is shared application state.
- There is no `src/queries` layer, global refresh signal, custom server-state framework, or frontend response cache.

This is the preferred Hireflow-style request flow:

```text
Page / Component
  -> useState + useEffect
  -> API wrapper
  -> Axios
```

## Fresh demo accounts

The Login page starts empty. Clicking the demo action calls `POST /api/auth/demo-account`.

That endpoint:

1. Creates a unique verified learner marked `isDemo`.
2. Creates a Beginner Complete JavaScript Enrollment.
3. Uses the normal roadmap service to generate the starter CoursePlan and Progress.
4. If provisioning fails after creating the demo User, removes partial Progress, CoursePlan, Enrollment, and User records before returning the error.
5. Returns generated credentials to the Login page.
6. The Login page fills the normal email/password form; it does not bypass the normal login endpoint.

Each request creates a separate learner, so one visitor's course switching, progress, Mentor history, attempts, and other learner data do not affect another visitor's demo.

The endpoint uses the existing registration rate limiter to avoid unbounded account creation from one client. After one demo account is prepared, the Login page disables the demo action for that page session so repeated clicks do not create unnecessary accounts.

## Practice and interview attempts

Each Practice task or Interview question allows two attempts. The backend simply counts existing attempts and creates attempt 1 or 2. A third attempt is rejected.

The learner answer/submission is saved before Gemini review. If Gemini is unavailable, the saved attempt receives scoreless fallback guidance.

## Weekly reports

Weekly reports use a UTC Monday boundary. One report is stored for each learner, active CoursePlan, and week. When Gemini is unavailable, the report uses deterministic progress data.

## Email testing

With delivery disabled and `ALLOW_DEV_EMAIL_LOG=true`, inspect backend logs for verification/reset URLs.

For real delivery with Brevo:

1. Create or use a verified Brevo sender.
2. Set `BREVO_API_KEY`.
3. Set `EMAIL_FROM_NAME` and `EMAIL_FROM_ADDRESS`.
4. Optionally set `EMAIL_REPLY_TO`.
5. Set `EMAIL_ENABLED=true`.
6. Test registration, resend verification, forgot password, and reset password.

CodeMentor sends through Brevo's transactional email REST API; it does not require SMTP host/port/user/password configuration or Nodemailer.

Recovery screens intentionally use generic success messages to reduce account enumeration risk.

## Check sequence before a commit

```bash
cd backend
npm test

cd ../frontend
npm run build
```

Also exercise the affected browser flow when changing routing, cookies, CSRF, onboarding transitions, content publishing, roadmap creation, or Gemini fallbacks.

## Manual critical path

1. Register and verify an account through Brevo or the development-link fallback.
2. Log in and resume the correct onboarding step after refresh.
3. From a clean Login page, create a fresh demo account, confirm credentials are filled only after clicking the demo action, and log in normally.
4. Choose a Course or Learning Path and level.
5. For Intermediate/Advanced, either skip or complete the optional skill check.
6. Generate a roadmap and verify lower-level revision content remains available at higher levels.
7. Complete Lessons and confirm progression updates.
8. Submit a Quiz and confirm Dashboard/Progress updates.
9. Open Mentor from a Lesson and confirm the preloaded prompt sends once.
10. Create Practice and Interview attempts and verify the two-attempt limit.
11. Disable Gemini and verify honest fallback behavior, including deterministic skill-check roadmap priorities.
12. Generate a weekly report.
13. Exercise admin archive/restore/delete and dependency messages.
14. Switch between independent learner Enrollments from Dashboard.
15. Create a second demo account and confirm it does not inherit the first demo user's changes.
16. Log out and test logout-all-devices.

## Production notes

- Use HTTPS and secure cookies.
- Route `/api` to the Express API or set `VITE_API_BASE_URL` explicitly.
- Configure exact frontend origins and proxy trust.
- Keep MongoDB, Brevo, and Gemini credentials in deployment secrets.
- Disable development email logging.
- Do not run the development seed in production.

## Troubleshooting

### Login succeeds but the next API call fails

Check credentialed CORS, cookie domain/same-site settings, HTTPS, the `/api` reverse proxy, and any `VITE_API_BASE_URL` override.

### Protected writes return invalid CSRF token

Confirm authentication and CSRF cookies share the expected browser/domain policy and the proxy preserves cookies and headers.

### Demo account preparation fails

Confirm the Complete JavaScript Course is published and has a published Beginner Roadmap Template with valid published Lessons and Quiz content.

### Brevo email delivery fails

Confirm `EMAIL_ENABLED=true`, the Brevo API key is valid, and `EMAIL_FROM_ADDRESS` is a verified sender in Brevo. Check backend logs for the Brevo failure code without logging secrets.

### Roadmap generation fails

Read the returned error, confirm the selected Course is published, and confirm each required cumulative level has a published Roadmap Template with published referenced content.

### Gemini features show unavailable guidance

Confirm `ENABLE_AI`, the API key, model name, provider connectivity, daily feature limit, and request-size limits.

### Admin publish fails

Read the returned validation and “How to resolve” instructions. Course-owned references must belong to the same Course and required learner content must be published before dependent content can be published.

See [Junior project scope](JUNIOR_PROJECT_SCOPE.md) for the intentional limits of this portfolio project.
