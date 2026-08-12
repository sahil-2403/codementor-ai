import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { verifyEmailTransport } from './email/emailTransport.js';

let server = null;
let shuttingDown = false;

const closeHttpServer = () => new Promise((resolve) => {
  if (!server) return resolve();
  server.close(() => resolve());
});

const shutdown = async (signal, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}. Shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    await closeHttpServer();
    await disconnectDB();
    clearTimeout(forceExit);
    process.exit(exitCode);
  } catch (error) {
    console.error('Graceful shutdown failed:', error.message);
    process.exit(1);
  }
};

const start = async () => {
  await connectDB();
  await verifyEmailTransport();

  server = app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    console.log('Capabilities:', {
      environment: env.nodeEnv,
      gemini: env.enableAi && Boolean(env.geminiApiKey),
      email: env.emailEnabled,
      cache: env.enableCache ? 'memory' : 'disabled'
    });
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason instanceof Error ? reason.message : reason);
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error.message);
  shutdown('uncaughtException', 1);
});

start().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
