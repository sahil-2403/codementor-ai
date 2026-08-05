# Release checklist

This checklist separates repeatable local checks from environment-specific verification. Run the local release check before deployment, then complete the relevant manual smoke tests and configuration review.

## 1. Release record

- [ ] Release name/version:
- [ ] Commit SHA:
- [ ] Release owner:
- [ ] Target environment:
- [ ] Planned deployment time:
- [ ] Database backup location/time:
- [ ] Rollback owner and decision deadline:

## 2. Local automated gates

From the repository root, run:

```bash
node scripts/release-check.mjs
```

Confirm that the command completes all of these checks successfully:

- [ ] Backend dependencies install with `npm ci`
- [ ] Backend unit tests pass
- [ ] Frontend dependencies install with `npm ci`
- [ ] Frontend contract tests pass
- [ ] Frontend production build passes

Do not mark a failed or skipped command as passing. Gemini integration checks are separate because they require provider credentials:

```bash
cd backend
npm run check:gemini
```

- [ ] Gemini contract check completed when AI is enabled for this release

## 3. Change and dependency review

- [ ] Review the commit range and confirm only intended files are included
- [ ] Review dependency and lockfile changes
- [ ] Confirm no `.env`, credentials, API keys, SMTP passwords, database dumps, or private user data are committed
- [ ] Confirm environment examples and documentation match new variables or commands
- [ ] Confirm frontend/backend API enums and response fields remain aligned
- [ ] Confirm admin scope has not expanded into user management or fabricated analytics

## 4. Database and migrations

- [ ] Back up the target MongoDB database
- [ ] Confirm `MONGO_URI` points to the target environment
- [ ] Review Mongoose index changes for build time and uniqueness failures
- [ ] Run required migrations in the documented order
- [ ] Record migration output and affected counts
- [ ] Confirm no seed command will run during deployment

Current migration commands:

```bash
cd backend
npm run migrate:attempt-numbers
npm run migrate:attempt-indexes
npm run migrate:roadmap-indexes
```

For an existing database, backfill attempt numbers before enforcing unique attempt indexes.

## 5. Production configuration

### API and browser security

- [ ] Strong independent `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] `COOKIE_SECURE=true` over HTTPS
- [ ] `COOKIE_SAME_SITE` and `COOKIE_DOMAIN` match the frontend/API topology
- [ ] `CLIENT_URL` and `ALLOWED_ORIGINS` contain only approved origins
- [ ] `TRUST_PROXY` matches the reverse-proxy/load-balancer setup
- [ ] Rate limits are appropriate for expected traffic
- [ ] Development/demo flags are disabled unless explicitly required

### MongoDB, cache, and queues

- [ ] MongoDB connectivity and readiness verified
- [ ] Cache driver chosen intentionally (`memory` for one API instance or Redis for shared cache)
- [ ] Redis connectivity verified when Redis is configured
- [ ] `ENABLE_QUEUE=true` only when a supervised worker will be deployed
- [ ] API and worker use compatible environment values

### Email

- [ ] SMTP connection verified
- [ ] Production sender and reply-to addresses configured
- [ ] `EMAIL_ENABLED=true` when real delivery is required
- [ ] `ALLOW_DEV_EMAIL_LOG=false` in production

### Gemini

- [ ] `ENABLE_AI` reflects the intended release mode
- [ ] Gemini key and model configured when enabled
- [ ] Provider timeout, daily limits, repeated-prompt limits, and input limits reviewed
- [ ] No Gemini credential is exposed to the frontend

## 6. Deployment order

Recommended order:

1. [ ] Put the database backup/rollback plan in place
2. [ ] Run required migrations
3. [ ] Deploy the API with readiness checks enabled
4. [ ] Deploy/start the worker when queues are enabled
5. [ ] Deploy the frontend with the production API base URL
6. [ ] Verify liveness and readiness
7. [ ] Complete smoke tests before announcing the release

Health endpoints:

- `GET /health`
- `GET /health/ready`

Do not route production traffic to an API instance that fails readiness.

## 7. Critical smoke tests

### Public and authentication

- [ ] Landing, registration, login, verification, forgot-password, and reset-password pages load
- [ ] Verification/reset delivery uses real email or the intended non-production log mode
- [ ] Invalid credentials and generic recovery responses do not reveal account existence
- [ ] Access-token expiry refreshes once without a redirect loop
- [ ] CSRF-protected writes succeed from the deployed frontend origin
- [ ] Logout and logout-all-devices invalidate sessions correctly

### Onboarding and roadmaps

- [ ] Refreshing any onboarding step resumes from server state
- [ ] Beginner preferences create/reuse a roadmap
- [ ] Intermediate/advanced diagnostic skip path works
- [ ] Diagnostic submission and report path work
- [ ] Roadmap generation handles existing, synchronous, queued, failed, and retry states
- [ ] Template fallback remains usable when Gemini is disabled

### Learning and progress

- [ ] Locked modules/lessons are not interactive
- [ ] Completing lessons updates progress and unlocks the next module correctly
- [ ] Module quiz accepts the exact question set and stores a deterministic score
- [ ] Wrong answers update weak topics and revisions
- [ ] Dashboard, progress, and reports reflect persisted data after refresh

### Gemini and fallback honesty

Test once with Gemini enabled and once with it unavailable:

- [ ] Mentor clearly distinguishes Gemini answers from saved explanations
- [ ] Quiz explanation shows stored fallback content without claiming Gemini output
- [ ] Project submission is saved before review
- [ ] Interview answer is saved before review
- [ ] Successful Gemini project/interview reviews may show a score
- [ ] Fallback reviews are scoreless and create no AI-derived weak topics
- [ ] Retrying a failed review reuses the saved attempt and does not consume a new slot

### Admin CMS

- [ ] Non-admin users cannot access `/admin` APIs or pages
- [ ] Topics can be created/edited/deleted within integrity rules
- [ ] Lesson, quiz, interview-question, and template drafts can be edited
- [ ] Publishing requires the accessible confirmation dialog and backend validation
- [ ] Archived content is read-only and absent from learner-facing selection

### Responsive and accessibility

- [ ] Keyboard navigation reaches header, mobile navigation, dialogs, forms, and primary actions
- [ ] Focus indicators are visible
- [ ] Dialog focus is trapped and restored
- [ ] Key pages work at mobile, tablet, and desktop widths
- [ ] Loading, empty, error, locked, unavailable, and archived states are understandable without color alone

## 8. Observability and operations

- [ ] API logs include request IDs
- [ ] Error logs do not expose secrets or sensitive tokens
- [ ] Worker startup confirms the intended workers are running
- [ ] Failed jobs and provider failures are visible in logs
- [ ] MongoDB/Redis/SMTP/Gemini dependency failures produce expected readiness or fallback behavior
- [ ] The person deploying the project knows where to inspect API and worker failures

## 9. Rollback

- [ ] Previous API, worker, and frontend artifacts are available
- [ ] Database migrations have a documented recovery strategy
- [ ] Rollback does not reintroduce incompatible indexes or enum values
- [ ] Queue compatibility between old/new API and workers is understood
- [ ] Rollback trigger and decision-maker are recorded

If the release fails critical auth, onboarding, data-integrity, or attempt-preservation checks, stop traffic or roll back rather than hiding the failure behind UI fallbacks.

## 10. Sign-off

- [ ] Local automated checks approved by:
- [ ] Database/migrations approved by:
- [ ] Security/environment approved by:
- [ ] Product smoke tests approved by:
- [ ] Release completed at:
- [ ] Post-release monitoring completed at:
