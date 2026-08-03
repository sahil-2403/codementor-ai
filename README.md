# CodeMentor AI

CodeMentor AI is a MERN learning platform with structured onboarding, roadmap-based learning, lessons, quizzes, projects, interview practice, progress tracking, and optional AI-assisted guidance.

## Stack

### Frontend

- React 18
- Vite 5
- React Router 6
- TanStack Query
- Axios
- React Hook Form
- Zod
- Tailwind CSS 3

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- JWT authentication with HTTP-only cookies
- Optional Redis and BullMQ support

## Local setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

The backend runs at `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

## Optional queue worker

Roadmap and report queues are optional. Keep `ENABLE_QUEUE=false` unless Redis is configured and the worker process is running.

```bash
cd backend
npm run worker
```

## Core learner flow

```text
Register and verify email
→ Complete onboarding
→ Receive a roadmap
→ Study lessons
→ Take quizzes
→ Review weak topics
→ Complete projects
→ Practise interview answers
→ Track progress
```

## Admin scope

The admin area is intentionally limited to learning-content management:

- Topics
- Lessons
- Questions
- Roadmap templates

## Development status

The project is being refactored toward a Gemini-only AI integration, Nodemailer-based transactional email, stricter data-integrity rules, and a calmer shared design system. The application remains usable with optional AI and queue features disabled.
