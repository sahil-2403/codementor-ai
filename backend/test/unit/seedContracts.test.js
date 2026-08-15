import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { javascriptTopics } from '../../src/seed/data/javascript/topics.js';
import { javascriptLessons } from '../../src/seed/data/javascript/lessons.js';
import { javascriptQuizQuestions, javascriptSkillCheckQuestions } from '../../src/seed/data/javascript/questions.js';
import { javascriptPracticeTasks } from '../../src/seed/data/javascript/practiceTasks.js';
import { javascriptInterviewQuestions } from '../../src/seed/data/javascript/interviewQuestions.js';
import { javascriptRoadmapTemplates } from '../../src/seed/data/javascript/roadmapTemplates.js';

const read = (relativePath) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

test('development seed expects a fresh database and runs directly', () => {
  const packageJson = JSON.parse(read('../../package.json'));
  const seed = read('../../src/seed/seed.js');

  assert.equal(packageJson.scripts.seed, 'node src/seed/seed.js');
  assert.match(seed, /ensureFreshDatabase/);
  assert.match(seed, /Seed expects a fresh development database/);
  assert.doesNotMatch(seed, /syncIndexes|dropIndex|migration/i);
});

test('Complete JavaScript seed is large enough to exercise the full learner workflow', () => {
  assert.equal(javascriptTopics.length, 12);
  assert.equal(javascriptLessons.length, 36);
  assert.equal(javascriptQuizQuestions.length, 48);
  assert.equal(javascriptSkillCheckQuestions.length, 24);
  assert.equal(javascriptPracticeTasks.length, 24);
  assert.equal(javascriptInterviewQuestions.length, 30);
  assert.equal(javascriptRoadmapTemplates.length, 3);

  assert.equal(javascriptSkillCheckQuestions.filter((item) => item.difficulty === 'intermediate').length, 12);
  assert.equal(javascriptSkillCheckQuestions.filter((item) => item.difficulty === 'advanced').length, 12);
  assert.equal(javascriptInterviewQuestions.filter((item) => item.difficulty === 'beginner').length, 10);
  assert.equal(javascriptInterviewQuestions.filter((item) => item.difficulty === 'intermediate').length, 10);
  assert.equal(javascriptInterviewQuestions.filter((item) => item.difficulty === 'advanced').length, 10);
  assert.equal(javascriptPracticeTasks.filter((item) => item.difficulty === 'beginner').length, 14);
  assert.equal(javascriptPracticeTasks.filter((item) => item.difficulty === 'intermediate').length, 6);
  assert.equal(javascriptPracticeTasks.filter((item) => item.difficulty === 'advanced').length, 4);
});

test('Complete JavaScript seed references only known topics and lessons', () => {
  const topicKeys = new Set(javascriptTopics.map((item) => item.key));
  const lessonKeys = new Set(javascriptLessons.map((item) => item.key));

  assert.equal(topicKeys.size, javascriptTopics.length);
  assert.equal(lessonKeys.size, javascriptLessons.length);
  assert.ok(javascriptLessons.every((item) => topicKeys.has(item.topicKey)));
  assert.ok(javascriptQuizQuestions.every((item) => topicKeys.has(item.topicKey) && lessonKeys.has(item.relatedLessonKey)));
  assert.ok(javascriptSkillCheckQuestions.every((item) => topicKeys.has(item.topicKey) && item.relatedLessonKey === null));
  assert.ok(javascriptPracticeTasks.every((item) => topicKeys.has(item.topicKey) && item.relatedLessonKeys.every((key) => lessonKeys.has(key))));
  assert.ok(javascriptInterviewQuestions.every((item) => topicKeys.has(item.topicKey)));
  assert.ok(javascriptRoadmapTemplates.every((template) => template.modules.every((module) => module.lessonKeys.every((key) => lessonKeys.has(key)))));

  for (const topic of javascriptTopics) {
    const quizCount = javascriptQuizQuestions.filter((item) => item.topicKey === topic.key).length;
    assert.equal(quizCount, 4, `${topic.title} should have four module quiz questions`);
  }
});
