import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import { askMentor, getMentorHistory, getMentorSuggestions } from '../services/mentor.service.js';
import { logActivity } from '../services/activityLog.service.js';

export const ask = asyncHandler(async (req, res) => {
  const result = await askMentor({ user: req.user, message: req.body.message, lessonId: req.body.lessonId, promptType: req.body.promptType });
  await logActivity({ user: req.user._id, action: 'mentor_question_asked', entityType: 'MentorChat', entityId: result.chat?._id || null, message: 'Learner asked the AI mentor a question', metadata: { promptType: req.body.promptType, lessonId: req.body.lessonId }, req });
  sendResponse(res, 200, 'Mentor answered', result);
});

export const history = asyncHandler(async (req, res) => {
  const chats = await getMentorHistory(req.user._id);
  sendResponse(res, 200, 'Mentor history', { chats });
});

export const suggestions = asyncHandler(async (req, res) => {
  const prompts = await getMentorSuggestions({ userId: req.user._id, lessonId: req.query.lessonId });
  sendResponse(res, 200, 'Mentor suggestions', prompts);
});
