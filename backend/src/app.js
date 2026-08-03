import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import { apiLimiter } from './middlewares/rateLimit.middleware.js';
import { csrfProtection } from './middlewares/csrf.middleware.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

import authRoutes from './routes/auth.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import roadmapRoutes from './routes/roadmap.routes.js';
import lessonRoutes from './routes/lesson.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import progressRoutes from './routes/progress.routes.js';
import mentorRoutes from './routes/mentor.routes.js';
import reportRoutes from './routes/report.routes.js';
import adminRoutes from './routes/admin.routes.js';
import aiUsageRoutes from './routes/aiUsage.routes.js';
import projectRoutes from './routes/project.routes.js';
import interviewRoutes from './routes/interview.routes.js';

const app = express();

if (env.trustProxy !== false) app.set('trust proxy', env.trustProxy);

app.use(helmet({
  contentSecurityPolicy: env.isProduction ? undefined : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  referrerPolicy: { policy: 'no-referrer' }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.isProduction ? 'combined' : 'dev'));
app.use('/api', apiLimiter);
app.use('/api', csrfProtection);

app.get('/health', (req, res) => res.json({ success: true, message: 'CodeMentor AI API is healthy' }));

app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/roadmaps', roadmapRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-usage', aiUsageRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/interview', interviewRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
