# Release checklist

Use this checklist before demonstrating or deploying CodeMentor AI.

## 1. Local automated checks

Install dependencies first when `package.json` changed:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

Then run:

```bash
node scripts/release-check.mjs
```

Confirm:

- [ ] Backend unit tests pass
- [ ] Frontend contract tests pass
- [ ] Frontend production build passes

When Gemini is enabled, also run:

```bash
cd backend
npm run check:gemini
```

## 2. Change and dependency review

- [ ] Only intended files are included
- [ ] `package.json` changes are intentional
- [ ] Fresh dependency installation succeeds for backend and frontend
- [ ] No `.env`, credentials, API keys, SMTP passwords, database dumps, or private user data are committed
- [ ] Environment examples and documentation match current variables/commands
- [ ] Frontend/backend API enums and response fields remain aligned
- [ ] Admin scope remains learning-content management only
- [ ] Frontend pages use local React state/effects and domain API wrappers rather than a custom query layer
- [ ] No application cache, queue/worker, or other infrastructure beyond the Hireflow/junior scope has been added

## 3. Database

- [ ] Confirm `MONGO_URI` points to the intended development/demo database
- [ ] MongoDB connectivity works
- [ ] Review intentional Mongoose schema/index changes
- [ ] Clear and reseed the disposable development database when schema changes require fresh data
- [ ] Never run the development seed against data that must survive

For the normal project workflow:

```bash
cd backend
npm run seed
```

## 4. Production configuration

### API and browser security

- [ ] Strong independent JWT access/refresh secrets
- [ ] `COOKIE_SECURE=true` over HTTPS
- [ ] Cookie same-site/domain settings match the deployed topology
- [ ] `CLIENT_URL` and `ALLOWED_ORIGINS` contain only approved origins
- [ ] `TRUST_PROXY` matches the reverse proxy setup
- [ ] Rate limits are appropriate
- [ ] Development/demo flags are disabled unless intentionally required

### MongoDB

- [ ] MongoDB connection string is configured through deployment secrets
- [ ] Application startup fails clearly when MongoDB cannot connect
- [ ] `GET /health` responds after successful startup

### Email

- [ ] SMTP connection verified when real delivery is required
- [ ] Production sender/reply-to addresses configured
- [ ] `ALLOW_DEV_EMAIL_LOG=false` in production

### Gemini

- [ ] `ENABLE_AI` reflects the intended release mode
- [ ] API key/model configured when enabled
- [ ] Provider timeout, daily limits, and input limits reviewed
- [ ] No Gemini credential is exposed to the frontend

## 5. Critical smoke tests

### Public and authentication

- [ ] Landing, registration, login, verification, forgot-password, and reset-password pages load
- [ ] Verification/reset delivery uses the intended email mode
- [ ] Invalid credentials and recovery responses do not reveal account existence
- [ ] Access-token expiry refreshes without a redirect loop
- [ ] CSRF-protected writes work from the deployed frontend origin
- [ ] Logout and logout-all-devices behave correctly

### Onboarding and roadmaps

- [ ] Catalog shows published Courses and Learning Paths
- [ ] Learner can select a Course or Learning Path
- [ ] Level and preferences persist across refresh
- [ ] Beginner setup creates a roadmap
- [ ] Intermediate/advanced diagnostic skip path works
- [ ] Diagnostic submission/report path works
- [ ] Roadmap creation shows normal loading, success, failure, and retry states
- [ ] Template fallback remains usable when Gemini is disabled

### Learning and progress

- [ ] Locked modules/Lessons are not interactive
- [ ] Completing Lessons updates Progress correctly
- [ ] Module Quiz accepts the server-provided question set
- [ ] Wrong answers update weak topics and revisions
- [ ] Lesson → Mentor predefined prompt sends exactly once
- [ ] Mentor pending indicator disappears when the answer returns
- [ ] Dashboard, Progress, and Reports reflect persisted data after writes/refresh
- [ ] Switching current Enrollment updates learner pages
- [ ] Projects and Interview questions allow two attempts and reject a third

### Gemini and fallback honesty

Test once with Gemini enabled and once unavailable:

- [ ] Mentor distinguishes live responses from saved explanations
- [ ] Quiz explanation uses fallback content honestly
- [ ] Project submission is saved before review
- [ ] Interview answer is saved before review
- [ ] Successful reviews may show a score
- [ ] Fallback reviews remain scoreless

### Admin CMS

- [ ] Non-admin users cannot access admin routes
- [ ] Catalog Technologies/Courses/Learning Paths can be managed
- [ ] Course-owned Topics, Lessons, Questions, Projects, Interview Questions, and Templates can be managed
- [ ] Publishing requires backend readiness validation
- [ ] Archive is required before permanent deletion for every admin content type
- [ ] Course archive cascades through Course-owned curriculum
- [ ] Course restore returns publishable children to Draft and Topics to Active
- [ ] Lower-level lifecycle actions do not affect parents
- [ ] Reference/dependency blockers show clear “How to resolve” instructions

## 6. Responsive and accessibility

- [ ] Keyboard navigation reaches forms, dialogs, navigation, and primary actions
- [ ] Focus indicators are visible
- [ ] Key pages work at mobile, tablet, and desktop widths
- [ ] Loading, empty, error, locked, unavailable, and archived states are understandable without color alone
