import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relativePath) => readFileSync(new URL(`../../src/${relativePath}`, import.meta.url), 'utf8');

test('Gemini schemas constrain scores and require roadmap modules', () => {
  const schemas = source('ai/aiSchemas.js');
  assert.match(schemas, /projectReviewResponseSchema[\s\S]*score:\s*z\.coerce\.number\(\)\.min\(0\)\.max\(100\)/);
  assert.match(schemas, /interviewReviewResponseSchema[\s\S]*score:\s*z\.coerce\.number\(\)\.min\(0\)\.max\(100\)/);
  assert.match(schemas, /roadmapResponseSchema[\s\S]*modules:[\s\S]*\.min\(1\)/);
});

test('project and interview models declare atomic two-attempt indexes', () => {
  const projects = source('models/ProjectSubmission.js');
  const interviews = source('models/InterviewAttempt.js');
  assert.match(projects, /project_attempt_slot_unique/);
  assert.match(projects, /user:\s*1,\s*projectTask:\s*1,\s*attemptNumber:\s*1/);
  assert.match(interviews, /interview_attempt_slot_unique/);
  assert.match(interviews, /user:\s*1,\s*question:\s*1,\s*attemptNumber:\s*1/);
});

test('roadmap models declare job locks and output idempotency indexes', () => {
  const jobs = source('models/AIJob.js');
  const courses = source('models/CoursePlan.js');
  assert.match(jobs, /ai_job_idempotency_unique/);
  assert.match(jobs, /ai_job_active_lock_unique/);
  assert.match(courses, /course_generation_job_unique/);
  assert.match(courses, /course_generation_key_unique/);
});
