import { makeLesson } from './lessonFactory.js';

export const javascriptFunctionalLessons = [
  makeLesson({
    key: 'callbacks-functions-values',
    topicKey: 'functional-javascript',
    title: 'Callbacks from First Principles',
    difficulty: 'intermediate',
    theory: [
      "A callback is a function passed to other code so that the receiving code can call it at the appropriate time. You have already seen callbacks in array methods and event listeners. The important idea is not whether the work is asynchronous; the important idea is that behavior itself is being supplied as a value.",
      "Because functions are first-class values in JavaScript, one general function can work with many different behaviors. A filtering helper can receive one predicate for active users and another predicate for expensive products without changing the helper itself. This separates the workflow from the decision being performed.",
      "When passing a callback, usually pass the function reference rather than calling it immediately. handleClick and handleClick() are different values: the first is the function, while the second executes the function immediately and produces its return value. Many callback bugs come from confusing these two forms.",
      "Callbacks are a foundation for higher-order functions, browser events, Promise handlers, and many library APIs. Before using more advanced patterns, make sure you can identify who receives the callback, when it will call the callback, and what arguments it supplies."
    ],
    codeExample: "function runOperation(value, operation) {\n  return operation(value);\n}\nconst double = (number) => number * 2;\nconsole.log(runOperation(5, double));",
    codeExplanation: 'double is passed as a function value. runOperation decides when to call it and supplies value as the callback argument.',
    commonMistakes: [
      'Calling a callback while passing it instead of passing the function reference.',
      'Assuming every callback is asynchronous even though many callbacks run synchronously.',
      'Writing large anonymous callbacks that would be clearer as named functions.'
    ],
    interviewDefinition: 'A callback is a function supplied to another function or API so the receiver can invoke that behavior when needed.',
    interviewQuestion: 'Are callbacks always asynchronous?',
    interviewAnswer: 'No. Array methods call callbacks synchronously, while events and many I/O APIs invoke callbacks later.',
    interviewChecklist: ['Defines a passed function', 'Explains receiver invocation', 'Distinguishes sync and async callbacks'],
    practiceTask: 'Write applyToNumber(number, callback), then use separate double and square callbacks and compare the returned values.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'What should addEventListener normally receive as its handler argument?',
      options: ['A function reference', 'Only the return value of calling the handler immediately', 'A number'],
      correctAnswer: 'A function reference',
      explanation: 'The browser needs the callback itself so it can call it when the event occurs.'
    },
    tags: ['javascript', 'callbacks', 'functions'],
    estimatedMinutes: 55
  }),
  makeLesson({
    key: 'higher-order-functions',
    topicKey: 'functional-javascript',
    title: 'Higher-Order Functions and Reusable Behavior',
    difficulty: 'intermediate',
    theory: [
      "A higher-order function accepts a function as an argument, returns a function, or does both. Array methods such as map and filter are common examples because the method provides the iteration workflow while the callback provides the changing behavior for each value.",
      "Returning functions is useful when configuration should be applied once and reused later. A formatter factory can receive a prefix and return a function that already remembers that prefix. A wrapper can receive an operation and return another function that adds logging, timing, retries, or validation around it.",
      "Higher-order functions can reduce duplication, but abstraction should solve a real repeated pattern. If two normal functions are easier to understand than a generic wrapper, the simpler version is often better. Reuse is useful only when the resulting code remains clear to the people maintaining it.",
      "Names matter more as functions become more generic. Parameters such as predicate, formatter, validator, or operation communicate what role the supplied function plays. This keeps the higher-order function readable without requiring the caller to inspect its implementation every time."
    ],
    codeExample: "function withLogging(operation) {\n  return function (...args) {\n    console.log('Running operation');\n    return operation(...args);\n  };\n}\nconst add = (a, b) => a + b;\nconst loggedAdd = withLogging(add);\nconsole.log(loggedAdd(2, 3));",
    codeExplanation: 'withLogging receives one operation and returns a new function that adds logging before forwarding the same arguments and returning the original result.',
    commonMistakes: [
      'Creating a generic abstraction before a repeated pattern actually exists.',
      'Forgetting to return the wrapped function result and changing program behavior.',
      'Using vague names such as callback everywhere even when a more specific role is known.'
    ],
    interviewDefinition: 'A higher-order function receives a function, returns a function, or both.',
    interviewQuestion: 'Why are map and filter higher-order functions?',
    interviewAnswer: 'They accept callback functions that define how values should be transformed or selected.',
    interviewChecklist: ['Defines higher-order function', 'Gives a valid example', 'Explains workflow versus behavior'],
    practiceTask: 'Write withTiming(operation) that returns a wrapper, measures the operation duration, forwards all arguments, and returns the original result.',
    knowledgeCheck: {
      type: 'short_answer',
      question: 'What makes a function higher-order?',
      correctAnswer: 'It accepts a function or returns a function',
      explanation: 'Receiving or returning function values is what makes a function higher-order.'
    },
    tags: ['javascript', 'higher-order-functions', 'callbacks'],
    estimatedMinutes: 60
  }),
  makeLesson({
    key: 'pure-functions-side-effects',
    topicKey: 'functional-javascript',
    title: 'Pure Functions and Side Effects',
    difficulty: 'intermediate',
    theory: [
      "A pure function produces the same result for the same explicit inputs and does not create observable side effects. It does not mutate arguments, change global state, write to storage, update the DOM, or make network requests. This makes the function easier to understand because its result can be predicted from its inputs.",
      "Real applications still need side effects. Saving data, updating the interface, logging, and requesting APIs are useful operations. Functional design is not about removing every side effect; it is about keeping calculation logic separate from effectful boundaries so each responsibility is easier to test and change.",
      "A function can look simple and still be impure if it reads a changing global variable or mutates an object passed by reference. Hidden dependencies make behavior harder to reproduce. Passing required values as parameters makes the function contract more visible and usually improves testability.",
      "Purity is a design property rather than a JavaScript keyword. Use it where it improves predictability, especially for calculations, transformations, and validation. Side-effecting functions remain necessary, but they should make their effects clear instead of hiding them inside unrelated calculations."
    ],
    codeExample: "function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\nconst total = calculateTotal([{ price: 100 }, { price: 50 }]);\nconsole.log(total);",
    codeExplanation: 'The function depends only on the supplied items and returns a value without changing the array or any external state.',
    commonMistakes: [
      'Calling a function pure even though it mutates an argument object.',
      'Treating every side effect as bad instead of separating necessary effects from pure calculations.',
      'Reading hidden global values inside a calculation that should receive those values as parameters.'
    ],
    interviewDefinition: 'A pure function has deterministic output for its explicit inputs and produces no observable side effects.',
    interviewQuestion: 'Why are pure functions usually easy to test?',
    interviewAnswer: 'Their result depends only on explicit inputs and they do not require hidden state or external effects.',
    interviewChecklist: ['Mentions same inputs and same output', 'Mentions no side effects', 'Explains predictability or testability'],
    practiceTask: 'Refactor a calculation that reads a global tax rate so the rate is passed explicitly and the function returns a value without changing outside state.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'Which action makes a function impure?',
      options: ['Mutating a global object', 'Returning a calculation from parameters', 'Creating a local constant'],
      correctAnswer: 'Mutating a global object',
      explanation: 'Changing external state is an observable side effect.'
    },
    tags: ['javascript', 'pure-functions', 'side-effects'],
    estimatedMinutes: 60
  }),
  makeLesson({
    key: 'immutability-composition',
    topicKey: 'functional-javascript',
    title: 'Immutability and Composing Small Transformations',
    difficulty: 'intermediate',
    theory: [
      "Immutability means treating an existing value as unchanged and creating a new value when application state should be updated. JavaScript does not automatically enforce immutability for normal objects and arrays, but methods such as map and filter plus spread syntax make non-mutating updates practical.",
      "The benefit is predictable history. Code that still holds the previous value does not suddenly observe an unexpected change caused somewhere else. This is especially useful when state is shared between functions, UI updates, caches, or asynchronous operations where mutation timing can otherwise become confusing.",
      "Small pure transformations can also be composed. One function can normalize input, another can calculate a result, and another can format that result. Each step exposes a clear input and output. This is usually easier to test than one large function that performs calculations and side effects together.",
      "Immutability has a cost because new objects and arrays are created. The goal is not to clone everything blindly. Copy the parts that represent changed state and reuse safe unchanged values. Prefer understandable data flow over clever pipelines that hide what each step actually does."
    ],
    codeExample: "const normalizeName = (name) => name.trim();\nconst capitalizeName = (name) => name.charAt(0).toUpperCase() + name.slice(1);\nconst raw = '  asha';\nconst clean = capitalizeName(normalizeName(raw));\nconsole.log(clean);",
    codeExplanation: 'Each function performs one focused transformation. The result of normalizeName becomes the input to capitalizeName without mutating shared state.',
    commonMistakes: [
      'Mutating a nested input while describing the overall update as immutable.',
      'Creating too many tiny abstractions that make a simple transformation harder to follow.',
      'Deep-cloning entire data structures when only one changed path needs new references.'
    ],
    interviewDefinition: 'Immutability creates new values instead of changing shared existing state, while composition combines focused functions by passing one result into the next.',
    interviewQuestion: 'What is one practical benefit of immutable updates?',
    interviewAnswer: 'Other code can keep using the previous value without observing an unexpected mutation from another part of the program.',
    interviewChecklist: ['Defines immutability', 'Explains predictable previous state', 'Explains function composition'],
    practiceTask: 'Create normalizeTitle and addPrefix as separate pure functions, then compose them without mutating the original input object or string.',
    knowledgeCheck: {
      type: 'short_answer',
      question: 'Does writing immutable code automatically freeze normal JavaScript objects?',
      correctAnswer: 'no',
      explanation: 'Immutability is normally a coding approach unless an object is explicitly frozen or managed by another system.'
    },
    tags: ['javascript', 'immutability', 'composition', 'functional'],
    estimatedMinutes: 60
  })
];
