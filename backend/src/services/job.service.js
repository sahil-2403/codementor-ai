import { AIJob } from '../models/AIJob.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { addRoadmapJob, roadmapQueue } from '../jobs/roadmap.queue.js';
import { createCourseFromTemplate } from './roadmap.service.js';
import { logActivity } from './activityLog.service.js';
import { makeSearchRegex } from '../utils/pagination.js';
import { listWithPagination } from './listQuery.service.js';
import { ApiError } from '../utils/ApiError.js';
import { env, isQueueEnabled } from '../config/env.js';
import { ONBOARDING_STATES } from '../constants/onboardingStates.js';
import { setRoadmapOnboardingState } from './onboarding.service.js';
import { createRoadmapIdempotencyKey } from '../domain/roadmapIdempotency.js';

const ROADMAP_JOB_TYPE = 'roadmap_generation';
const ROADMAP_LOCK_KEY = 'roadmap_generation';
const activeStatuses = ['queued', 'processing'];
const ROADMAP_JOB_STALE_MS = Math.max(15 * 60 * 1000, env.aiTimeoutMs * 3);

const shouldUseRoadmapQueue = () => Boolean(roadmapQueue && isQueueEnabled());
const isDuplicateKeyError = (error) => error?.code === 11000;

export { createRoadmapIdempotencyKey };


const findActiveRoadmapJobs = (userId) => AIJob.find({
  user: userId,
  type: ROADMAP_JOB_TYPE,
  status: { $in: activeStatuses }
}).sort({ createdAt: -1 });

const isRoadmapJobStale = (job) => {
  if (!job || !activeStatuses.includes(job.status)) return false;
  const lastUpdatedAt = job.updatedAt || job.createdAt;
  return lastUpdatedAt && lastUpdatedAt.getTime() < Date.now() - ROADMAP_JOB_STALE_MS;
};

const markStaleRoadmapJobFailed = async (job) => {
  if (!isRoadmapJobStale(job)) return job;

  const savedCourse = await findCourseForJob(job);
  if (savedCourse) {
    const completedJob = await AIJob.findOneAndUpdate(
      { _id: job._id, status: { $in: activeStatuses } },
      {
        $set: {
          status: 'completed',
          'output.coursePlanId': savedCourse._id,
          completedAt: new Date(),
          error: '',
          errorCode: ''
        },
        $unset: { lockKey: 1 }
      },
      { new: true }
    );

    if (completedJob?.input?.learningGoalId) {
      await setRoadmapOnboardingState({
        userId: completedJob.user,
        learningGoalId: completedJob.input.learningGoalId,
        state: ONBOARDING_STATES.COMPLETED,
        roadmapJobId: completedJob._id
      });
    }

    return completedJob || AIJob.findById(job._id);
  }

  const staleJob = await AIJob.findOneAndUpdate(
    {
      _id: job._id,
      status: { $in: activeStatuses },
      updatedAt: { $lt: new Date(Date.now() - ROADMAP_JOB_STALE_MS) }
    },
    {
      $set: {
        status: 'failed',
        error: 'Roadmap generation stopped before completion.',
        errorCode: 'ROADMAP_JOB_STALE',
        completedAt: new Date()
      },
      $unset: { lockKey: 1 }
    },
    { new: true }
  );

  if (!staleJob) return AIJob.findById(job._id);

  if (staleJob.input?.learningGoalId) await setRoadmapOnboardingState({
    userId: staleJob.user,
    learningGoalId: staleJob.input?.learningGoalId,
    state: ONBOARDING_STATES.ROADMAP_FAILED,
    roadmapJobId: staleJob._id,
    errorCode: 'ROADMAP_JOB_STALE',
    errorMessage: 'Roadmap generation stopped before completion. Please retry.'
  });

  return staleJob;
};

const findBlockingActiveRoadmapJob = async (userId) => {
  const jobs = await findActiveRoadmapJobs(userId);

  for (const job of jobs) {
    const currentJob = isRoadmapJobStale(job)
      ? await markStaleRoadmapJobFailed(job)
      : job;
    if (currentJob && activeStatuses.includes(currentJob.status)) return currentJob;
  }

  return null;
};

async function findCourseForJob(job) {
  if (job.output?.coursePlanId) {
    const course = await CoursePlan.findById(job.output.coursePlanId);
    if (course) return course;
  }

  if (job.idempotencyKey) {
    const course = await CoursePlan.findOne({ user: job.user, generationKey: job.idempotencyKey });
    if (course) return course;
  }

  return CoursePlan.findOne({ generationJob: job._id });
}

const findLegacyExistingCourse = async ({ userId, payload }) => {
  if (payload.assessmentId) return null;

  return CoursePlan.findOne({
    user: userId,
    learningGoal: payload.learningGoalId,
    status: 'active',
    isActive: true
  }).sort({ createdAt: -1 });
};

const setJobFailed = async ({ aiJob, payload, error }) => {
  aiJob.status = 'failed';
  aiJob.error = error.message;
  aiJob.errorCode = error.code || 'ROADMAP_GENERATION_FAILED';
  aiJob.completedAt = new Date();
  aiJob.lockKey = undefined;
  await aiJob.save();

  await setRoadmapOnboardingState({
    userId: aiJob.user,
    learningGoalId: payload.learningGoalId,
    state: ONBOARDING_STATES.ROADMAP_FAILED,
    roadmapJobId: aiJob._id,
    errorCode: error.code || 'ROADMAP_GENERATION_FAILED',
    errorMessage: 'Roadmap generation could not be completed. Please retry.'
  });
};

const runRoadmapJob = async ({ aiJob, payload, req = null }) => {
  const canQueue = shouldUseRoadmapQueue();

  await setRoadmapOnboardingState({
    userId: aiJob.user,
    learningGoalId: payload.learningGoalId,
    state: ONBOARDING_STATES.ROADMAP_GENERATING,
    roadmapJobId: aiJob._id
  });

  if (canQueue) {
    try {
      const queueAttempt = (aiJob.attempts || 0) + 1;
      const bullJobId = `roadmap-${aiJob._id}-${queueAttempt}`;

      aiJob.status = 'queued';
      aiJob.output = {
        bullJobId,
        queue: 'roadmap-generation'
      };
      await aiJob.save();

      const bullJob = await addRoadmapJob(
        {
          ...payload,
          aiJobId: aiJob._id.toString(),
          attemptBase: aiJob.attempts || 0
        },
        { jobId: bullJobId }
      );

      await logActivity({
        user: aiJob.user,
        action: 'roadmap_job_queued',
        entityType: 'AIJob',
        entityId: aiJob._id,
        message: 'Roadmap generation job queued',
        metadata: {
          bullJobId: bullJob?.id || bullJobId,
          roadmapType: payload.roadmapType,
          idempotencyKey: aiJob.idempotencyKey || null
        },
        req
      });

      return { mode: 'queued', job: aiJob };
    } catch (error) {
      await setJobFailed({ aiJob, payload, error });
      throw error;
    }
  }

  aiJob.status = 'processing';
  aiJob.attempts = (aiJob.attempts || 0) + 1;
  await aiJob.save();

  try {
    const course = await createCourseFromTemplate({
      ...payload,
      generationJobId: aiJob._id,
      generationKey: aiJob.idempotencyKey || null
    });

    await setRoadmapOnboardingState({
      userId: aiJob.user,
      learningGoalId: payload.learningGoalId,
      state: ONBOARDING_STATES.COMPLETED,
      roadmapJobId: aiJob._id
    });

    aiJob.status = 'completed';
    aiJob.output = { coursePlanId: course._id, mode: 'sync' };
    aiJob.completedAt = new Date();
    aiJob.error = '';
    aiJob.errorCode = '';
    aiJob.lockKey = undefined;
    await aiJob.save();

    await logActivity({
      user: aiJob.user,
      action: 'roadmap_job_completed_sync',
      entityType: 'CoursePlan',
      entityId: course._id,
      message: 'Roadmap generated synchronously',
      metadata: {
        jobId: aiJob._id,
        version: course.version,
        roadmapType: course.roadmapType,
        idempotencyKey: aiJob.idempotencyKey || null
      },
      req
    });

    return { mode: 'sync', job: aiJob, course };
  } catch (error) {
    await setJobFailed({ aiJob, payload, error });
    throw error;
  }
};

const claimFailedRoadmapJob = async ({ userId, jobId }) => {
  const blockingJob = await findBlockingActiveRoadmapJob(userId);
  if (blockingJob) {
    throw new ApiError(
      409,
      'Another roadmap generation is already in progress',
      [],
      'ROADMAP_GENERATION_IN_PROGRESS'
    );
  }

  const nextStatus = shouldUseRoadmapQueue() ? 'queued' : 'processing';

  try {
    return await AIJob.findOneAndUpdate(
      { _id: jobId, user: userId, type: ROADMAP_JOB_TYPE, status: 'failed' },
      {
        $set: {
          status: nextStatus,
          lockKey: ROADMAP_LOCK_KEY,
          error: '',
          errorCode: '',
          output: {},
          completedAt: null
        }
      },
      { new: true }
    );
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;
    throw new ApiError(
      409,
      'Another roadmap generation is already in progress',
      [],
      'ROADMAP_GENERATION_IN_PROGRESS'
    );
  }
};

const resolveExistingRoadmapJob = async ({ userId, job, req = null, retryFailed = true }) => {
  if (!job) return null;

  let currentJob = job;
  if (isRoadmapJobStale(currentJob)) {
    currentJob = await markStaleRoadmapJobFailed(currentJob);
  }
  if (!currentJob) return null;

  if (currentJob.status === 'completed') {
    const course = await findCourseForJob(currentJob);
    if (course) return { mode: 'existing', course, job: currentJob };

    currentJob.status = 'failed';
    currentJob.error = 'Completed roadmap job did not reference a saved course.';
    currentJob.errorCode = 'ROADMAP_OUTPUT_MISSING';
    currentJob.completedAt = new Date();
    currentJob.lockKey = undefined;
    await currentJob.save();
  }

  if (activeStatuses.includes(currentJob.status)) {
    return { mode: currentJob.status, job: currentJob };
  }

  if (currentJob.status === 'failed' && retryFailed) {
    const claimedJob = await claimFailedRoadmapJob({ userId, jobId: currentJob._id });
    if (!claimedJob) {
      const latestJob = await AIJob.findOne({ _id: currentJob._id, user: userId });
      return resolveExistingRoadmapJob({ userId, job: latestJob, req, retryFailed: false });
    }
    return runRoadmapJob({ aiJob: claimedJob, payload: claimedJob.input, req });
  }

  return { mode: currentJob.status, job: currentJob };
};

export const createRoadmapGenerationJobOrRun = async ({
  userId,
  payload,
  req = null,
  idempotent = false
}) => {
  const idempotencyKey = idempotent ? createRoadmapIdempotencyKey(payload) : undefined;

  if (idempotencyKey) {
    const existingJob = await AIJob.findOne({
      user: userId,
      type: ROADMAP_JOB_TYPE,
      idempotencyKey
    }).sort({ createdAt: -1 });

    const resolved = await resolveExistingRoadmapJob({ userId, job: existingJob, req });
    if (resolved) return resolved;
  }

  const activeJob = await findBlockingActiveRoadmapJob(userId);
  if (activeJob) {
    throw new ApiError(
      409,
      'A roadmap generation job is already in progress. Please wait for it to finish.',
      [],
      'ROADMAP_GENERATION_IN_PROGRESS'
    );
  }

  if (idempotencyKey) {
    const legacyCourse = await findLegacyExistingCourse({ userId, payload });
    if (legacyCourse) return { mode: 'existing', course: legacyCourse, job: null };
  }

  let aiJob;
  try {
    aiJob = await AIJob.create({
      user: userId,
      type: ROADMAP_JOB_TYPE,
      status: shouldUseRoadmapQueue() ? 'queued' : 'processing',
      input: payload,
      attempts: 0,
      idempotencyKey,
      lockKey: ROADMAP_LOCK_KEY
    });
  } catch (error) {
    if (!isDuplicateKeyError(error)) throw error;

    if (idempotencyKey) {
      const existingJob = await AIJob.findOne({
        user: userId,
        type: ROADMAP_JOB_TYPE,
        idempotencyKey
      });
      const resolved = await resolveExistingRoadmapJob({ userId, job: existingJob, req });
      if (resolved) return resolved;
    }

    const concurrentJob = await findBlockingActiveRoadmapJob(userId);
    if (concurrentJob?.idempotencyKey && concurrentJob.idempotencyKey === idempotencyKey) {
      return { mode: concurrentJob.status, job: concurrentJob };
    }

    throw new ApiError(
      409,
      'Another roadmap generation is already in progress',
      [],
      'ROADMAP_GENERATION_IN_PROGRESS'
    );
  }

  return runRoadmapJob({ aiJob, payload, req });
};

export const retryRoadmapGenerationJob = async ({ userId, jobId, req = null }) => {
  const job = await AIJob.findOne({ _id: jobId, user: userId, type: ROADMAP_JOB_TYPE });
  if (!job) throw new ApiError(404, 'Roadmap job not found', [], 'ROADMAP_JOB_NOT_FOUND');

  const result = await resolveExistingRoadmapJob({ userId, job, req, retryFailed: true });
  if (!result) {
    throw new ApiError(409, 'Roadmap job cannot be retried', [], 'ROADMAP_JOB_NOT_RETRYABLE');
  }
  return result;
};

export const getJobForUser = async ({ userId, jobId, isAdmin = false }) => {
  const filter = { _id: jobId };
  if (!isAdmin) filter.user = userId;

  let job = await AIJob.findOne(filter);
  if (!job) throw new ApiError(404, 'Job not found');

  if (job.type === ROADMAP_JOB_TYPE && isRoadmapJobStale(job)) {
    job = await markStaleRoadmapJobFailed(job);
  }
  if (isAdmin && job) await job.populate('user', 'name email role');

  let course = null;

  if (job.output?.coursePlanId) {
    course = await CoursePlan.findById(job.output.coursePlanId).select(
      '_id title version status isActive roadmapType'
    );
  }

  if (!course) {
    course = await CoursePlan.findOne({ generationJob: job._id })
      .select('_id title version status isActive roadmapType')
      .sort({ createdAt: -1 });
  }

  return { job, course };
};

export const listJobs = async (query = {}) => {
  const search = makeSearchRegex(query.search);
  const filter = {};

  if (search) filter.$or = [{ type: search }, { status: search }, { error: search }];
  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.user) filter.user = query.user;

  return listWithPagination({
    model: AIJob,
    filter,
    query,
    populate: [{ path: 'user', select: 'name email role' }]
  });
};
