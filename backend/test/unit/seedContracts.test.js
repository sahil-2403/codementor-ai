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

test('Complete JavaScript is a full beginner-to-advanced reference course', () => {
  assert.equal(javascriptTopics.length, 22);
  assert.ok(javascriptLessons.length >= 90, 'Complete JavaScript should contain at least 90 detailed lessons');
  assert.equal(javascriptQuizQuestions.length, javascriptLessons.length);
  assert.equal(javascriptSkillCheckQuestions.length, 24);
  assert.equal(javascriptPracticeTasks.length, 44);
  assert.equal(javascriptInterviewQuestions.length, 44);
  assert.equal(javascriptRoadmapTemplates.length, 3);

  assert.equal(javascriptSkillCheckQuestions.filter((item) => item.difficulty === 'intermediate').length, 12);
  assert.equal(javascriptSkillCheckQuestions.filter((item) => item.difficulty === 'advanced').length, 12);
  assert.equal(javascriptPracticeTasks.filter((item) => item.difficulty === 'beginner').length, 30);
  assert.equal(javascriptPracticeTasks.filter((item) => item.difficulty === 'intermediate').length, 8);
  assert.equal(javascriptPracticeTasks.filter((item) => item.difficulty === 'advanced').length, 6);
});

test('every Complete JavaScript lesson is detailed and learner-ready', () => {
  for (const lesson of javascriptLessons) {
    assert.ok(lesson.theory.length >= 700, `${lesson.title} theory should be elaborative`);
    assert.ok(lesson.codeExample.length >= 20, `${lesson.title} should include a useful code example`);
    assert.ok(lesson.codeExplanation.length >= 80, `${lesson.title} should explain its example`);
    assert.ok(lesson.commonMistakes.length >= 3, `${lesson.title} should explain common mistakes`);
    assert.ok(lesson.interviewDefinition.length >= 40, `${lesson.title} should include an interview-ready definition`);
    assert.ok(lesson.interviewQuestions.length >= 1, `${lesson.title} should include interview practice`);
    assert.ok(lesson.practiceTask.length >= 30, `${lesson.title} should include a small practice step`);
    assert.ok(lesson.knowledgeCheck?.question && lesson.knowledgeCheck?.correctAnswer, `${lesson.title} should include a knowledge check`);
  }
});

test('Complete JavaScript references only known topics and lessons', () => {
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
});

test('each topic has lessons quizzes practice and interview coverage', () => {
  for (const topic of javascriptTopics) {
    const lessons = javascriptLessons.filter((item) => item.topicKey === topic.key);
    const quizzes = javascriptQuizQuestions.filter((item) => item.topicKey === topic.key);
    const practiceTasks = javascriptPracticeTasks.filter((item) => item.topicKey === topic.key);
    const interviews = javascriptInterviewQuestions.filter((item) => item.topicKey === topic.key);

    assert.ok(lessons.length >= 4, `${topic.title} should have at least four focused lessons`);
    assert.equal(quizzes.length, lessons.length, `${topic.title} should have one quiz check per lesson`);
    assert.equal(practiceTasks.length, 2, `${topic.title} should have two coding practice tasks`);
    assert.equal(interviews.length, 2, `${topic.title} should have two dedicated interview questions`);
  }
});

test('roadmaps use level as an entry point and still progress toward advanced JavaScript', () => {
  const beginner = javascriptRoadmapTemplates.find((item) => item.level === 'beginner');
  const intermediate = javascriptRoadmapTemplates.find((item) => item.level === 'intermediate');
  const advanced = javascriptRoadmapTemplates.find((item) => item.level === 'advanced');

  assert.equal(beginner.modules.length, 22);
  assert.equal(intermediate.modules.length, 16);
  assert.equal(advanced.modules.length, 7);
  assert.equal(beginner.modules[0].title, 'Getting Started with JavaScript');
  assert.equal(beginner.modules.at(-1).title, 'Event Loop, Memory and Performance');
  assert.equal(intermediate.modules[0].title, 'Functions');
  assert.equal(intermediate.modules.at(-1).title, 'Event Loop, Memory and Performance');
  assert.equal(advanced.modules[0].title, 'Modern JavaScript Syntax');
  assert.equal(advanced.modules.at(-1).title, 'Event Loop, Memory and Performance');

  const beginnerLessonKeys = new Set(beginner.modules.flatMap((module) => module.lessonKeys));
  assert.equal(beginnerLessonKeys.size, javascriptLessons.length);
  assert.ok(javascriptLessons.every((lesson) => beginnerLessonKeys.has(lesson.key)));
});
