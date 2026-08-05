import { Worker } from 'bullmq';
import { getRedisConnection } from '../config/redis.js';
import { AIJob } from '../models/AIJob.js';
import { createCourseFromTemplate } from '../services/roadmap.service.js';
import { logActivity } from '../services/activityLog.service.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';
import { setRoadmapOnboardingState } from '../services/onboarding.service.js';

const sameJobId = (left, right) => String(left || '') === String(right || '');

export const startRoadmapWorker = () => {
  const connection = getRedisConnection();
  if (!connection) return null;

  return new Worker('roadmap-generation', async (job) => {
    const { aiJobId, attemptBase = 0, ...payload } = job.data;
    const totalAttempt = attemptBase + job.attemptsMade + 1;
    let aiJob = aiJobId ? await AIJob.findById(aiJobId) : null;

    if (aiJob?.status === 'completed') {
      return {
        coursePlanId: aiJob.output?.coursePlanId?.toString?.() || null,
        reused: true
      };
    }

    if (aiJob?.output?.bullJobId && !sameJobId(aiJob.output.bullJobId, job.id)) {
      return { ignored: true, reason: 'superseded_queue_execution' };
    }

    if (aiJob) {
      const executionFilter = {
        _id: aiJob._id,
        status: { $in: ['queued', 'processing'] }
      };
      if (aiJob.output?.bullJobId) executionFilter['output.bullJobId'] = aiJob.output.bullJobId;

      aiJob = await AIJob.findOneAndUpdate(
        executionFilter,
        {
          $set: {
            status: 'processing',
            'output.bullJobId': job.id
          },
          $max: { attempts: totalAttempt }
        },
        { new: true }
      );

      if (!aiJob) return { ignored: true, reason: 'roadmap_job_no_longer_active' };
    }

    try {
      const course = await createCourseFromTemplate({
        ...payload,
        generationJobId: aiJob?._id || null,
        generationKey: aiJob?.idempotencyKey || `bull-${job.id}`
      });

      let completedJob = null;
      if (aiJob) {
        completedJob = await AIJob.findOneAndUpdate(
          {
            _id: aiJob._id,
            status: { $in: ['queued', 'processing'] },
            'output.bullJobId': job.id
          },
          {
            $set: {
              status: 'completed',
              'output.coursePlanId': course._id,
              'output.bullJobId': job.id,
              completedAt: new Date(),
              error: '',
              errorCode: ''
            },
            $max: { attempts: totalAttempt },
            $unset: { lockKey: 1 }
          },
          { new: true }
        );
      }

      if (!aiJob || completedJob) {
        await setRoadmapOnboardingState({
          userId: payload.userId,
          learningGoalId: payload.learningGoalId,
          state: ONBOARDING_STATES.COMPLETED,
          roadmapJobId: aiJob?._id || null
        });
      }

      await logActivity({
        user: payload.userId,
        action: completedJob || !aiJob ? 'roadmap_job_completed' : 'roadmap_job_superseded_after_course_creation',
        entityType: 'CoursePlan',
        entityId: course._id,
        message: completedJob || !aiJob
          ? 'Roadmap generation worker completed successfully'
          : 'A superseded roadmap worker finished without overwriting the active job',
        metadata: {
          jobId: aiJobId,
          bullJobId: job.id,
          version: course.version,
          roadmapType: course.roadmapType,
          totalAttempt
        }
      });

      return {
        coursePlanId: course._id.toString(),
        version: course.version,
        superseded: Boolean(aiJob && !completedJob)
      };
    } catch (error) {
      const hasMoreBullAttempts = job.attemptsMade + 1 < (job.opts.attempts || 1);
      let updatedJob = null;

      if (aiJob) {
        updatedJob = await AIJob.findOneAndUpdate(
          {
            _id: aiJob._id,
            status: { $in: ['queued', 'processing'] },
            'output.bullJobId': job.id
          },
          {
            $set: {
              status: hasMoreBullAttempts ? 'processing' : 'failed',
              error: error.message,
              errorCode: error.code || 'ROADMAP_GENERATION_FAILED',
              completedAt: hasMoreBullAttempts ? null : new Date()
            },
            $max: { attempts: totalAttempt },
            ...(hasMoreBullAttempts ? {} : { $unset: { lockKey: 1 } })
          },
          { new: true }
        );
      }

      if (updatedJob && !hasMoreBullAttempts) {
        await setRoadmapOnboardingState({
          userId: payload.userId,
          learningGoalId: payload.learningGoalId,
          state: ONBOARDING_STATES.ROADMAP_FAILED,
          roadmapJobId: updatedJob._id,
          errorCode: error.code || 'ROADMAP_GENERATION_FAILED',
          errorMessage: 'Roadmap generation could not be completed. Please retry.'
        });
      }

      await logActivity({
        user: payload.userId,
        action: !updatedJob
          ? 'roadmap_job_superseded_after_failure'
          : (hasMoreBullAttempts ? 'roadmap_job_retrying' : 'roadmap_job_failed'),
        entityType: 'AIJob',
        entityId: aiJob?._id || null,
        severity: !updatedJob || hasMoreBullAttempts ? 'warning' : 'critical',
        message: error.message,
        metadata: {
          bullJobId: job.id,
          roadmapType: payload.roadmapType,
          attemptsMade: totalAttempt,
          hasMoreBullAttempts,
          superseded: Boolean(aiJob && !updatedJob)
        }
      });

      if (!updatedJob && aiJob) {
        return { ignored: true, reason: 'superseded_queue_failure' };
      }

      throw error;
    }
  }, { connection });
};
