import { createQueue } from './queues.js';
export const weeklyReportQueue = createQueue('weekly-report');
export const addWeeklyReportJob = async (payload) => {
  if (!weeklyReportQueue) return null;
  return weeklyReportQueue.add('generate-weekly-report', payload, { attempts: 2 });
};
