import { javascriptTopics } from './topics.js';
import { javascriptLessons } from './lessons.js';

const quizTag = (topicKey) => `js-quiz-${topicKey}`;

const moduleDescriptions = {
  'getting-started-javascript': 'Start from zero: understand what JavaScript is, where it runs, how a small program is structured, and how to use the console while learning.',
  'variables-values': 'Learn how programs remember values, when to use let or const, and why older var behaves differently.',
  'data-types': 'Understand the kinds of values JavaScript works with and how strings, numbers, booleans, null, undefined, arrays, and objects differ.',
  'operators-conversion': 'Build reliable calculations and comparisons while learning explicit conversion, strict equality, logical operators, and truthy/falsy behavior.',
  'conditions-decisions': 'Make programs choose between paths with if/else, else-if ranges, switch, ternary expressions, nullish defaults, and guard clauses.',
  'loops-repetition': 'Repeat work safely with for, while, for...of, break, and continue while learning how to choose the clearest loop.',
  functions: 'Write reusable behavior with declarations, parameters, return values, function expressions, defaults, rest parameters, and arrow functions.',
  'scope-hoisting': 'Understand where variables are visible, how lexical lookup works, what hoisting means, and why the temporal dead zone exists.',
  arrays: 'Work confidently with ordered collections, indexes, common mutation methods, slice/splice, loops, and basic searching.',
  objects: 'Model related data and behavior with properties, methods, nested objects, safe access, and object iteration helpers.',
  'references-copying': 'Understand why objects can be shared through references and how to perform safe shallow and nested copies when state should not be mutated.',
  'array-methods': 'Use forEach, map, filter, find, some, every, includes, reduce, and sort by choosing the method that matches the result you need.',
  'dom-fundamentals': 'Connect JavaScript to the browser page by selecting DOM nodes, updating content safely, and creating or removing elements.',
  'events-interaction': 'Respond to user actions with event listeners, event objects, propagation, and delegation for dynamic interfaces.',
  'forms-browser-data': 'Read and validate form input, prevent unwanted navigation, persist harmless browser state, and keep one predictable update flow.',
  'modern-javascript-syntax': 'Use modern syntax such as template literals, destructuring, spread/rest, optional chaining, and nullish coalescing without hiding program logic.',
  'functional-javascript': 'Understand callbacks and higher-order functions, separate pure calculations from side effects, and use immutable transformations when they improve clarity.',
  'errors-debugging-modules': 'Read errors, recover with try/catch when appropriate, throw useful failures, and debug from runtime evidence instead of guessing.',
  'asynchronous-javascript': 'Move gradually from synchronous code and timers to callbacks, Promises, async/await, Fetch, HTTP error handling, and concurrent requests.',
  'javascript-internals': 'Understand execution contexts, the call stack, lexical environments, closures, recursion, and the practical rules behind this.',
  'prototypes-object-model': 'Learn how prototype lookup powers JavaScript objects and classes, how new creates instances, and when composition is cleaner than inheritance.',
  'event-loop-performance': 'Reason about task and microtask ordering, understand reachability and memory leaks, and apply debounce/throttle only where they solve a real performance problem.'
};

const lessonsForTopic = (topicKey) => javascriptLessons
  .filter((lesson) => lesson.topicKey === topicKey)
  .map((lesson) => lesson.key);

const topicByKey = new Map(javascriptTopics.map((topic) => [topic.key, topic]));

const makeModules = (topicKeys, durationByKey = {}) => topicKeys.map((topicKey, index) => {
  const topic = topicByKey.get(topicKey);
  return {
    title: topic.title,
    description: moduleDescriptions[topicKey],
    order: index + 1,
    durationDays: durationByKey[topicKey] || 5,
    lessonKeys: lessonsForTopic(topicKey),
    quizTags: [quizTag(topicKey)]
  };
});

const topicsForLevel = (level) => javascriptTopics
  .filter((topic) => topic.difficulty === level)
  .map((topic) => topic.key);

const beginnerDurations = {
  'getting-started-javascript': 5,
  'variables-values': 5,
  'data-types': 6,
  'operators-conversion': 6,
  'conditions-decisions': 5,
  'loops-repetition': 5,
  functions: 7,
  'scope-hoisting': 6,
  arrays: 6,
  objects: 6,
  'references-copying': 6,
  'array-methods': 7,
  'dom-fundamentals': 6,
  'events-interaction': 6,
  'forms-browser-data': 6
};

const intermediateDurations = {
  'modern-javascript-syntax': 5,
  'functional-javascript': 5,
  'errors-debugging-modules': 5,
  'asynchronous-javascript': 8
};

const advancedDurations = {
  'javascript-internals': 7,
  'prototypes-object-model': 6,
  'event-loop-performance': 7
};

const totalDuration = (modules) => modules.reduce((sum, module) => sum + module.durationDays, 0);
const beginnerModules = makeModules(topicsForLevel('beginner'), beginnerDurations);
const intermediateModules = makeModules(topicsForLevel('intermediate'), intermediateDurations);
const advancedModules = makeModules(topicsForLevel('advanced'), advancedDurations);

export const javascriptRoadmapTemplates = [
  {
    level: 'beginner',
    title: 'Complete JavaScript — Beginner Roadmap',
    description: 'Build a strong JavaScript foundation with syntax, functions, collections, browser programming, DOM events, forms, and practical problem solving.',
    estimatedDurationDays: totalDuration(beginnerModules),
    modules: beginnerModules
  },
  {
    level: 'intermediate',
    title: 'Complete JavaScript — Intermediate Roadmap',
    description: 'Continue with modern JavaScript syntax, functional patterns, debugging and modules, then build confidence with asynchronous JavaScript.',
    estimatedDurationDays: totalDuration(intermediateModules),
    modules: intermediateModules
  },
  {
    level: 'advanced',
    title: 'Complete JavaScript — Advanced Roadmap',
    description: 'Go deeper into execution contexts, closures, this, prototypes, classes, the event loop, memory, and practical performance decisions.',
    estimatedDurationDays: totalDuration(advancedModules),
    modules: advancedModules
  }
];
