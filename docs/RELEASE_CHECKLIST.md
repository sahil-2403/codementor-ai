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

## 3. Database

- [ ] Back up any target database that must be preserved
- [ ] Confirm `MONGO_URI` points to the intended environment
- [ ] Review Mongoose index changes
- [ ] Run only currently documented migrations when needed
- [ ] Do not run the development seed against data that must survive

Current migration commands:

```bash
cd backend
npm run migrate:attempt-numbers
npm run migrate:attempt-indexes
npm run migrate:question-archive-indexes
```

For the normal development workflow, the database may instead be cleared and recreated with `npm run seed`.

## 4. Production configuration

### API and browser security

- [ ] Strong independent JWT access/refresh secrets
- [ ] `COOKIE_SECURE=true` over HTTPS
- [ ] Cookie same-site/domain settings match the deployed topology
- [ ] `CLIENT_URL` and `ALLOWED_ORIGINS` contain only approved origins
- [ ] `TRUST_PROXY` matches the reverse proxy setup
- [ ] Rate limits are appropriate
- [ ] Development/demo flags are disabled unless intentionally required

### MongoDB and cache

- [ ] MongoDB connectivity and readiness verified
- [ ] `ENABLE_CACHE` chosen intentionally
- [ ] Cache TTL values reviewed if caching is enabled

### Email

- [ ] SMTP connection verified when real delivery is required
- [ ] Production sender/reply-to addresses configured
- [ ] `ALLOW_DEV_EMAIL_LOG=false` in production

### Gemini

- [ ] `ENABLE_AI` reflects the intended release mode
- [ ] API key/model configured when enabled
- [ ] Provider timeout, daily limits, repeated-prompt limits, and input limits reviewed
- [ ] No Gemini credential is exposed to the frontend

## 5. Deployment order

1. [ ] Put database backup/rollback plan in place
2. [ ] Run any required database maintenance
3. [ ] Deploy the Express API
4. [ ] Deploy the frontend
5. [ ] Verify `/health` and `/health/ready`
6. [ ] Complete smoke tests before announcing the release

## 6. Critical smoke tests

### Public and authentication

- [ ] Landing, registration, login, verification, forgot-password, and reset-password pages load
- [ ] Verification/reset delivery uses the intended email mode
- [ ] Invalid credentials and recovery responses do not reveal account existence
- [ ] Access-token expiry refreshes without a redirect loop
- [ ] CSRF-protected writes work from the deployed frontend origin
- [ ] Logout and logout-all-devices behave correctly

### Onboarding and roadmaps

- [ ] Catalog shows published Courses and Learning Paths
- [ ] Learner can select a Course directly
- [ ] Learner can select a Learning Path
- [ ] Level and preferences persist across refresh
- [ ] Beginner setup creates a roadmap
- [ ] Intermediate/advanced diagnostic skip path works
- [ ] Diagnostic submission/report path works
- [ ] Roadmap creation shows normal loading, success, failure, and explicit retry states
- [ ] Template fallback remains usable when Gemini is disabled

### Learning and progress

- [ ] Locked modules/Lessons are not interactive
- [ ] Completing Lessons updates Progress correctly
- [ ] Module Quiz accepts the exact server-provided question set
- [ ] Wrong answers update weak topics and revisions
- [ ] Lesson → Mentor predefined prompt sends exactly once
- [ ] Mentor pending indicator disappears when the answer returns
- [ ] Dashboard, Progress, and Reports reflect persisted data after writes/refresh
- [ ] Switching current enrollment updates learner pages

### Gemini and fallback honesty

Test once with Gemini enabled and once unavailable:

- [ ] Mentor distinguishes live responses from saved explanations
- [ ] Quiz explanation uses stored fallback content honestly
- [ ] Project submission is saved before review
- [ ] Interview answer is saved before review
- [ ] Successful reviews may show a score
- [ ] Fallback reviews remain scoreless
- [ ] Retrying a failed review reuses the saved attempt

### Admin CMS

- [ ] Non-admin users cannot access admin routes
- [ ] Catalog Technologies/Courses/Learning Paths can be managed
- [ ] Course-owned Topics, Lessons, Questions, Projects, Interview Questions, and Templates can be managed
- [ ] Publishing requires backend readiness validation
- [ ] Archive is required before permanent deletion for every admin content type
- [ ] Course archive/restore cascades through Course-owned curriculum
- [ ] Lower-level lifecycle actions do not affect parents
- [ ] Reference/dependency blockers show clear “How to resolve” instructions

### Responsive and accessibility

- [ ] Keyboard navigation reaches forms, dialogs, navigation, and primary actions
- [ ] Focus indicators are visible
- [ ] Dialog focus is trapped/restored
- [ ] Key pages work at mobile, tablet, and desktop widths
- [ ] Loading, empty, error, locked, unavailable, and archived states are understandable without color alone

## 7. Operations and rollback

- [ ] API logs include request IDs
- [ ] Error logs do not expose secrets/tokens
- [ ] MongoDB/SMTP/Gemini failures produce the expected readiness or fallback behavior
- [ ] Previous frontend/API revision is available for rollback
- [ ] Database/index changes have an understood recovery plan
- [ ] Rollback trigger and decision-maker are known

If critical authentication, onboarding, data-integrity, or attempt-preservation checks fail, fix or roll back rather than hiding the failure behind UI fallbacks.
