import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('catalog separates technology classification from independently learnable courses', () => {
  const technology = source('models/Technology.js');
  const course = source('models/Course.js');
  const learningPath = source('models/LearningPath.js');

  assert.match(technology, /type:[\s\S]*language[\s\S]*framework[\s\S]*runtime[\s\S]*database/);
  assert.match(course, /technologies:[\s\S]*Technology/);
  assert.match(course, /primaryTechnology:[\s\S]*Technology/);
  assert.match(course, /availableLevels/);
  assert.match(learningPath, /courses:[\s\S]*course:[\s\S]*Course/);
  assert.match(learningPath, /order/);
});

test('course is the ownership boundary for curriculum content', () => {
  for (const model of ['Topic.js', 'Lesson.js', 'QuizQuestion.js', 'InterviewQuestion.js', 'ProjectTask.js']) {
    const content = source(`models/${model}`);
    assert.match(content, /course:[\s\S]*ref:\s*['"]Course['"]/);
  }

  const lesson = source('models/Lesson.js');
  const quiz = source('models/QuizQuestion.js');
  assert.match(lesson, /topic:[\s\S]*ref:\s*['"]Topic['"]/);
  assert.match(quiz, /relatedLesson:[\s\S]*ref:\s*['"]Lesson['"]/);
});

test('roadmap templates are identified by course and level and use lesson object ids', () => {
  const template = source('models/RoadmapTemplate.js');
  assert.match(template, /course:[\s\S]*ref:\s*['"]Course['"]/);
  assert.match(template, /lessons:[\s\S]*ObjectId/);
  assert.match(template, /index\(\{\s*course:\s*1,\s*level:\s*1\s*\},\s*\{\s*unique:\s*true/);
  assert.doesNotMatch(template, /goalKey/);
  assert.doesNotMatch(template, /lessonSlugs/);
});

test('learner progress is enrollment scoped so multiple courses can stay active independently', () => {
  const enrollment = source('models/Enrollment.js');
  const coursePlan = source('models/CoursePlan.js');
  const user = source('models/User.js');

  assert.match(enrollment, /type:[\s\S]*course[\s\S]*learning_path/);
  assert.match(enrollment, /currentCourse:[\s\S]*Course/);
  assert.match(coursePlan, /enrollment:[\s\S]*Enrollment/);
  assert.match(coursePlan, /course:[\s\S]*Course/);
  assert.match(coursePlan, /partialFilterExpression:[\s\S]*isActive/);
  assert.match(user, /currentEnrollment:[\s\S]*Enrollment/);
});

test('learner onboarding starts from catalog selection rather than a hardcoded goal', () => {
  const routes = source('routes/onboarding.routes.js');
  const service = source('services/onboarding.service.js');
  const catalogRoutes = source('routes/catalog.routes.js');

  assert.match(catalogRoutes, /router\.get\('\/'/);
  assert.match(routes, /selection/);
  assert.match(service, /selectEnrollmentTarget/);
  assert.match(service, /Course\.findOne/);
  assert.match(service, /LearningPath\.findOne/);
  assert.doesNotMatch(service, /goalKey/);
});

test('course workspace exposes scoped curriculum management', () => {
  const workspace = source('services/adminContent/courseWorkspace.service.js');
  assert.match(workspace, /Topic[\s\S]*course:\s*course\._id/);
  assert.match(workspace, /Lesson[\s\S]*course:\s*course\._id/);
  assert.match(workspace, /QuizQuestion[\s\S]*bank:\s*'quiz'/);
  assert.match(workspace, /QuizQuestion[\s\S]*bank:\s*'skill_check'/);
  assert.match(workspace, /RoadmapTemplate[\s\S]*course:\s*course\._id/);
});
