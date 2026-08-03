import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import { startRoadmapWorker } from './roadmap.worker.js';
import { startWeeklyReportWorker } from './weeklyReport.worker.js';
import { startEmbeddingWorker } from './embedding.worker.js';

await connectDB();
const workers = [startRoadmapWorker(), startWeeklyReportWorker(), startEmbeddingWorker()].filter(Boolean);

if (!workers.length) {
  console.log(env.enableQueue
    ? 'No workers started. Check Redis and worker configuration.'
    : 'Queue workers are disabled.');
} else {
  console.log(`Started ${workers.length} worker(s).`);
}
