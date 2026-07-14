import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';
import { AIJob } from '../models/AIJob.js';
import { createCourseFromTemplate } from '../services/roadmap.service.js';
import { logActivity } from '../services/activityLog.service.js';

export const startRoadmapWorker = () => {
  const connection = getRedisConnection();
  if (!connection) return null;

  return new Worker('roadmap-generation', async (job) => {
    const { aiJobId, ...payload } = job.data;
    const aiJob = aiJobId ? await AIJob.findById(aiJobId) : null;

    if (aiJob) {
      aiJob.status = 'processing';
      aiJob.attempts = job.attemptsMade + 1;
      await aiJob.save();
    }

    try {
      const course = await createCourseFromTemplate(payload);

      if (aiJob) {
        aiJob.status = 'completed';
        aiJob.output = { ...(aiJob.output || {}), coursePlanId: course._id, bullJobId: job.id };
        aiJob.completedAt = new Date();
        aiJob.attempts = job.attemptsMade + 1;
        await aiJob.save();
      }

      await logActivity({
        user: payload.userId,
        action: 'roadmap_job_completed',
        entityType: 'CoursePlan',
        entityId: course._id,
        message: 'Roadmap generation worker completed successfully',
        metadata: { jobId: aiJobId, bullJobId: job.id, version: course.version, roadmapType: course.roadmapType }
      });

      return { coursePlanId: course._id.toString(), version: course.version };
    } catch (error) {
      if (aiJob) {
        aiJob.status = 'failed';
        aiJob.error = error.message;
        aiJob.completedAt = new Date();
        aiJob.attempts = job.attemptsMade + 1;
        await aiJob.save();
      }
      await logActivity({
        user: payload.userId,
        action: 'roadmap_job_failed',
        entityType: 'AIJob',
        entityId: aiJob?._id || null,
        severity: 'critical',
        message: error.message,
        metadata: { bullJobId: job.id, roadmapType: payload.roadmapType }
      });
      throw error;
    }
  }, { connection });
};
