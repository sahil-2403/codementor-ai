import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/ApiResponse.js";
import { LearningGoal } from "../models/LearningGoal.js";
import {
  getCurrentCourse,
  getRoadmapVersions,
  personalizeCurrentRoadmapLater,
} from "../services/roadmap.service.js";
import {
  createRoadmapGenerationJobOrRun,
  getJobForUser,
} from "../services/job.service.js";
import { ROADMAP_TYPES } from "../constants/roadmapTypes.js";

export const generateOrGetRoadmap = asyncHandler(async (req, res) => {
  const latestGoal = await LearningGoal.findOne({ user: req.user._id }).sort({
    createdAt: -1,
  });
  if (!latestGoal)
    return sendResponse(
      res,
      400,
      "Choose a learning goal before generating a roadmap",
    );

  const roadmapType =
    latestGoal.assessmentPreference === "not_applicable"
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
      generatedReason:
        latestGoal.assessmentPreference === "skip"
          ? "initial_template"
          : "preference_adjusted",
    },
  });

  if (result.mode === "queued")
    return sendResponse(res, 202, "Roadmap generation job queued", {
      job: result.job,
      mode: result.mode,
    });
  if (result.mode === "existing")
    return sendResponse(res, 200, "Existing roadmap found", {
      course: result.course,
      mode: result.mode,
    });
  return sendResponse(res, 201, "Roadmap created", {
    course: result.course,
    job: result.job,
    mode: result.mode,
  });
});

export const currentRoadmap = asyncHandler(async (req, res) => {
  const course = await getCurrentCourse(req.user._id);
  sendResponse(res, 200, "Current roadmap", { course });
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
      generatedReason: "assessment_personalized",
    },
  });

  if (result.mode === "existing") {
    return sendResponse(res, 200, "Existing roadmap found", {
      course: result.course,
      job: null,
      mode: result.mode,
    });
  }

  if (result.mode === "queued") {
    return sendResponse(res, 202, "Roadmap generation job queued", {
      job: result.job,
      mode: result.mode,
    });
  }

  sendResponse(
    res,
    201,
    "Personalized roadmap version created from assessment",
    {
      course: result.course,
      job: result.job,
      mode: result.mode,
    },
  );
});

export const versions = asyncHandler(async (req, res) => {
  const roadmapVersions = await getRoadmapVersions(req.user._id);
  sendResponse(res, 200, "Roadmap versions", { roadmapVersions });
});

export const personalizeLater = asyncHandler(async (req, res) => {
  const result = await personalizeCurrentRoadmapLater({ userId: req.user._id });
  sendResponse(res, 200, "Personalization flow ready", result);
});

export const roadmapJobStatus = asyncHandler(async (req, res) => {
  const data = await getJobForUser({
    userId: req.user._id,
    jobId: req.params.jobId,
  });
  sendResponse(res, 200, "Roadmap job status", data);
});
