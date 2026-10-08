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

The suite intentionally focuses on behavior such as authentication, Google authentication, role authorization, onboarding/enrollment switching, admin lifecycle rules, attempt limits, quiz policy, AI response handling, and seed-data integrity. It does not test source-file strings or enforce architecture by regex.

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

## Google authentication

CodeMentor uses Google Identity Services in the browser and verifies the returned Google ID token on the backend with `google-auth-library`.

Configure the same Google Web application client ID in both applications:

```env
# backend/.env
GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com

# frontend/.env
VITE_GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

For local development, add `http://localhost:5173` as an authorized JavaScript origin for the Google Web client. Add the deployed frontend origin separately for production.

The flow intentionally stays simple:

- Google Register creates a verified learner and signs the learner in immediately.
- Google Login only signs in an already-registered Google account.
- An existing email/password account is not silently linked to Google.
- A Google-only account is directed to use Google instead of password login.
- Forgot Password returns the normal generic response for Google-only accounts but does not create reset data or send a reset email.
- CodeMentor stores Google's stable account ID only for backend account matching; it is not included in normal auth responses.

No Google client secret, Passport.js, Firebase Auth, or frontend Google npm package is required for this sign-in flow.

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

Also exercise the affected browser flow when changing routing, cookies, CSRF, onboarding transitions, content publishing, roadmap creation, Google authentication, or Gemini fallbacks.

## Production notes

- Use HTTPS and secure cookies.
- Route `/api` to the Express API or set `VITE_API_BASE_URL` explicitly.
- Configure exact frontend origins and proxy trust.
- Configure the production frontend origin on the Google Web client and use the matching Google client ID in backend/frontend deployment secrets.
- Keep MongoDB, Brevo, Gemini, and Google configuration in deployment secrets/settings.
- Disable development email logging.
- Do not run the development seed in production.

## Troubleshooting

### Login succeeds but the next API call fails

Check credentialed CORS, cookie domain/same-site settings, HTTPS, the `/api` reverse proxy, and any `VITE_API_BASE_URL` override.

### Google sign-in is not configured or unavailable

Confirm `VITE_GOOGLE_CLIENT_ID` is present in the frontend environment, `GOOGLE_CLIENT_ID` is present in the backend environment, both values refer to the same Google Web client, and the current frontend origin is authorized in Google Cloud.

### Protected writes return invalid CSRF token

Confirm authentication and CSRF cookies share the expected browser/domain policy and the proxy preserves cookies and headers.

### Brevo email delivery fails

Confirm `EMAIL_ENABLED=true`, the Brevo API key is valid, and `EMAIL_FROM_ADDRESS` is a verified sender in Brevo. Check backend logs for the Brevo failure code without logging secrets.

### Roadmap generation fails

Read the returned error, confirm the selected Course is published, and confirm each required cumulative level has a published Roadmap Template with published referenced content.

### Gemini features show unavailable guidance

Confirm `ENABLE_AI`, the API key, model name, provider connectivity, daily feature limit, and request-size limits.

### Admin publish fails

Read the returned validation and “How to resolve” instructions. Course-owned references must belong to the same Course and required learner content must be published before dependent content can be published.

See [Junior project scope](JUNIOR_PROJECT_SCOPE.md) for the intentional limits of this portfolio project.
