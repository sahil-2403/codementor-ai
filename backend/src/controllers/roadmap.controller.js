import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { LearningGoal } from '../models/LearningGoal.js';
import {
  getCurrentCourse,
  getRoadmapVersions,
  personalizeCurrentRoadmapLater
} from '../services/roadmap.service.js';
import {
  createRoadmapGenerationJobOrRun,
  getJobForUser,
  retryRoadmapGenerationJob
} from '../services/job.service.js';
import { ROADMAP_TYPES } from '../constants/roadmapTypes.js';

const toLearnerRoadmapJob = (job) => {
  if (!job) return null;
  const value = typeof job.toObject === 'function' ? job.toObject() : job;
  return {
    _id: value._id,
    type: value.type,
    status: value.status,
    attempts: value.attempts || 0,
    errorCode: value.errorCode || '',
    error: value.status === 'failed'
      ? 'Roadmap generation could not be completed. Please retry.'
      : '',
    completedAt: value.completedAt || null,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
};

const sendGenerationResult = (res, result, createdMessage) => {
  if (['queued', 'processing'].includes(result.mode)) {
    return sendResponse(res, 202, 'Roadmap generation is in progress', {
      job: toLearnerRoadmapJob(result.job),
      mode: result.mode
    });
  }

  if (result.mode === 'existing') {
    return sendResponse(res, 200, 'Existing roadmap found', {
      course: result.course,
      job: toLearnerRoadmapJob(result.job),
      mode: result.mode
    });
  }

  return sendResponse(res, 201, createdMessage, {
    course: result.course,
    job: toLearnerRoadmapJob(result.job),
    mode: result.mode
  });
};

export const generateOrGetRoadmap = asyncHandler(async (req, res) => {
  const latestGoal = await LearningGoal.findOne({ user: req.user._id, status: { $ne: 'archived' } }).sort({ createdAt: -1 });
  if (!latestGoal) {
    return sendResponse(res, 400, 'Choose a learning goal before generating a roadmap');
  }

  const roadmapType = latestGoal.assessmentPreference === 'not_applicable'
    ? ROADMAP_TYPES.TEMPLATE_AI_ADJUSTED
    : ROADMAP_TYPES.TEMPLATE;

  const result = await createRoadmapGenerationJobOrRun({
    userId: req.user._id,
    req,
    idempotent: true,
    payload: {
      userId: req.user._id,
      learningGoalId: latestGoal._id,
      roadmapType,
      generatedReason: latestGoal.assessmentPreference === 'skip'
        ? 'initial_template'
        : 'preference_adjusted'
    }
  });

  return sendGenerationResult(res, result, 'Roadmap created');
});

export const currentRoadmap = asyncHandler(async (req, res) => {
  const course = await getCurrentCourse(req.user._id);
  sendResponse(res, 200, 'Current roadmap', { course });
});

export const generateFromAssessment = asyncHandler(async (req, res) => {
  const { learningGoalId, assessmentId, forceNewVersion = false } = req.body;

  const result = await createRoadmapGenerationJobOrRun({
    userId: req.user._id,
    req,
    idempotent: !forceNewVersion,
    payload: {
      userId: req.user._id,
      learningGoalId,
      assessmentId,
      roadmapType: ROADMAP_TYPES.ASSESSMENT_AI_PERSONALIZED,
      generatedReason: 'assessment_personalized'
    }
  });

  return sendGenerationResult(res, result, 'Personalized roadmap version created from assessment');
});

export const retryRoadmapJob = asyncHandler(async (req, res) => {
  const result = await retryRoadmapGenerationJob({
    userId: req.user._id,
    jobId: req.params.jobId,
    req
  });

  return sendGenerationResult(res, result, 'Roadmap regenerated');
});

export const versions = asyncHandler(async (req, res) => {
  const roadmapVersions = await getRoadmapVersions(req.user._id);
  sendResponse(res, 200, 'Roadmap versions', { roadmapVersions });
});

export const personalizeLater = asyncHandler(async (req, res) => {
  const result = await personalizeCurrentRoadmapLater({ userId: req.user._id });
  sendResponse(res, 200, 'Personalization flow ready', result);
});

export const roadmapJobStatus = asyncHandler(async (req, res) => {
  const data = await getJobForUser({
    userId: req.user._id,
    jobId: req.params.jobId
  });
  sendResponse(res, 200, 'Roadmap job status', {
    job: toLearnerRoadmapJob(data.job),
    course: data.course
  });
});
