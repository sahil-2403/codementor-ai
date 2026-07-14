import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getQuizForModule, submitQuiz, explainQuizAttempt } from '../services/quiz.service.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { logActivity } from '../services/activityLog.service.js';

export const getModuleQuiz = asyncHandler(async (req, res) => {
  const quiz = await getQuizForModule({ userId: req.user._id, moduleId: req.params.moduleId });
  sendResponse(res, 200, 'Module quiz', { quiz });
});

export const submitModuleQuiz = asyncHandler(async (req, res) => {
  const attempt = await submitQuiz({ userId: req.user._id, ...req.body });
  await logActivity({ user: req.user._id, action: 'quiz_submitted', entityType: 'QuizAttempt', entityId: attempt._id, message: `Quiz submitted with score ${attempt.score}%`, metadata: { score: attempt.score, moduleId: req.body.moduleId }, req });
  sendResponse(res, 201, 'Quiz submitted', { attempt });
});

export const getAttempt = asyncHandler(async (req, res) => {
  const attempt = await QuizAttempt.findOne({ _id: req.params.attemptId, user: req.user._id }).populate('answers.question');
  sendResponse(res, 200, 'Quiz attempt', { attempt });
});

export const explainAttempt = asyncHandler(async (req, res) => {
  const attempt = await explainQuizAttempt({ user: req.user, attemptId: req.params.attemptId });
  await logActivity({ user: req.user._id, action: 'quiz_ai_explanation_requested', entityType: 'QuizAttempt', entityId: attempt._id, message: 'Learner requested AI quiz mistake explanation', req });
  sendResponse(res, 200, 'Quiz mistakes explained', { attempt });
});
