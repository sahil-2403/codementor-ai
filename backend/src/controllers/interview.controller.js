import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { getInterviewQuestion, listInterviewAttempts, listInterviewQuestions, reviewInterviewAttempt, submitInterviewAnswer } from '../services/interview.service.js';
import { logActivity } from '../services/activityLog.service.js';

export const getInterviewQuestions = asyncHandler(async (req, res) => {
  const questions = await listInterviewQuestions({ topic: req.query.topic, difficulty: req.query.difficulty, type: req.query.type });
  sendResponse(res, 200, 'Interview questions', { questions });
});

export const getInterviewQuestionById = asyncHandler(async (req, res) => {
  const question = await getInterviewQuestion({ questionId: req.params.questionId, userId: req.user._id });
  sendResponse(res, 200, 'Interview question', { question });
});

export const createInterviewAttempt = asyncHandler(async (req, res) => {
  const attempt = await submitInterviewAnswer({ user: req.user, ...req.body });
  await logActivity({ user: req.user._id, action: 'interview_attempt_completed', entityType: 'InterviewAttempt', entityId: attempt._id, message: 'Learner saved an interview practice answer', metadata: { score: attempt.score, question: req.body.questionId, status: attempt.status }, req });
  sendResponse(res, 201, attempt.status === 'reviewed' ? 'Interview answer reviewed' : 'Interview answer saved; feedback is currently unavailable', { attempt });
});

export const retryInterviewReview = asyncHandler(async (req, res) => {
  const attempt = await reviewInterviewAttempt({ user: req.user, attemptId: req.params.attemptId });
  await logActivity({ user: req.user._id, action: 'interview_review_retried', entityType: 'InterviewAttempt', entityId: attempt._id, message: 'Learner retried interview feedback', metadata: { score: attempt.score, status: attempt.status }, req });
  sendResponse(res, 200, attempt.status === 'reviewed' ? 'Interview answer reviewed' : 'Interview feedback is currently unavailable', { attempt });
});

export const getInterviewAttempts = asyncHandler(async (req, res) => {
  const attempts = await listInterviewAttempts({ userId: req.user._id });
  sendResponse(res, 200, 'Interview attempts', { attempts });
});
