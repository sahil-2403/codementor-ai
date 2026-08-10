import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';
import { validate } from '../middlewares/validate.middleware.js';
import { adminWriteLimiter } from '../middlewares/rateLimit.middleware.js';
import {
  technologySchema,
  technologyUpdateSchema,
  courseSchema,
  courseUpdateSchema,
  learningPathSchema,
  learningPathUpdateSchema,
  catalogStatusUpdateSchema,
  topicSchema,
  topicUpdateSchema,
  topicStatusUpdateSchema,
  lessonSchema,
  lessonUpdateSchema,
  lessonStatusUpdateSchema,
  questionSchema,
  questionUpdateSchema,
  questionStatusUpdateSchema,
  interviewQuestionSchema,
  interviewQuestionUpdateSchema,
  templateSchema,
  templateUpdateSchema,
  idParamSchema
} from '../validations/admin.validation.js';
import {
  projectTaskSchema,
  projectTaskUpdateSchema,
  projectTaskStatusSchema
} from '../validations/adminProject.validation.js';
import {
  listTopics,
  getTopic,
  topicImpact,
  createTopic,
  updateTopic,
  updateTopicStatus,
  deleteTopic,
  listLessons,
  getLesson,
  lessonImpact,
  createLesson,
  updateLesson,
  updateLessonStatus,
  deleteLesson,
  listQuestions,
  getQuestion,
  questionImpact,
  createQuestion,
  updateQuestion,
  updateQuestionStatus,
  deleteQuestion,
  listInterviewQuestions,
  getInterviewQuestion,
  interviewQuestionImpact,
  createInterviewQuestion,
  updateInterviewQuestion,
  updateInterviewQuestionStatus,
  deleteInterviewQuestion,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  updateTemplateStatus,
  deleteTemplate
} from '../controllers/admin.controller.js';
import {
  listTechnologies,
  getTechnology,
  createTechnology,
  updateTechnology,
  updateTechnologyStatus,
  deleteTechnology,
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
  listLearningPaths,
  getLearningPath,
  createLearningPath,
  updateLearningPath,
  updateLearningPathStatus,
  deleteLearningPath
} from '../controllers/adminCatalog.controller.js';
import {
  listAdminProjectTasks,
  getAdminProjectTask,
  createAdminProjectTask,
  updateAdminProjectTask,
  updateAdminProjectTaskStatus,
  deleteAdminProjectTask
} from '../controllers/adminProject.controller.js';
import { courseWorkspace } from '../controllers/courseWorkspace.controller.js';
import { contentOverview } from '../controllers/adminOverview.controller.js';

const router = Router();
router.use(requireAuth, requireRole(ROLES.ADMIN));

router.get('/content-overview', contentOverview);

router.get('/technologies', listTechnologies);
router.post('/technologies', adminWriteLimiter, validate(technologySchema), createTechnology);
router.get('/technologies/:id', validate(idParamSchema), getTechnology);
router.patch('/technologies/:id', adminWriteLimiter, validate(idParamSchema), validate(technologyUpdateSchema), updateTechnology);
router.patch('/technologies/:id/status', adminWriteLimiter, validate(idParamSchema), validate(catalogStatusUpdateSchema), updateTechnologyStatus);
router.delete('/technologies/:id', adminWriteLimiter, validate(idParamSchema), deleteTechnology);

router.get('/courses', listCourses);
router.post('/courses', adminWriteLimiter, validate(courseSchema), createCourse);
router.get('/courses/:id/workspace', validate(idParamSchema), courseWorkspace);
router.get('/courses/:id', validate(idParamSchema), getCourse);
router.patch('/courses/:id', adminWriteLimiter, validate(idParamSchema), validate(courseUpdateSchema), updateCourse);
router.patch('/courses/:id/status', adminWriteLimiter, validate(idParamSchema), validate(catalogStatusUpdateSchema), updateCourseStatus);
router.delete('/courses/:id', adminWriteLimiter, validate(idParamSchema), deleteCourse);

router.get('/learning-paths', listLearningPaths);
router.post('/learning-paths', adminWriteLimiter, validate(learningPathSchema), createLearningPath);
router.get('/learning-paths/:id', validate(idParamSchema), getLearningPath);
router.patch('/learning-paths/:id', adminWriteLimiter, validate(idParamSchema), validate(learningPathUpdateSchema), updateLearningPath);
router.patch('/learning-paths/:id/status', adminWriteLimiter, validate(idParamSchema), validate(catalogStatusUpdateSchema), updateLearningPathStatus);
router.delete('/learning-paths/:id', adminWriteLimiter, validate(idParamSchema), deleteLearningPath);

router.get('/topics', listTopics);
router.post('/topics', adminWriteLimiter, validate(topicSchema), createTopic);
router.get('/topics/:id/impact', validate(idParamSchema), topicImpact);
router.get('/topics/:id', validate(idParamSchema), getTopic);
router.patch('/topics/:id/status', adminWriteLimiter, validate(idParamSchema), validate(topicStatusUpdateSchema), updateTopicStatus);
router.patch('/topics/:id', adminWriteLimiter, validate(idParamSchema), validate(topicUpdateSchema), updateTopic);
router.delete('/topics/:id', adminWriteLimiter, validate(idParamSchema), deleteTopic);

router.get('/lessons', listLessons);
router.post('/lessons', adminWriteLimiter, validate(lessonSchema), createLesson);
router.get('/lessons/:id/impact', validate(idParamSchema), lessonImpact);
router.get('/lessons/:id', validate(idParamSchema), getLesson);
router.patch('/lessons/:id', adminWriteLimiter, validate(idParamSchema), validate(lessonUpdateSchema), updateLesson);
router.patch('/lessons/:id/status', adminWriteLimiter, validate(idParamSchema), validate(lessonStatusUpdateSchema), updateLessonStatus);
router.delete('/lessons/:id', adminWriteLimiter, validate(idParamSchema), deleteLesson);

router.get('/questions', listQuestions);
router.post('/questions', adminWriteLimiter, validate(questionSchema), createQuestion);
router.get('/questions/:id/impact', validate(idParamSchema), questionImpact);
router.get('/questions/:id', validate(idParamSchema), getQuestion);
router.patch('/questions/:id', adminWriteLimiter, validate(idParamSchema), validate(questionUpdateSchema), updateQuestion);
router.patch('/questions/:id/status', adminWriteLimiter, validate(idParamSchema), validate(questionStatusUpdateSchema), updateQuestionStatus);
router.delete('/questions/:id', adminWriteLimiter, validate(idParamSchema), deleteQuestion);

router.get('/interview-questions', listInterviewQuestions);
router.post('/interview-questions', adminWriteLimiter, validate(interviewQuestionSchema), createInterviewQuestion);
router.get('/interview-questions/:id/impact', validate(idParamSchema), interviewQuestionImpact);
router.get('/interview-questions/:id', validate(idParamSchema), getInterviewQuestion);
router.patch('/interview-questions/:id', adminWriteLimiter, validate(idParamSchema), validate(interviewQuestionUpdateSchema), updateInterviewQuestion);
router.patch('/interview-questions/:id/status', adminWriteLimiter, validate(idParamSchema), validate(questionStatusUpdateSchema), updateInterviewQuestionStatus);
router.delete('/interview-questions/:id', adminWriteLimiter, validate(idParamSchema), deleteInterviewQuestion);

router.get('/project-tasks', listAdminProjectTasks);
router.post('/project-tasks', adminWriteLimiter, validate(projectTaskSchema), createAdminProjectTask);
router.get('/project-tasks/:id', validate(idParamSchema), getAdminProjectTask);
router.patch('/project-tasks/:id', adminWriteLimiter, validate(idParamSchema), validate(projectTaskUpdateSchema), updateAdminProjectTask);
router.patch('/project-tasks/:id/status', adminWriteLimiter, validate(idParamSchema), validate(projectTaskStatusSchema), updateAdminProjectTaskStatus);
router.delete('/project-tasks/:id', adminWriteLimiter, validate(idParamSchema), deleteAdminProjectTask);

router.get('/templates', listTemplates);
router.post('/templates', adminWriteLimiter, validate(templateSchema), createTemplate);
router.get('/templates/:id', validate(idParamSchema), getTemplate);
router.patch('/templates/:id', adminWriteLimiter, validate(idParamSchema), validate(templateUpdateSchema), updateTemplate);
router.patch('/templates/:id/status', adminWriteLimiter, validate(idParamSchema), validate(catalogStatusUpdateSchema), updateTemplateStatus);
router.delete('/templates/:id', adminWriteLimiter, validate(idParamSchema), deleteTemplate);

export default router;
