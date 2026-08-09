import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/ApiResponse.js';
import * as adminContent from '../services/adminContent.service.js';

export const listTopics = asyncHandler(async (req, res) => {
  const { items, pagination } = await adminContent.listTopics(req.query);
  sendResponse(res, 200, 'Topics', { topics: items, pagination });
});

export const getTopic = asyncHandler(async (req, res) => {
  const topic = await adminContent.getTopic(req.params.id);
  sendResponse(res, 200, 'Topic details', { topic });
});

export const topicImpact = asyncHandler(async (req, res) => {
  const { topic, counts } = await adminContent.getTopicImpact(req.params.id);
  sendResponse(res, 200, 'Topic impact', { topic, impact: counts });
});

export const createTopic = asyncHandler(async (req, res) => {
  const topic = await adminContent.createTopic(req.body);
  sendResponse(res, 201, 'Topic created', { topic });
});

export const updateTopic = asyncHandler(async (req, res) => {
  const topic = await adminContent.updateTopic({ id: req.params.id, payload: req.body });
  sendResponse(res, 200, 'Topic updated', { topic });
});

export const updateTopicStatus = asyncHandler(async (req, res) => {
  const { topic, counts } = await adminContent.changeTopicStatus({
    id: req.params.id,
    status: req.body.status
  });
  sendResponse(res, 200, `Topic ${topic.status}`, { topic, impact: counts });
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const { topic, counts } = await adminContent.deleteTopic(req.params.id);
  sendResponse(res, 200, 'Topic and related content deleted', { topic, impact: counts });
});

export const listLessons = asyncHandler(async (req, res) => {
  const { items, pagination } = await adminContent.listLessons(req.query);
  sendResponse(res, 200, 'Lessons', { lessons: items, pagination });
});

export const getLesson = asyncHandler(async (req, res) => {
  const lesson = await adminContent.getLesson(req.params.id);
  sendResponse(res, 200, 'Lesson details', { lesson });
});

export const lessonImpact = asyncHandler(async (req, res) => {
  const { lesson, counts } = await adminContent.getLessonImpact(req.params.id);
  sendResponse(res, 200, 'Lesson impact', { lesson, impact: counts });
});

export const createLesson = asyncHandler(async (req, res) => {
  const lesson = await adminContent.createLesson(req.body);
  sendResponse(res, 201, 'Lesson draft created', { lesson });
});

export const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await adminContent.updateLesson({ id: req.params.id, payload: req.body });
  sendResponse(res, 200, 'Lesson updated', { lesson });
});

export const updateLessonStatus = asyncHandler(async (req, res) => {
  const result = await adminContent.changeLessonStatus({ id: req.params.id, ...req.body });
  const lesson = result?.lesson || result;
  const counts = result?.counts || null;
  const message = req.body.status === 'restored' ? 'Lesson restored' : `Lesson ${lesson.status}`;
  sendResponse(res, 200, message, { lesson, ...(counts ? { impact: counts } : {}) });
});

export const deleteLesson = asyncHandler(async (req, res) => {
  const { lesson, counts } = await adminContent.deleteLesson(req.params.id);
  sendResponse(res, 200, 'Lesson and related content deleted', { lesson, impact: counts });
});

export const listQuestions = asyncHandler(async (req, res) => {
  const { items, pagination } = await adminContent.listQuestions(req.query);
  sendResponse(res, 200, 'Questions', { questions: items, pagination });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await adminContent.getQuestion(req.params.id);
  sendResponse(res, 200, 'Question details', { question });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await adminContent.createQuestion(req.body);
  sendResponse(res, 201, 'Question draft created', { question });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await adminContent.updateQuestion({ id: req.params.id, payload: req.body });
  sendResponse(res, 200, 'Question updated', { question });
});

export const updateQuestionStatus = asyncHandler(async (req, res) => {
  const question = await adminContent.changeQuestionStatus({ id: req.params.id, ...req.body });
  sendResponse(res, 200, `Question ${question.status}`, { question });
});

export const archiveQuestion = asyncHandler(async (req, res) => {
  const question = await adminContent.changeQuestionStatus({ id: req.params.id, status: 'archived' });
  sendResponse(res, 200, 'Question archived', { question });
});

export const listInterviewQuestions = asyncHandler(async (req, res) => {
  const { items, pagination } = await adminContent.listInterviewQuestions(req.query);
  sendResponse(res, 200, 'Interview questions', { interviewQuestions: items, pagination });
});

export const getInterviewQuestion = asyncHandler(async (req, res) => {
  const question = await adminContent.getInterviewQuestion(req.params.id);
  sendResponse(res, 200, 'Interview question details', { interviewQuestion: question });
});

export const createInterviewQuestion = asyncHandler(async (req, res) => {
  const question = await adminContent.createInterviewQuestion(req.body);
  sendResponse(res, 201, 'Interview question draft created', { interviewQuestion: question });
});

export const updateInterviewQuestion = asyncHandler(async (req, res) => {
  const question = await adminContent.updateInterviewQuestion({ id: req.params.id, payload: req.body });
  sendResponse(res, 200, 'Interview question updated', { interviewQuestion: question });
});

export const updateInterviewQuestionStatus = asyncHandler(async (req, res) => {
  const question = await adminContent.changeInterviewQuestionStatus({ id: req.params.id, ...req.body });
  sendResponse(res, 200, `Interview question ${question.status}`, { interviewQuestion: question });
});

export const archiveInterviewQuestion = asyncHandler(async (req, res) => {
  const question = await adminContent.changeInterviewQuestionStatus({ id: req.params.id, status: 'archived' });
  sendResponse(res, 200, 'Interview question archived', { interviewQuestion: question });
});

export const listTemplates = asyncHandler(async (req, res) => {
  const { items, pagination } = await adminContent.listTemplates(req.query);
  sendResponse(res, 200, 'Templates', { templates: items, pagination });
});

export const getTemplate = asyncHandler(async (req, res) => {
  const template = await adminContent.getTemplate(req.params.id);
  sendResponse(res, 200, 'Roadmap template details', { template });
});

export const createTemplate = asyncHandler(async (req, res) => {
  const template = await adminContent.createTemplate(req.body);
  sendResponse(res, 201, 'Roadmap template draft created', { template });
});

export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await adminContent.updateTemplate({ id: req.params.id, payload: req.body });
  sendResponse(res, 200, 'Roadmap template updated', { template });
});

export const updateTemplateStatus = asyncHandler(async (req, res) => {
  const template = await adminContent.changeTemplateStatus({ id: req.params.id, ...req.body });
  sendResponse(res, 200, `Roadmap template ${template.status}`, { template });
});

export const archiveTemplate = asyncHandler(async (req, res) => {
  const template = await adminContent.changeTemplateStatus({ id: req.params.id, status: 'archived' });
  sendResponse(res, 200, 'Roadmap template archived', { template });
});

export const duplicateTemplate = asyncHandler(async (req, res) => {
  const template = await adminContent.duplicateTemplate(req.params.id);
  sendResponse(res, 201, 'Roadmap template duplicated', { template });
});
