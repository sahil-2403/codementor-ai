import { javascriptTopics } from './topics.js';
import { javascriptLessons } from './lessons.js';

const interviewLessonKeys = {
  'getting-started-javascript': ['what-is-javascript', 'javascript-runtime-environments'],
  'variables-values': ['const-bindings', 'var-legacy'],
  'data-types': ['numbers-nan', 'typeof-primitives-references'],
  'operators-conversion': ['comparison-equality', 'explicit-conversion-coercion'],
  'conditions-decisions': ['else-if-ranges', 'ternary-nullish-guards'],
  'loops-repetition': ['for-of-break-continue', 'choosing-loops'],
  functions: ['parameters-arguments-return', 'function-expressions-first-class'],
  'scope-hoisting': ['lexical-scope-lookup', 'tdz-shadowing'],
  arrays: ['slice-splice', 'array-search-loops'],
  objects: ['object-methods', 'nested-objects-safe-access'],
  'references-copying': ['primitive-vs-reference-copy', 'shallow-copy-spread'],
  'array-methods': ['foreach-map', 'reduce-sort-method-selection'],
  'dom-fundamentals': ['dom-tree', 'dom-content-attributes-styles'],
  'events-interaction': ['event-propagation', 'event-delegation'],
  'forms-browser-data': ['form-validation', 'localstorage-json'],
  'modern-javascript-syntax': ['destructuring', 'optional-nullish-modern'],
  'functional-javascript': ['higher-order-functions', 'pure-functions-side-effects'],
  'errors-debugging-modules': ['try-catch-finally', 'systematic-debugging'],
  'asynchronous-javascript': ['promise-basics', 'fetch-http-errors'],
  'javascript-internals': ['closures-intuition', 'this-call-site'],
  'prototypes-object-model': ['prototype-chain', 'composition-vs-inheritance'],
  'event-loop-performance': ['event-loop-tasks-microtasks', 'garbage-collection-memory']
};

const lessonByKey = new Map(javascriptLessons.map((lesson) => [lesson.key, lesson]));

export const javascriptInterviewQuestions = javascriptTopics.flatMap((topic) =>
  interviewLessonKeys[topic.key].map((lessonKey) => {
    const lesson = lessonByKey.get(lessonKey);
    return {
      topicKey: topic.key,
      question: lesson.interviewQuestions[0].question,
      type: lesson.interviewType || 'concept',
      difficulty: lesson.difficulty,
      expectedAnswer: lesson.interviewQuestions[0].answer,
      answerChecklist: lesson.interviewChecklist,
      tags: ['javascript', topic.key, ...lesson.tags]
    };
  })
);
