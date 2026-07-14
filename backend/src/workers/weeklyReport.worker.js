import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';
import { generateWeeklyReportForUser } from '../services/report.service.js';

export const startWeeklyReportWorker = () => {
  const connection = getRedisConnection();
  if (!connection) return null;

  return new Worker('weekly-report', async (job) => {
    return generateWeeklyReportForUser(job.data.userId);
  }, { connection });
};
