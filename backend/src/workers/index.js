import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { closeRedisConnection } from '../config/redis.js';
import { startRoadmapWorker } from './roadmap.worker.js';
import { startWeeklyReportWorker } from './weeklyReport.worker.js';
import { startEmbeddingWorker } from './embedding.worker.js';

let workers = [];
let shuttingDown = false;

const shutdown = async (signal, exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Worker process received ${signal}. Shutting down.`);

  try {
    await Promise.allSettled(workers.map((worker) => worker.close()));
    await closeRedisConnection();
    await disconnectDB();
    process.exit(exitCode);
  } catch (error) {
    console.error('Worker shutdown failed:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled worker rejection:', reason instanceof Error ? reason.message : reason);
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught worker exception:', error.message);
  shutdown('uncaughtException', 1);
});

await connectDB();
workers = [startRoadmapWorker(), startWeeklyReportWorker(), startEmbeddingWorker()].filter(Boolean);

if (!workers.length) {
  console.log(env.enableQueue
    ? 'No workers started. Check Redis and worker configuration.'
    : 'Queue workers are disabled.');
} else {
  console.log(`Started ${workers.length} worker(s).`);
}
