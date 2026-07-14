import { LearningGoal } from "../models/LearningGoal.js";
import { CoursePlan } from "../models/CoursePlan.js";
import { ApiError } from "../utils/ApiError.js";

export const getOnboardingStatus = async (userId) => {
  const activeCourse = await CoursePlan.findOne({
    user: userId,
    status: "active",
    isActive: true,
  }).select("_id title status");
  const latestGoal = await LearningGoal.findOne({ user: userId }).sort({
    createdAt: -1,
  });
  return {
    hasActiveCourse: Boolean(activeCourse),
    activeCourse,
    latestGoal,
  };
};

export const createLearningGoal = async ({
  userId,
  goalKey,
  goalTitle,
  level,
}) => {
  return LearningGoal.create({ user: userId, goalKey, goalTitle, level });
};

export const savePreferencesOnly = async ({
  userId,
  learningGoalId,
  preferences,
}) => {
  const goal = await LearningGoal.findOne({
    _id: learningGoalId,
    user: userId,
  });
  if (!goal) throw new ApiError(404, "Learning goal not found");

  Object.assign(goal, preferences, {
    assessmentPreference: "not_applicable",
    status: "completed",
  });
  await goal.save();
  return goal;
};

export const markAssessmentSkipped = async ({ userId, learningGoalId }) => {
  const goal = await LearningGoal.findOne({
    _id: learningGoalId,
    user: userId,
  });
  if (!goal) throw new ApiError(404, "Learning goal not found");
  goal.assessmentPreference = "skip";
  goal.status = "completed";
  await goal.save();
  return goal;
};
