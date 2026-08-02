import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.middleware.js';
import { adminWriteLimiter } from '../middlewares/rateLimit.middleware.js';
import {
  topicSchema,
  topicUpdateSchema,
  lessonSchema,
  lessonUpdateSchema,
  questionSchema,
  questionUpdateSchema,
  templateSchema,
  templateUpdateSchema,
  statusUpdateSchema,
  idParamSchema
} from '../validations/admin.validation.js';
import {
  listTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  listLessons,
  getLesson,
  createLesson,
  updateLesson,
  updateLessonStatus,
  archiveLesson,
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  updateQuestionStatus,
  archiveQuestion,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
  archiveTemplate,
  duplicateTemplate
} from '../controllers/admin.controller.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/topics', listTopics);
router.post('/topics', adminWriteLimiter, validate(topicSchema), createTopic);
router.patch('/topics/:id', adminWriteLimiter, validate(idParamSchema), validate(topicUpdateSchema), updateTopic);
router.delete('/topics/:id', adminWriteLimiter, validate(idParamSchema), deleteTopic);

router.get('/lessons', listLessons);
router.post('/lessons', adminWriteLimiter, validate(lessonSchema), createLesson);
router.get('/lessons/:id', validate(idParamSchema), getLesson);
router.patch('/lessons/:id', adminWriteLimiter, validate(idParamSchema), validate(lessonUpdateSchema), updateLesson);
router.patch('/lessons/:id/status', adminWriteLimiter, validate(idParamSchema), validate(statusUpdateSchema), updateLessonStatus);
router.delete('/lessons/:id', adminWriteLimiter, validate(idParamSchema), archiveLesson);

router.get('/questions', listQuestions);
router.post('/questions', adminWriteLimiter, validate(questionSchema), createQuestion);
router.get('/questions/:id', validate(idParamSchema), getQuestion);
router.patch('/questions/:id', adminWriteLimiter, validate(idParamSchema), validate(questionUpdateSchema), updateQuestion);
router.patch('/questions/:id/status', adminWriteLimiter, validate(idParamSchema), validate(statusUpdateSchema), updateQuestionStatus);
router.delete('/questions/:id', adminWriteLimiter, validate(idParamSchema), archiveQuestion);

router.get('/templates', listTemplates);
router.post('/templates', adminWriteLimiter, validate(templateSchema), createTemplate);
router.get('/templates/:id', validate(idParamSchema), getTemplate);
router.patch('/templates/:id', adminWriteLimiter, validate(idParamSchema), validate(templateUpdateSchema), updateTemplate);
router.patch('/templates/:id/status', adminWriteLimiter, validate(idParamSchema), validate(statusUpdateSchema), updateTemplateStatus);
router.post('/templates/:id/duplicate', adminWriteLimiter, validate(idParamSchema), duplicateTemplate);
router.delete('/templates/:id', adminWriteLimiter, validate(idParamSchema), archiveTemplate);

export default router;
