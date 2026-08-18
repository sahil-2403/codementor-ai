import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('learner requests resolve one explicit current enrollment', () => {
  const user = source('models/User.js');
  const integrity = source('services/dataIntegrity.service.js');
  const onboarding = source('routes/onboarding.routes.js');

  assert.match(user, /currentEnrollment/);
  assert.match(integrity, /getCurrentEnrollmentForUser/);
  assert.match(integrity, /status: 'active'/);
  assert.match(integrity, /status: 'completed'/);
  assert.match(integrity, /enrollment:\s*enrollment\._id/);
  assert.match(onboarding, /get\('\/enrollments'/);
  assert.match(onboarding, /post\('\/enrollments\/:enrollmentId\/current'/);
});

test('onboarding moves from level directly to assessment choice or roadmap', () => {
  const onboarding = source('services/onboarding.service.js');
  const routes = source('routes/onboarding.routes.js');
  const model = source('models/Enrollment.js');
  const prompt = source('ai/promptBuilders.js');

  assert.match(onboarding, /level === 'beginner'[\s\S]*ONBOARDING_STATES\.ROADMAP_PENDING[\s\S]*ONBOARDING_STATES\.ASSESSMENT_CHOICE_PENDING/);
  assert.doesNotMatch(routes, /\/preferences/);
  assert.doesNotMatch(model, /dailyStudyTime|targetDurationDays|learningStyle|knownBasics|mainFocus|preferencesCompletedAt/);
  assert.doesNotMatch(prompt, /dailyStudyTime|targetDurationDays|learningStyle|knownBasics|mainFocus/);
});

test('practice interview quizzes and revisions stay inside the current course', () => {
  const practice = source('services/practice.service.js');
  const interview = source('services/interview.service.js');
  const quiz = source('services/quiz.service.js');
  const revision = source('services/revision.service.js');

  assert.match(practice, /course:\s*course\.course/);
  assert.match(practice, /belongs to a different course/);
  assert.match(interview, /course:\s*course\.course/);
  assert.match(interview, /belongs to a different course/);
  assert.match(quiz, /coursePlan:\s*course\._id/);
  assert.match(revision, /coursePlan:\s*course\._id/);
});

test('practice keeps current-level roadmap locks while lower levels stay available', () => {
  const practice = source('services/practice.service.js');

  assert.match(practice, /getUnlockedLessonIds/);
  assert.match(practice, /difficultyRank\[task\.difficulty\] < difficultyRank\[userLevel\]/);
  assert.match(practice, /if \(!allowedByLevel\(userLevel, task\.difficulty\)\) return false/);
  assert.match(practice, /relatedLessons/);
  assert.match(practice, /if \(!relatedLessonIds\.length\) return true/);
  assert.match(practice, /Complete the earlier roadmap modules to unlock this practice task/);
});

test('single-course completion exposes the next available level and reuses onboarding', () => {
  const progress = source('services/progress.service.js');
  const onboarding = source('services/onboarding.service.js');

  assert.match(progress, /getNextAvailableCourseLevel/);
  assert.match(progress, /levelOrder\.slice\(currentIndex \+ 1\)/);
  assert.match(progress, /courseCompleted:\s*isComplete/);
  assert.match(progress, /nextLevel/);
  assert.match(onboarding, /const changingLevel = Boolean\(enrollment\.level && enrollment\.level !== level\)/);
  assert.match(onboarding, /enrollment\.status = 'draft'/);
  assert.match(onboarding, /ONBOARDING_STATES\.ASSESSMENT_CHOICE_PENDING/);
});

test('learning path completion advances with simple sequential enrollment updates', () => {
  const progress = source('services/progress.service.js');

  assert.match(progress, /advanceLearningPathIfNeeded/);
  assert.match(progress, /enrollment\.currentCourse = nextEntry\.course/);
  assert.match(progress, /enrollment\.onboardingState = ONBOARDING_STATES\.ROADMAP_PENDING/);
  assert.match(progress, /nextPath: '\/onboarding\/generating'/);
});

test('roadmap personalization keeps real modules and stores learner-friendly priority', () => {
  const controller = source('controllers/roadmap.controller.js');
  const roadmap = source('services/roadmap.service.js');
  const prompt = source('ai/promptBuilders.js');
  const dashboard = source('controllers/progress.controller.js');

  assert.match(controller, /repairExistingRoadmap/);
  assert.match(controller, /createProgressForCourse/);
  assert.match(controller, /roadmapType:\s*ROADMAP_TYPES\.TEMPLATE/);
  assert.match(roadmap, /buildAssessmentSummary/);
  assert.match(roadmap, /highPriority:\s*Boolean\(aiModule\.highPriority\)/);
  assert.match(prompt, /Do not add or remove modules or invent lessons\/questions/);
  assert.match(prompt, /priority is represented only by the highPriority boolean/);
  assert.match(roadmap, /const finalReason = aiGenerated \|\| roadmapType === ROADMAP_TYPES\.TEMPLATE/);
  assert.match(roadmap, /: 'initial_template'/);
  assert.match(dashboard, /assessmentPreference === 'take'/);
  assert.match(dashboard, /canPersonalizeLater/);
});

test('interview mentor feedback addresses the learner directly', () => {
  const prompt = source('ai/promptBuilders.js');

  assert.match(prompt, /Speak directly to the learner using you and your/);
  assert.match(prompt, /You correctly identified/);
  assert.match(prompt, /Never refer to them as the learner/);
});

test('weekly reports use weekly activity and progress evidence', () => {
  const report = source('services/report.service.js');
  const model = source('models/WeeklyReport.js');
  const prompt = source('ai/promptBuilders.js');

  assert.match(report, /ActivityLog/);
  assert.match(report, /QuizAttempt/);
  assert.match(report, /PracticeSubmission/);
  assert.match(report, /InterviewAttempt/);
  assert.match(report, /MentorChat/);
  assert.match(report, /buildImprovements/);
  assert.match(report, /weekStart/);
  assert.match(model, /lessonsCompleted/);
  assert.match(model, /mentorQuestions/);
  assert.match(model, /improvements/);
  assert.match(model, /overallCompletion/);
  assert.match(prompt, /weeklySnapshot/);
  assert.match(prompt, /Do not invent activity or progress/);
});

test('skipping an unfinished assessment moves setup to roadmap generation', () => {
  const onboarding = source('services/onboarding.service.js');
  const roadmapPending = onboarding.indexOf('enrollment.onboardingState === ONBOARDING_STATES.ROADMAP_PENDING');
  const startedAssessment = onboarding.indexOf("assessment?.status === 'started'");

  assert.ok(roadmapPending >= 0, 'roadmap_pending should be handled explicitly');
  assert.ok(startedAssessment > roadmapPending, 'explicit roadmap_pending choice must win over an older started assessment');
  assert.match(onboarding, /markAssessmentSkipped[\s\S]*assessmentPreference = enrollment\.level === 'beginner' \? 'not_applicable' : 'skip'/);
  assert.match(onboarding, /markAssessmentSkipped[\s\S]*onboardingState = ONBOARDING_STATES\.ROADMAP_PENDING/);
});

test('admin lifecycle protects active learners and simple catalog rules', () => {
  const lifecycle = source('services/adminContent/dependencyLifecycle.service.js');
  const catalog = source('services/adminContent/catalog.service.js');
  const questions = source('services/adminContent/question.service.js');

  assert.match(lifecycle, /activeLearnerPlans/);
  assert.match(lifecycle, /active learner roadmap/);
  assert.match(lifecycle, /A technology with child technologies must stay top-level/);
  assert.match(catalog, /assertCourseFitsPublishedPaths/);
  assert.match(catalog, /Choose a top-level technology as the parent/);
  assert.match(questions, /assertQuestionNotInActiveRoadmap/);
  assert.match(questions, /used by an active learner roadmap/);
});
