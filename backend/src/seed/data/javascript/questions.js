import { javascriptLessons } from './lessons.js';

const quizTag = (topicKey) => `js-quiz-${topicKey}`;

export const javascriptQuizQuestions = javascriptLessons.map((lesson) => ({
  question: lesson.knowledgeCheck.question,
  bank: 'quiz',
  type: lesson.knowledgeCheck.type,
  codeSnippet: lesson.knowledgeCheck.codeSnippet || '',
  options: lesson.knowledgeCheck.options || [],
  correctAnswer: lesson.knowledgeCheck.correctAnswer,
  explanation: lesson.knowledgeCheck.explanation,
  topicKey: lesson.topicKey,
  difficulty: lesson.difficulty,
  relatedLessonKey: lesson.key,
  tags: [quizTag(lesson.topicKey), ...lesson.tags]
}));

const skill = (topicKey, difficulty, type, question, correctAnswer, explanation, options = [], codeSnippet = '') => ({
  topicKey,
  difficulty,
  bank: 'skill_check',
  type,
  question,
  correctAnswer,
  explanation,
  options,
  codeSnippet,
  relatedLessonKey: null,
  tags: ['javascript', 'diagnostic', difficulty, topicKey]
});

export const javascriptSkillCheckQuestions = [
  // Intermediate: functions
  skill('functions', 'intermediate', 'code_output', 'What is printed?', '5', 'The default value is used for b because only one argument is supplied.', [], `function add(a, b = 2) { return a + b; }\nconsole.log(add(3));`),
  skill('functions', 'intermediate', 'mcq', 'What does it mean that JavaScript functions are first-class values?', 'They can be assigned, passed, and returned like other values', 'Functions can be stored in variables, passed as callbacks, and returned from other functions.', ['They can be assigned, passed, and returned like other values', 'They can only be declared globally', 'They cannot be stored in objects']),

  // Intermediate: scope and hoisting
  skill('scope-hoisting', 'intermediate', 'code_output', 'What is printed?', 'undefined', 'var is registered during scope setup and initialized to undefined before the assignment executes.', [], `console.log(value);\nvar value = 10;`),
  skill('scope-hoisting', 'intermediate', 'mcq', 'What primarily determines lexical variable lookup for a function?', 'Where the function is defined', 'Lexical scope follows the source-code structure where a function is created.', ['Where the function is defined', 'Only where the function is called', 'The number of function arguments']),

  // Intermediate: array methods and data transformation
  skill('array-methods', 'intermediate', 'code_output', 'What is printed?', '12', 'map doubles every value and reduce adds the transformed values starting from zero.', [], `const result = [1, 2, 3].map((n) => n * 2).reduce((sum, n) => sum + n, 0);\nconsole.log(result);`),
  skill('array-methods', 'intermediate', 'mcq', 'Which method is the clearest choice when you need only the first matching array item?', 'find', 'find returns the first matching item and stops when the result is known.', ['find', 'filter', 'forEach']),

  // Intermediate: modern syntax
  skill('modern-javascript-syntax', 'intermediate', 'code_output', 'What is printed?', 'Guest', 'Optional chaining returns undefined for the missing profile and ?? supplies Guest.', [], `const user = {};\nconsole.log(user.profile?.name ?? 'Guest');`),
  skill('modern-javascript-syntax', 'intermediate', 'mcq', 'Which statement about object spread is correct?', 'It creates a shallow copy of enumerable own properties', 'Object spread creates a new outer object but nested object references can remain shared.', ['It creates a shallow copy of enumerable own properties', 'It always deep-clones every nested value', 'It freezes the source object']),

  // Intermediate: errors and debugging
  skill('errors-debugging-modules', 'intermediate', 'mcq', 'When is catch most useful?', 'When the current layer can recover, translate, or add useful context', 'Catching should have a clear recovery or translation purpose rather than hiding every error.', ['When the current layer can recover, translate, or add useful context', 'Around every line regardless of need', 'Only to ignore the error']),
  skill('errors-debugging-modules', 'intermediate', 'mcq', 'What is the strongest first debugging step?', 'Reproduce the problem consistently and inspect actual runtime state', 'Reliable debugging begins with reproduction and evidence before making changes.', ['Reproduce the problem consistently and inspect actual runtime state', 'Change several files immediately', 'Hide the error with an empty catch']),

  // Intermediate: asynchronous JavaScript
  skill('asynchronous-javascript', 'intermediate', 'code_output', 'What is the output order?', 'A, C, B', 'Synchronous work completes before the queued timer callback.', [], `console.log('A');\nsetTimeout(() => console.log('B'), 0);\nconsole.log('C');`),
  skill('asynchronous-javascript', 'intermediate', 'mcq', 'Does fetch normally reject its Promise for an HTTP 404 response?', 'No, code should inspect response.ok or response.status', 'fetch normally resolves when an HTTP response arrives even if its status represents an application error.', ['No, code should inspect response.ok or response.status', 'Yes, every 404 automatically rejects', 'fetch never returns a Response object']),

  // Advanced: internals, closure, this
  skill('javascript-internals', 'advanced', 'code_output', 'What is printed?', '6, 7', 'The returned closure retains and updates the count binding across calls.', [], `function createCounter() {\n  let count = 5;\n  return () => ++count;\n}\nconst next = createCounter();\nconsole.log(next(), next());`),
  skill('javascript-internals', 'advanced', 'mcq', 'What primarily determines lexical variable lookup for a function?', 'Where the function is defined', 'Lexical scope follows source-code nesting rather than the later call site.', ['Where the function is defined', 'Only the most recent caller', 'The value returned from the function']),
  skill('javascript-internals', 'advanced', 'mcq', 'What usually determines this for a normal method function?', 'How the function is called', 'Normal-function this is primarily based on the call site.', ['How the function is called', 'Only where the function text was written', 'The first local variable']),
  skill('javascript-internals', 'advanced', 'mcq', 'What can keep captured data from being garbage-collected?', 'A reachable closure that still references the data', 'A reachable closure keeps captured values reachable too.', ['A reachable closure that still references the data', 'A comment mentioning the variable', 'Using const instead of let']),

  // Advanced: prototype/object model
  skill('prototypes-object-model', 'advanced', 'mcq', 'Where is a normal class instance method stored?', 'On the class constructor prototype', 'JavaScript class methods are prototype methods shared by instances.', ['On the class constructor prototype', 'As a duplicated own method on every instance', 'Only on Object.prototype']),
  skill('prototypes-object-model', 'advanced', 'code_output', 'What is printed?', 'false', 'describe is inherited from the prototype rather than stored directly on child.', [], `const base = { describe() {} };\nconst child = Object.create(base);\nconsole.log(Object.hasOwn(child, 'describe'));`),
  skill('prototypes-object-model', 'advanced', 'mcq', 'What does new link a newly created instance to?', 'Constructor.prototype', 'The instance prototype is linked to the constructor prototype.', ['Constructor.prototype', 'Only the constructor local scope', 'The first constructor argument']),
  skill('prototypes-object-model', 'advanced', 'mcq', 'When is composition often clearer than inheritance?', 'When an object needs reusable behavior but is not a real subtype', 'Composition avoids inventing a false is-a relationship only for code reuse.', ['When an object needs reusable behavior but is not a real subtype', 'Whenever JavaScript contains any class', 'Only when there are no functions']),

  // Advanced: event loop/performance
  skill('event-loop-performance', 'advanced', 'code_output', 'What is the output order?', 'S, P, T', 'Synchronous code runs first, Promise reactions are microtasks, and timers are later tasks.', [], `setTimeout(() => console.log('T'), 0);\nPromise.resolve().then(() => console.log('P'));\nconsole.log('S');`),
  skill('event-loop-performance', 'advanced', 'mcq', 'Why can a long synchronous loop make a browser interface feel frozen?', 'It keeps the JavaScript stack busy so queued callbacks and rendering must wait', 'Long synchronous work blocks progress on the main JavaScript thread.', ['It keeps the JavaScript stack busy so queued callbacks and rendering must wait', 'It makes every Promise synchronous forever', 'It deletes the DOM']),
  skill('event-loop-performance', 'advanced', 'mcq', 'When can an object become eligible for garbage collection?', 'When it is no longer reachable from live program references', 'Reachability determines whether the running program can still access the object.', ['When it is no longer reachable from live program references', 'Immediately when any local block ends even if a global still references it', 'Only after calling a manual free function']),
  skill('event-loop-performance', 'advanced', 'mcq', 'Which pattern waits until rapid calls stop for a delay before running work?', 'debounce', 'Debounce resets its timer after repeated calls and runs after the quiet period.', ['debounce', 'throttle only', 'prototype delegation'])
];
