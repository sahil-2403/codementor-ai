const quizTag = (topicKey) => `js-quiz-${topicKey}`;

export const javascriptRoadmapTemplates = [
  {
    level: 'beginner',
    title: 'Complete JavaScript — Beginner Roadmap',
    description: 'Start from the language fundamentals, learn browser interaction, then build practical confidence with modern, functional, and asynchronous JavaScript.',
    estimatedDurationDays: 49,
    modules: [
      { title: 'JavaScript Foundations', description: 'Understand how JavaScript runs, choose variables correctly, and reason about the language type system.', order: 1, durationDays: 5, lessonKeys: ['js-runtime', 'variables-constants', 'primitive-types'], quizTags: [quizTag('javascript-foundations')] },
      { title: 'Operators & Control Flow', description: 'Write predictable expressions and decision-making logic with explicit conversions, conditions, and loops.', order: 2, durationDays: 5, lessonKeys: ['operators-coercion', 'conditions', 'loops'], quizTags: [quizTag('operators-control-flow')] },
      { title: 'Functions & Scope', description: 'Build reusable functions and understand parameters, arrow functions, lexical scope, hoisting, and the temporal dead zone.', order: 3, durationDays: 6, lessonKeys: ['function-basics', 'parameters-arrow-functions', 'lexical-scope'], quizTags: [quizTag('functions-scope')] },
      { title: 'Arrays & Objects', description: 'Work confidently with collections, references, copying, searching, and common data transformations.', order: 4, durationDays: 6, lessonKeys: ['arrays', 'objects-references', 'array-object-iteration'], quizTags: [quizTag('arrays-objects')] },
      { title: 'DOM & Browser Events', description: 'Connect JavaScript to browser interfaces through safe DOM updates, event handling, delegation, forms, and validation.', order: 5, durationDays: 6, lessonKeys: ['dom-manipulation', 'browser-events', 'forms-validation'], quizTags: [quizTag('dom-browser-events')] },
      { title: 'Modern JavaScript', description: 'Use modern syntax to read and transform application data with less defensive boilerplate.', order: 6, durationDays: 4, lessonKeys: ['destructuring', 'spread-rest-optional', 'map-set-modern-syntax'], quizTags: [quizTag('modern-javascript')] },
      { title: 'Functional JavaScript', description: 'Use callbacks and array transformations while learning pure-function and immutability habits.', order: 7, durationDays: 5, lessonKeys: ['callbacks-hof', 'map-filter-reduce', 'pure-functions-immutability'], quizTags: [quizTag('functional-javascript')] },
      { title: 'Errors, Debugging & Modules', description: 'Handle failures clearly, debug with evidence, and organize JavaScript into explicit ES modules.', order: 8, durationDays: 5, lessonKeys: ['error-handling', 'debugging', 'es-modules'], quizTags: [quizTag('errors-debugging-modules')] },
      { title: 'Asynchronous JavaScript', description: 'Finish the beginner path by understanding callbacks, Promises, async/await, Fetch, and concurrent requests.', order: 9, durationDays: 7, lessonKeys: ['async-callbacks', 'promises', 'async-await-fetch'], quizTags: [quizTag('asynchronous-javascript')] }
    ]
  },
  {
    level: 'intermediate',
    title: 'Complete JavaScript — Intermediate Roadmap',
    description: 'Refresh the most important language foundations quickly, then focus on modern data patterns, async work, closures, this, and the JavaScript object model.',
    estimatedDurationDays: 38,
    modules: [
      { title: 'Functions & Scope', description: 'Reinforce function behavior, parameter design, lexical scope, hoisting, and the rules behind closures.', order: 1, durationDays: 4, lessonKeys: ['function-basics', 'parameters-arrow-functions', 'lexical-scope'], quizTags: [quizTag('functions-scope')] },
      { title: 'Arrays & Objects', description: 'Strengthen real-world collection transformations, reference behavior, and safe copying.', order: 2, durationDays: 4, lessonKeys: ['arrays', 'objects-references', 'array-object-iteration'], quizTags: [quizTag('arrays-objects')] },
      { title: 'Modern JavaScript', description: 'Use destructuring, spread/rest, optional chaining, nullish coalescing, Map, and Set intentionally.', order: 3, durationDays: 4, lessonKeys: ['destructuring', 'spread-rest-optional', 'map-set-modern-syntax'], quizTags: [quizTag('modern-javascript')] },
      { title: 'Functional JavaScript', description: 'Compose callbacks and collection transformations with pure-function and immutable update patterns.', order: 4, durationDays: 5, lessonKeys: ['callbacks-hof', 'map-filter-reduce', 'pure-functions-immutability'], quizTags: [quizTag('functional-javascript')] },
      { title: 'Errors, Debugging & Modules', description: 'Improve failure handling, debugging process, and module boundaries for maintainable applications.', order: 5, durationDays: 4, lessonKeys: ['error-handling', 'debugging', 'es-modules'], quizTags: [quizTag('errors-debugging-modules')] },
      { title: 'Asynchronous JavaScript', description: 'Build reliable Promise and async/await workflows, handle HTTP failures, and coordinate concurrent work.', order: 6, durationDays: 6, lessonKeys: ['async-callbacks', 'promises', 'async-await-fetch'], quizTags: [quizTag('asynchronous-javascript')] },
      { title: 'Execution Context, Closures & this', description: 'Understand the runtime mechanics behind scope, closures, call stacks, receivers, and method callbacks.', order: 7, durationDays: 6, lessonKeys: ['execution-context-call-stack', 'closures', 'this-call-apply-bind'], quizTags: [quizTag('execution-context-closures-this')] },
      { title: 'Prototypes & Object Model', description: 'Connect classes to prototypes and learn when composition produces cleaner object designs.', order: 8, durationDays: 5, lessonKeys: ['prototype-chain', 'classes-inheritance', 'composition-object-design'], quizTags: [quizTag('prototypes-object-model')] }
    ]
  },
  {
    level: 'advanced',
    title: 'Complete JavaScript — Advanced Roadmap',
    description: 'Focus on the language mechanisms and design tradeoffs that matter in advanced JavaScript interviews and production debugging.',
    estimatedDurationDays: 30,
    modules: [
      { title: 'Modern JavaScript', description: 'Review modern syntax through edge cases involving shallow copies, nullish values, and collection semantics.', order: 1, durationDays: 4, lessonKeys: ['destructuring', 'spread-rest-optional', 'map-set-modern-syntax'], quizTags: [quizTag('modern-javascript')] },
      { title: 'Functional JavaScript', description: 'Use higher-order functions, reductions, purity, and immutable updates to build predictable transformations.', order: 2, durationDays: 4, lessonKeys: ['callbacks-hof', 'map-filter-reduce', 'pure-functions-immutability'], quizTags: [quizTag('functional-javascript')] },
      { title: 'Asynchronous JavaScript', description: 'Reason precisely about Promise composition, concurrency, HTTP error handling, and async control flow.', order: 3, durationDays: 5, lessonKeys: ['async-callbacks', 'promises', 'async-await-fetch'], quizTags: [quizTag('asynchronous-javascript')] },
      { title: 'Execution Context, Closures & this', description: 'Trace stack behavior, closure environments, and receiver rules that cause subtle JavaScript bugs.', order: 4, durationDays: 5, lessonKeys: ['execution-context-call-stack', 'closures', 'this-call-apply-bind'], quizTags: [quizTag('execution-context-closures-this')] },
      { title: 'Prototypes & Object Model', description: 'Understand prototype delegation beneath classes and choose composition or inheritance based on the relationship.', order: 5, durationDays: 5, lessonKeys: ['prototype-chain', 'classes-inheritance', 'composition-object-design'], quizTags: [quizTag('prototypes-object-model')] },
      { title: 'Event Loop & Performance', description: 'Reason about task ordering, diagnose memory retention, and control high-frequency work with debounce and throttle.', order: 6, durationDays: 7, lessonKeys: ['event-loop-microtasks', 'memory-performance', 'debounce-throttle'], quizTags: [quizTag('event-loop-performance')] }
    ]
  }
];
