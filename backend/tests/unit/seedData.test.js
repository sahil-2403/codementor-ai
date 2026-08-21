import { javascriptTopics } from '../../src/seed/data/javascript/topics.js';
import { javascriptLessons } from '../../src/seed/data/javascript/lessons.js';
import { javascriptQuizQuestions, javascriptSkillCheckQuestions } from '../../src/seed/data/javascript/questions.js';
import { javascriptPracticeTasks } from '../../src/seed/data/javascript/practiceTasks.js';
import { javascriptInterviewQuestions } from '../../src/seed/data/javascript/interviewQuestions.js';
import { javascriptRoadmapTemplates } from '../../src/seed/data/javascript/roadmapTemplates.js';

describe('Complete JavaScript seed data', () => {
  test('uses unique topic and lesson keys', () => {
    const topicKeys = javascriptTopics.map((item) => item.key);
    const lessonKeys = javascriptLessons.map((item) => item.key);
    expect(new Set(topicKeys).size).toBe(topicKeys.length);
    expect(new Set(lessonKeys).size).toBe(lessonKeys.length);
  });

  test('keeps curriculum references valid', () => {
    const topicKeys = new Set(javascriptTopics.map((item) => item.key));
    const lessonKeys = new Set(javascriptLessons.map((item) => item.key));

    expect(javascriptLessons.every((item) => topicKeys.has(item.topicKey))).toBe(true);
    expect(javascriptQuizQuestions.every((item) => topicKeys.has(item.topicKey) && lessonKeys.has(item.relatedLessonKey))).toBe(true);
    expect(javascriptSkillCheckQuestions.every((item) => topicKeys.has(item.topicKey) && item.relatedLessonKey === null)).toBe(true);
    expect(javascriptPracticeTasks.every((item) => topicKeys.has(item.topicKey) && item.relatedLessonKeys.every((key) => lessonKeys.has(key)))).toBe(true);
    expect(javascriptInterviewQuestions.every((item) => topicKeys.has(item.topicKey))).toBe(true);
    expect(javascriptRoadmapTemplates.every((template) => template.modules.every((module) => module.lessonKeys.every((key) => lessonKeys.has(key))))).toBe(true);
  });

  test('provides a roadmap template for each supported level', () => {
    expect(new Set(javascriptRoadmapTemplates.map((item) => item.level))).toEqual(new Set(['beginner', 'intermediate', 'advanced']));
  });
});
