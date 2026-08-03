import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const emptyToUndefined = (value) =>
  value === undefined || value === null || value === '' ? undefined : value;

const envBoolean = (defaultValue = false) =>
  z.preprocess((value) => {
    const normalized = emptyToUndefined(value);
    if (normalized === undefined) return defaultValue;
    if (typeof normalized === 'boolean') return normalized;
    if (typeof normalized === 'string') {
      const candidate = normalized.trim().toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(candidate)) return true;
      if (['false', '0', 'no', 'off'].includes(candidate)) return false;
    }
    return normalized;
  }, z.boolean());

const optionalString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalEmail = z.preprocess(emptyToUndefined, z.string().email().optional());
const optionalPort = z.preprocess(
  emptyToUndefined,
  z.coerce.number().int().min(1).max(65535).optional()
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    ALLOWED_ORIGINS: z.string().optional().default(''),

    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    ENABLE_MONGO_TRANSACTIONS: envBoolean(false),

    JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
    JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),

    COOKIE_SECURE: envBoolean(false),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    COOKIE_DOMAIN: optionalString,
    TRUST_PROXY: z.string().optional().default('false'),

    API_RATE_LIMIT: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(8),
    REGISTER_RATE_LIMIT: z.coerce.number().int().positive().default(10),
    PASSWORD_RESET_RATE_LIMIT: z.coerce.number().int().positive().default(5),
    AI_ROUTE_RATE_LIMIT: z.coerce.number().int().positive().default(40),
    ADMIN_WRITE_RATE_LIMIT: z.coerce.number().int().positive().default(80),

    ENABLE_CACHE: envBoolean(true),
    CACHE_DRIVER: z.enum(['memory', 'redis', 'disabled']).default('memory'),
    CACHE_DASHBOARD_TTL_SECONDS: z.coerce.number().int().positive().default(30),
    CACHE_CONTENT_TTL_SECONDS: z.coerce.number().int().positive().default(600),

    ENABLE_QUEUE: envBoolean(false),
    REDIS_URL: optionalUrl,

    ENABLE_AI: envBoolean(false),
    AI_PROVIDER: z.enum(['mock', 'gemini', 'openai']).default('mock'),
    GEMINI_API_KEY: optionalString,
    GEMINI_MODEL: z.string().min(1).default('gemini-1.5-flash'),
    OPENAI_API_KEY: optionalString,
    OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
    AI_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
    ENABLE_RAG: envBoolean(false),

    DAILY_MENTOR_LIMIT: z.coerce.number().int().positive().default(10),
    DAILY_ROADMAP_LIMIT: z.coerce.number().int().positive().default(1),
    DAILY_QUIZ_EXPLANATION_LIMIT: z.coerce.number().int().positive().default(3),
    WEEKLY_REPORT_LIMIT: z.coerce.number().int().positive().default(1),
    DAILY_PROJECT_REVIEW_LIMIT: z.coerce.number().int().positive().default(5),
    DAILY_INTERVIEW_FEEDBACK_LIMIT: z.coerce.number().int().positive().default(5),

    MAX_MENTOR_PROMPT_CHARS: z.coerce.number().int().positive().default(1000),
    MAX_PROJECT_CODE_CHARS: z.coerce.number().int().positive().default(15000),
    MAX_PROJECT_EXPLANATION_CHARS: z.coerce.number().int().positive().default(4000),
    MAX_INTERVIEW_ANSWER_CHARS: z.coerce.number().int().positive().default(3000),
    MAX_AI_CONTEXT_CHARS: z.coerce.number().int().positive().default(5000),
    AI_REPEAT_WINDOW_MINUTES: z.coerce.number().int().positive().default(10),
    AI_REPEAT_LIMIT: z.coerce.number().int().positive().default(3),

    EMAIL_ENABLED: envBoolean(false),
    SMTP_HOST: optionalString,
    SMTP_PORT: optionalPort,
    SMTP_SECURE: envBoolean(false),
    SMTP_USER: optionalString,
    SMTP_PASSWORD: optionalString,
    EMAIL_FROM_NAME: z.string().min(1).default('CodeMentor AI'),
    EMAIL_FROM_ADDRESS: optionalEmail,
    EMAIL_REPLY_TO: optionalEmail,
    EMAIL_VERIFY_CONNECTION: envBoolean(true),
    ALLOW_DEV_EMAIL_LOG: envBoolean(true),

    ENABLE_DEMO_MODE: envBoolean(false)
  })
  .superRefine((values, context) => {
    const originList = (values.ALLOWED_ORIGINS || values.CLIENT_URL)
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    originList.forEach((origin) => {
      if (!z.string().url().safeParse(origin).success) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ALLOWED_ORIGINS'],
          message: `Invalid allowed origin: ${origin}`
        });
      }
    });

    if (values.COOKIE_SAME_SITE === 'none' && !values.COOKIE_SECURE) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['COOKIE_SECURE'],
        message: 'COOKIE_SECURE must be true when COOKIE_SAME_SITE is none'
      });
    }

    if (values.ENABLE_QUEUE && !values.REDIS_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['REDIS_URL'],
        message: 'REDIS_URL is required when ENABLE_QUEUE is true'
      });
    }

    if (values.ENABLE_CACHE && values.CACHE_DRIVER === 'redis' && !values.REDIS_URL) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['REDIS_URL'],
        message: 'REDIS_URL is required when CACHE_DRIVER is redis'
      });
    }

    if (values.ENABLE_AI && values.AI_PROVIDER === 'gemini' && !values.GEMINI_API_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GEMINI_API_KEY'],
        message: 'GEMINI_API_KEY is required when Gemini AI is enabled'
      });
    }

    if (values.ENABLE_AI && values.AI_PROVIDER === 'openai' && !values.OPENAI_API_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY is required when OpenAI is enabled'
      });
    }

    if (values.EMAIL_ENABLED) {
      const requiredEmailFields = [
        ['SMTP_HOST', values.SMTP_HOST],
        ['SMTP_PORT', values.SMTP_PORT],
        ['SMTP_USER', values.SMTP_USER],
        ['SMTP_PASSWORD', values.SMTP_PASSWORD],
        ['EMAIL_FROM_ADDRESS', values.EMAIL_FROM_ADDRESS]
      ];

      requiredEmailFields.forEach(([field, value]) => {
        if (!value) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: [field],
            message: `${field} is required when EMAIL_ENABLED is true`
          });
        }
      });
    }
  });

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const values = result.data;
const allowedOrigins = Object.freeze(
  (values.ALLOWED_ORIGINS || values.CLIENT_URL)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const parseTrustProxy = (value) => {
  const normalized = String(value).trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false' || normalized === '') return false;
  if (/^\d+$/.test(normalized)) return Number(normalized);
  return value;
};

export const env = Object.freeze({
  nodeEnv: values.NODE_ENV,
  isDevelopment: values.NODE_ENV === 'development',
  isTest: values.NODE_ENV === 'test',
  isProduction: values.NODE_ENV === 'production',
  port: values.PORT,
  clientUrl: values.CLIENT_URL,
  allowedOrigins,

  mongoUri: values.MONGO_URI,
  enableMongoTransactions: values.ENABLE_MONGO_TRANSACTIONS,

  jwtAccessSecret: values.JWT_ACCESS_SECRET,
  jwtRefreshSecret: values.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: values.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: values.JWT_REFRESH_EXPIRES_IN,

  cookieSecure: values.COOKIE_SECURE,
  cookieSameSite: values.COOKIE_SAME_SITE,
  cookieDomain: values.COOKIE_DOMAIN,
  trustProxy: parseTrustProxy(values.TRUST_PROXY),

  rateLimits: Object.freeze({
    api: values.API_RATE_LIMIT,
    auth: values.AUTH_RATE_LIMIT,
    register: values.REGISTER_RATE_LIMIT,
    passwordReset: values.PASSWORD_RESET_RATE_LIMIT,
    aiRoute: values.AI_ROUTE_RATE_LIMIT,
    adminWrite: values.ADMIN_WRITE_RATE_LIMIT
  }),

  enableCache: values.ENABLE_CACHE,
  cacheDriver: values.CACHE_DRIVER,
  cacheDashboardTtlSeconds: values.CACHE_DASHBOARD_TTL_SECONDS,
  cacheContentTtlSeconds: values.CACHE_CONTENT_TTL_SECONDS,

  enableQueue: values.ENABLE_QUEUE,
  redisUrl: values.REDIS_URL,

  enableAi: values.ENABLE_AI,
  aiProvider: values.AI_PROVIDER,
  geminiApiKey: values.GEMINI_API_KEY,
  geminiModel: values.GEMINI_MODEL,
  openAiApiKey: values.OPENAI_API_KEY,
  openAiModel: values.OPENAI_MODEL,
  aiTimeoutMs: values.AI_TIMEOUT_MS,
  enableRag: values.ENABLE_RAG,

  aiLimits: Object.freeze({
    mentor: values.DAILY_MENTOR_LIMIT,
    roadmap: values.DAILY_ROADMAP_LIMIT,
    quizExplanation: values.DAILY_QUIZ_EXPLANATION_LIMIT,
    weeklyReport: values.WEEKLY_REPORT_LIMIT,
    projectReview: values.DAILY_PROJECT_REVIEW_LIMIT,
    interviewFeedback: values.DAILY_INTERVIEW_FEEDBACK_LIMIT
  }),

  aiInputLimits: Object.freeze({
    mentorPromptChars: values.MAX_MENTOR_PROMPT_CHARS,
    projectCodeChars: values.MAX_PROJECT_CODE_CHARS,
    projectExplanationChars: values.MAX_PROJECT_EXPLANATION_CHARS,
    interviewAnswerChars: values.MAX_INTERVIEW_ANSWER_CHARS,
    contextChars: values.MAX_AI_CONTEXT_CHARS,
    repeatWindowMinutes: values.AI_REPEAT_WINDOW_MINUTES,
    repeatLimit: values.AI_REPEAT_LIMIT
  }),

  emailEnabled: values.EMAIL_ENABLED,
  smtpHost: values.SMTP_HOST,
  smtpPort: values.SMTP_PORT,
  smtpSecure: values.SMTP_SECURE,
  smtpUser: values.SMTP_USER,
  smtpPassword: values.SMTP_PASSWORD,
  emailFromName: values.EMAIL_FROM_NAME,
  emailFromAddress: values.EMAIL_FROM_ADDRESS,
  emailReplyTo: values.EMAIL_REPLY_TO,
  emailVerifyConnection: values.EMAIL_VERIFY_CONNECTION,
  allowDevEmailLog: values.ALLOW_DEV_EMAIL_LOG,

  enableDemoMode: values.ENABLE_DEMO_MODE
});
