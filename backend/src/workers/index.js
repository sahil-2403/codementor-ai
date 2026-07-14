import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { startRoadmapWorker } from './roadmap.worker.js';
import { startWeeklyReportWorker } from './weeklyReport.worker.js';
import { startEmbeddingWorker } from './embedding.worker.js';

await connectDB();
const workers = [startRoadmapWorker(), startWeeklyReportWorker(), startEmbeddingWorker()].filter(Boolean);

if (!workers.length) {
  console.log('No workers started. Set ENABLE_QUEUE=true and configure REDIS_URL to enable workers.');
} else {
  console.log(`Started ${workers.length} worker(s).`);
}
