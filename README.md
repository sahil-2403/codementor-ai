# CodeMentor AI

CodeMentor AI is a full-stack code learning platform that helps learners move from **choosing what to learn** to **following a structured roadmap, practising skills, preparing for interviews, and tracking progress**.

Learners can enroll in individual Courses or ordered Learning Paths, choose a starting level, optionally take a skill check, and receive a Course-specific roadmap. The platform combines lessons, quizzes, coding practice, interview preparation, progress tracking, and optional AI-assisted guidance in one learning flow.

The current development catalog includes a **Complete JavaScript** course, while the platform architecture supports multiple Courses and Learning Paths.

## What CodeMentor AI offers

### Structured learning roadmaps

Each learner follows a persisted roadmap connected to a specific Course and level.

- Beginner, Intermediate, and Advanced entry levels
- Ordered modules and lessons
- Module quizzes
- Lower-level content remains available for revision at higher levels
- Roadmap progress is saved to the learner account
- Multiple Course enrollments can be maintained independently

### Course and Learning Path enrollment

Learners can:

- start a single Course directly;
- follow a Learning Path made from ordered Courses;
- enroll in more than one Course;
- switch the current Course from the Dashboard without losing progress in other enrollments.

### Skill-check personalization

Intermediate and Advanced learners can optionally take a Course-specific skill check.

Assessment results are scored by the backend and mapped to real Topics and roadmap modules. Verified weak areas can then be highlighted as learning priorities.

Gemini may explain those focus areas, but it does not decide assessment scores or invent weak modules.

### Lessons and quizzes

Lessons can include:

- theory and explanations;
- code examples;
- code walkthroughs;
- common mistakes;
- interview definitions and questions;
- related practice material.

Completing lessons updates learner Progress and unlocks the next available learning content according to the roadmap.

Module quizzes check understanding and can contribute to weak-topic and revision tracking.

### Coding practice

Practice Tasks let learners apply Course concepts through code and written explanations.

Each task supports up to two attempts. Submitted work is saved before optional AI review, so the core workflow remains usable even when Gemini is unavailable.

### Interview preparation

Interview practice helps learners explain technical concepts clearly rather than only recognising the correct answer.

Learners can:

- answer Course-specific interview questions;
- compare their response with expected material;
- receive optional AI feedback;
- make a second attempt after reviewing feedback.

### AI Mentor

The Mentor provides contextual help while learners study.

It can assist with requests such as:

- explaining a concept more simply;
- giving another example;
- clarifying code;
- providing an interview-oriented explanation;
- suggesting additional practice.

Mentor requests use the learner's current Course and roadmap context. When Gemini is unavailable, the platform uses stored or deterministic fallback guidance where appropriate instead of presenting fallback content as live AI analysis.

### Progress and weekly reports

Learners can review:

- completed lessons;
- roadmap progress;
- weak topics;
- revision areas;
- practice and interview activity;
- weekly learning summaries.

Each Course enrollment keeps its own learning state.

## Learner flow

A normal learning journey looks like this:

```text
Create account with email/password or Google
    ↓
Email/password: verify email
Google: account is already verified
    ↓
Choose a Course or Learning Path
    ↓
Choose Beginner / Intermediate / Advanced
    ↓
Optional skill check for higher levels
    ↓
Generate roadmap
    ↓
Lessons → Quizzes → Practice → Interview preparation
    ↓
Review progress and continue learning
```

## Demo experience

The Login page can create a **fresh demo learner** on demand.

Each demo request creates a separate verified learner with its own Beginner Complete JavaScript enrollment, CoursePlan, Progress, attempts, Mentor history, and other learner data. Demo visitors therefore do not share learning progress with one another.

The generated credentials are filled into the normal Login form, so the demo still uses the real authentication and learner workflow.

## Content management

CodeMentor AI also includes an authenticated content-management area for maintaining the learning catalog.

Supported content includes:

- Technologies
- Courses
- Learning Paths
- Topics
- Lessons
- Quiz Questions
- Skill-check Questions
- Practice Tasks
- Interview Questions
- Roadmap Templates

Content follows archive/restore/delete rules so referenced learning material is not permanently removed without validation.

## AI design

Gemini is an **optional enhancement**, not a dependency for the core platform.

The backend remains responsible for deterministic application state such as:

- authentication;
- enrollment state;
- assessment scoring;
- roadmap ownership;
- lesson completion;
- unlocking;
- quiz results;
- attempts;
- progress;
- weak-topic mapping.

Gemini is used for learner-facing assistance such as Mentor responses, selected explanations, Practice reviews, Interview feedback, and weekly-summary text.

This separation allows the main learning workflow to continue when AI is disabled or temporarily unavailable.

## Architecture

CodeMentor AI uses a straightforward MERN architecture.

### Frontend request flow

```text
React Page / Component
        ↓
useState / useEffect / event handler
        ↓
Domain API wrapper
        ↓
Axios
        ↓
Express API
```

Authentication is shared through `AuthContext`. Normal feature data stays local to the page or feature using it.

### Backend request flow

```text
Express Route
      ↓
Middleware / Validation
      ↓
Controller
      ↓
Service
      ↓
Mongoose Model
      ↓
MongoDB
```

Optional external services are called from the backend or browser authentication boundary:

```text
Frontend
 └─ Google Identity Services

Backend
 ├─ MongoDB
 ├─ Google ID-token verification
 ├─ Google Gemini API
 └─ Brevo transactional email API
```

Learner-facing APIs are role-protected, and the admin API has a separate admin authorization boundary.

For a more detailed technical explanation, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Tech stack

### Frontend

| Technology | Purpose |
| --- | --- |
| React 18 | User interface |
| React Router 6 | Client-side routing |
| Vite 5 | Development server and production build |
| JavaScript / JSX | Application language |
| Tailwind CSS 3 | Styling |
| Axios | HTTP requests |
| React Hook Form | Form state |
| Zod | Client-side validation |
| Lucide React | Icons |
| Sonner | Toast notifications |
| Google Identity Services | Google registration/login credential flow |

### Backend

| Technology | Purpose |
| --- | --- |
| Node.js | JavaScript runtime |
| Express | REST API |
| MongoDB | Database |
| Mongoose | MongoDB modelling and persistence |
| Zod | Request validation |
| JSON Web Tokens | Authentication |
| bcryptjs | Password hashing |
| google-auth-library | Google ID-token verification |
| cookie-parser | Cookie handling |
| Helmet | Security headers |
| CORS | Browser origin control |
| express-rate-limit | API rate limiting |
| Morgan | Request logging |
| Brevo REST API | Verification and password-reset email delivery |
| Google Gemini API | Optional AI-assisted learning features |

### Backend testing

| Technology | Purpose |
| --- | --- |
| Vitest | Test runner |
| Supertest | Express API integration tests |
| MongoDB Memory Server | Isolated temporary MongoDB for integration tests |

## Repository structure

```text
codementor-ai/
├── backend/
│   ├── src/
│   │   ├── ai/              # Gemini client, prompts, schemas and AI errors
│   │   ├── config/          # Environment and application configuration
│   │   ├── controllers/     # HTTP request/response handling
│   │   ├── email/           # Brevo transport and branded email templates
│   │   ├── middlewares/     # Auth, roles, CSRF, validation, errors, rate limits
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # Express API routes
│   │   ├── seed/            # Development catalog and curriculum seed data
│   │   ├── services/        # Business and learning workflows
│   │   ├── utils/           # Shared utilities
│   │   └── validations/     # Zod request schemas
│   └── tests/
│       ├── helpers/
│       ├── integration/
│       └── unit/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/             # Axios API wrappers
│       ├── components/      # Shared and feature components
│       ├── context/         # Authentication context
│       ├── hooks/           # Shared hooks
│       ├── layouts/         # Public and authenticated layouts
│       ├── pages/           # Public, onboarding, learner and admin pages
│       ├── utils/           # Frontend utilities
│       └── validations/     # Client-side validation schemas
│
├── docs/
└── scripts/
```

## Getting started

### Prerequisites

Install:

- Node.js 18 or newer
- npm
- MongoDB locally or a MongoDB Atlas database

Brevo, Gemini, and Google sign-in are optional for local development.

### 1. Clone the repository

```bash
git clone https://github.com/sahil-2403/codementor-ai.git
cd codementor-ai
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
npm install
```

At minimum, configure:

```env
MONGO_URI=mongodb://localhost:27017/codementor_ai
JWT_ACCESS_SECRET=replace_with_a_strong_secret
JWT_REFRESH_SECRET=replace_with_another_strong_secret
```

The development defaults expect the frontend at:

```env
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Seed development data

Before running the seed, add development admin credentials to `backend/.env`:

```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace_with_a_secure_password
```

Then run:

```bash
npm run seed
```

The seed is intended for a disposable development/demo database. It recreates catalog and curriculum data and refuses to run when `NODE_ENV=production`.

### 4. Start the backend

```bash
npm run dev
```

Default API URL:

```text
http://localhost:5000
```

Health endpoint:

```text
GET /health
```

### 5. Configure and start the frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

During local development, the frontend uses relative `/api` requests and Vite proxies them to the backend. `VITE_API_BASE_URL` can be set when the API is hosted separately.

## Optional Google authentication

Create a Google OAuth **Web application** client and add the frontend URL as an authorized JavaScript origin. For local development, add:

```text
http://localhost:5173
```

Use the same Web client ID in both applications:

```env
# backend/.env
GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

```env
# frontend/.env
VITE_GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

Google registration creates an already-verified learner and signs the learner in immediately. Google Login only signs in an existing Google account. Existing email/password accounts are not silently linked to Google.

A Google client secret is not required for this ID-token sign-in flow.

## Optional Gemini configuration

To enable AI-assisted features, add the following to `backend/.env`:

```env
ENABLE_AI=true
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

The backend also provides environment settings for AI timeouts, daily feature limits, and maximum input sizes. See [backend/.env.example](backend/.env.example) for the complete list.

## Optional Brevo email configuration

Without real email delivery, local development can use development verification/reset links when `ALLOW_DEV_EMAIL_LOG=true`.

For transactional email delivery through Brevo:

```env
EMAIL_ENABLED=true
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM_NAME=CodeMentor AI
EMAIL_FROM_ADDRESS=verified-sender@example.com
EMAIL_REPLY_TO=
ALLOW_DEV_EMAIL_LOG=false
```

Verification and password-reset emails use the CodeMentor AI branded email templates.

## Authentication and security

The application includes:

- email/password registration and login;
- Google learner registration and login;
- backend Google ID-token verification;
- email verification for local accounts;
- password reset for local accounts;
- short-lived access JWTs;
- longer-lived refresh JWTs;
- HttpOnly authentication cookies;
- logout and logout-all-devices support;
- token-version based session invalidation;
- CSRF protection for state-changing requests;
- role-based learner/admin authorization;
- CORS configuration;
- rate limiting;
- Helmet security headers;
- backend request validation with Zod.

Production deployments should use HTTPS, secure cookies, strong independent JWT secrets, exact allowed origins, the correct production Google JavaScript origin, and deployment-managed secrets.

## Available commands

### Backend

```bash
npm run dev          # start with Nodemon
npm start            # start with Node
npm run seed         # recreate development seed data
npm test             # run backend tests
npm run test:watch   # run Vitest in watch mode
npm run check:gemini # optional Gemini contract check
```

### Frontend

```bash
npm run dev          # start Vite development server
npm run build        # create production build
npm run preview      # preview production build
```

## Backend tests

Backend tests focus on application behavior rather than source-code string checks.

The suite includes unit and integration coverage for areas such as:

- authentication;
- Google authentication;
- role authorization;
- onboarding and enrollment switching;
- admin content lifecycle rules;
- attempt limits;
- quiz policy;
- AI response parsing and fallbacks;
- seed-data integrity.

Google integration tests mock the external credential-verification boundary, so the backend test suite does not call Google over the network.

Run the suite with:

```bash
cd backend
npm test
```

## Documentation

Additional project documentation is available in `docs/`:

- [Architecture](docs/ARCHITECTURE.md) — system structure and data flow
- [Development](docs/DEVELOPMENT.md) — local workflows and operational notes
- [Junior Project Scope](docs/JUNIOR_PROJECT_SCOPE.md) — intentional architecture and complexity boundaries
- [Release Checklist](docs/RELEASE_CHECKLIST.md) — pre-deployment review checklist

## Project focus

CodeMentor AI is designed as a practical full-stack learning platform with a clear MERN architecture. Its focus is on understandable application flows, persistent learning state, secure authentication, useful learner feedback, and optional AI assistance without making AI responsible for core learning decisions.
