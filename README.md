# CodeMentor AI

CodeMentor AI is a full-stack code learning platform that helps learners choose what to learn, follow a structured roadmap, practise skills, prepare for interviews, and track progress in one place.

Learners can enroll in individual Courses or ordered Learning Paths, choose a starting level, optionally take a skill check, and receive a Course-specific roadmap. The platform combines lessons, quizzes, coding practice, interview preparation, progress tracking, authentication, and optional AI-assisted guidance.

The current development catalog includes a **Complete JavaScript** course, while the platform architecture supports multiple Courses and Learning Paths.

## Core learner experience

### Courses, Learning Paths, and roadmaps

Learners can:

- start a Course directly;
- follow a Learning Path made from ordered Courses;
- choose Beginner, Intermediate, or Advanced;
- keep lower-level roadmap content available for revision;
- enroll in more than one Course;
- switch the current Course without losing progress in other enrollments.

Each active Course has its own persisted roadmap, Progress, attempts, weak-topic data, and learning history.

### Skill-check personalization

Intermediate and Advanced learners can optionally take a Course-specific skill check.

Assessment scoring is deterministic backend behavior. Verified weak Topics are mapped to real roadmap modules and can be highlighted as learning priorities. Gemini may explain those focus areas, but it does not decide scores or invent weak modules.

### Lessons and quizzes

Lessons can contain theory, examples, walkthroughs, common mistakes, interview definitions, and related practice material.

Completing lessons updates Progress and unlocks the next available learning content according to the roadmap. Module quizzes check understanding and can contribute to weak-topic and revision tracking.

### Coding practice

Practice Tasks let learners apply Course concepts through code and written explanations.

Each task supports up to two attempts. Submitted work is stored before optional AI review, so the workflow remains usable when Gemini is disabled or unavailable.

### Interview preparation

Learners can answer Course-specific interview questions, compare their response with expected material, receive optional AI feedback, and make a second attempt after reviewing feedback.

### AI Mentor

The Mentor uses the learner's current Course and roadmap context to help with requests such as:

- explain this more simply;
- give another example;
- clarify code;
- give an interview-oriented explanation;
- suggest additional practice.

When Gemini is unavailable, the application uses stored or deterministic fallback guidance where appropriate instead of presenting fallback content as live AI analysis.

### Progress and reports

Learners can review completed lessons, roadmap progress, weak topics, revision areas, Practice and Interview activity, and weekly learning summaries.

## Authentication

CodeMentor supports two learner authentication methods.

### Email and password

Email/password accounts use:

```text
Register
   ↓
Verify email
   ↓
Log in
   ↓
Choose what to learn / resume current learning
```

Verification and password-reset emails are delivered through the Brevo transactional email REST API when email delivery is enabled.

### Google

Google registration and login use Google Identity Services in the browser and backend ID-token verification with `google-auth-library`.

```text
Google Register
      ↓
Backend verifies Google ID token
      ↓
Verified learner account created
      ↓
CodeMentor JWT cookies issued
      ↓
Onboarding
```

Google Login only signs in an already-registered Google account. CodeMentor does not silently link an existing email/password account to Google.

Google-only accounts do not receive CodeMentor password-reset emails because they do not have a local password.

### Demo accounts

The Login page can also create a fresh isolated demo learner on demand. Each demo visitor receives separate learner data, enrollment, roadmap, progress, attempts, and Mentor history.

The generated demo credentials are filled into the normal Login form, so the demo still uses the real authentication flow.

## Typical learner flow

```text
Create an account with email/password or Google
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

## Content management

CodeMentor AI includes an authenticated content-management area for maintaining the learning catalog.

Managed content includes Technologies, Courses, Learning Paths, Topics, Lessons, Quiz Questions, Skill-check Questions, Practice Tasks, Interview Questions, and Roadmap Templates.

Content follows archive/restore/delete rules so referenced learning material is not permanently removed without validation.

## AI design

Gemini is an optional enhancement rather than a dependency for the core platform.

The backend remains responsible for deterministic state such as authentication, enrollment, assessment scoring, roadmap ownership, lesson completion, unlocking, quiz results, attempts, progress, and weak-topic mapping.

Gemini is used for learner-facing assistance such as Mentor responses, selected explanations, Practice reviews, Interview feedback, weekly-summary text, and explanations for verified skill-check focus areas.

## Architecture

CodeMentor uses a straightforward MERN architecture.

### Frontend

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

### Backend

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

External services are isolated behind backend/frontend boundaries:

```text
Google Identity Services → Google ID credential → Express verification
Express → MongoDB
Express → Brevo
Express → Google Gemini API
```

For deeper technical details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

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
| Google Identity Services | Google sign-in button and browser credential flow |

### Backend

| Technology | Purpose |
| --- | --- |
| Node.js | JavaScript runtime |
| Express | REST API |
| MongoDB | Database |
| Mongoose | MongoDB modelling and persistence |
| Zod | Request validation |
| JSON Web Tokens | Authentication sessions |
| bcryptjs | Local password hashing |
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
│   │   ├── ai/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── controllers/
│   │   ├── email/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed/
│   │   ├── services/
│   │   ├── utils/
│   │   └── validations/
│   └── tests/
│       ├── helpers/
│       ├── integration/
│       └── unit/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── layouts/
│       ├── pages/
│       ├── utils/
│       └── validations/
│
├── docs/
└── scripts/
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB locally or through MongoDB Atlas

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

Development defaults expect:

```env
CLIENT_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Seed development data

Set local admin credentials in `backend/.env`:

```env
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=replace_with_a_secure_password
```

Then run:

```bash
npm run seed
```

The seed is for a disposable development/demo database and refuses to run when `NODE_ENV=production`.

### 4. Start the backend

```bash
npm run dev
```

Default API URL: `http://localhost:5000`

Health endpoint: `GET /health`

### 5. Configure and start the frontend

In another terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default frontend URL: `http://localhost:5173`

During local development, relative `/api` requests are proxied to the backend. Set `VITE_API_BASE_URL` only when the API is hosted separately.

## Optional Google sign-in configuration

Create a Google OAuth **Web application** client and add your frontend URL as an authorized JavaScript origin.

For local development, use:

```text
http://localhost:5173
```

Set the same Web client ID in both applications:

```env
# backend/.env
GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

```env
# frontend/.env
VITE_GOOGLE_CLIENT_ID=your_web_client_id.apps.googleusercontent.com
```

A Google client secret is not required for this ID-token sign-in flow.

## Optional Gemini configuration

```env
ENABLE_AI=true
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-flash
```

See [backend/.env.example](backend/.env.example) for AI timeouts, daily limits, and input limits.

## Optional Brevo email configuration

Without real email delivery, development verification/reset links can be logged when `ALLOW_DEV_EMAIL_LOG=true`.

For real delivery:

```env
EMAIL_ENABLED=true
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM_NAME=CodeMentor AI
EMAIL_FROM_ADDRESS=verified-sender@example.com
EMAIL_REPLY_TO=
ALLOW_DEV_EMAIL_LOG=false
```

## Authentication and security

The application includes:

- local email/password authentication;
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
- learner/admin authorization;
- CORS configuration;
- rate limiting;
- Helmet security headers;
- Zod request validation.

Production deployments should use HTTPS, secure cookies, strong independent JWT secrets, exact allowed origins, deployment-managed secrets, and the correct production Google JavaScript origin.

## Available commands

### Backend

```bash
npm run dev
npm start
npm run seed
npm test
npm run test:watch
npm run check:gemini
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

## Backend tests

Backend tests focus on application behavior rather than source-code string checks.

Coverage includes authentication, Google authentication, role authorization, onboarding and enrollment switching, admin content lifecycle rules, attempt limits, quiz policy, AI response handling, and seed-data integrity.

Run:

```bash
cd backend
npm test
```

Google integration tests mock the external Google credential-verification boundary, so the backend suite does not call Google over the network.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Junior Project Scope](docs/JUNIOR_PROJECT_SCOPE.md)
- [Release Checklist](docs/RELEASE_CHECKLIST.md)

## Project focus

CodeMentor AI is designed as a practical full-stack learning platform with a clear MERN architecture. Its focus is understandable application flows, persistent learning state, secure authentication, useful learner feedback, and optional AI assistance without making AI responsible for core learning decisions.
