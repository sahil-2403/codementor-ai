import { task } from './taskFactory.js';

export const javascriptPracticePart4 = [
  task({
    topicKey: 'errors-debugging-modules', title: 'Parse Settings with a Useful Error Result', difficulty: 'intermediate', relatedLessonKeys: ['try-catch-finally'],
    description: 'Wrap JSON parsing so callers receive a structured success or failure result.',
    requirements: ['Use try/catch.', 'Return { ok: true, value } for valid JSON.', 'Return { ok: false, message } for invalid JSON.', 'Do not use an empty catch.'],
    starterHints: ['JSON.parse throws when the text is invalid JSON.'], expectedOutput: 'Both valid and invalid input are handled without crashing the caller.',
    solution: "function parseSettings(text) {\n  try {\n    return { ok: true, value: JSON.parse(text) };\n  } catch (error) {\n    return { ok: false, message: 'Settings are not valid JSON' };\n  }\n}",
    evaluationChecklist: ['Uses try/catch', 'Returns structured success', 'Returns structured failure', 'Does not hide the failure path'], tags: ['errors', 'try-catch'], estimatedMinutes: 35
  }),
  task({
    topicKey: 'errors-debugging-modules', title: 'Debug a Numeric String Average', difficulty: 'intermediate', relatedLessonKeys: ['systematic-debugging'],
    description: 'Fix an average function that behaves incorrectly when numeric values arrive as strings.',
    requirements: ['Reproduce the bug.', 'Inspect the runtime type.', 'Convert at the input boundary.', 'Handle an empty array.'],
    starterHints: ['Use Number(value).', 'Return 0 for an empty list.'], expectedOutput: "['10', '20', '30'] returns 20.",
    solution: "function average(values) {\n  if (!values.length) return 0;\n  let total = 0;\n  for (const value of values) {\n    total += Number(value);\n  }\n  return total / values.length;\n}",
    evaluationChecklist: ['Handles empty input', 'Converts numeric strings', 'Calculates the average', 'Explains the root cause'], tags: ['debugging', 'numbers'], estimatedMinutes: 40
  }),
  task({
    topicKey: 'asynchronous-javascript', title: 'Chain Dependent Async Operations', difficulty: 'intermediate', relatedLessonKeys: ['promise-chaining'],
    description: 'Load a user and then that user’s orders without nesting Promise chains.',
    requirements: ['Call loadUser first.', 'Return loadOrders(user.id) from the first then.', 'Process orders in the next then.', 'Add one catch handler.'],
    starterHints: ['Return the dependent Promise so the outer chain waits.'], expectedOutput: 'Order processing starts only after both dependent operations complete.',
    solution: "loadUser()\n  .then((user) => loadOrders(user.id))\n  .then((orders) => orders.filter((order) => order.status === 'paid'))\n  .then(console.log)\n  .catch(console.error);",
    evaluationChecklist: ['Returns dependent Promise', 'Avoids nested then blocks', 'Processes the next result', 'Handles rejection'], tags: ['promises', 'chaining'], estimatedMinutes: 40
  }),
  task({
    topicKey: 'asynchronous-javascript', title: 'Load Dashboard Data in Parallel', difficulty: 'intermediate', relatedLessonKeys: ['fetch-http-errors', 'promise-concurrency'],
    description: 'Fetch two independent resources concurrently and reject unsuccessful HTTP responses.',
    requirements: ['Start both operations before waiting.', 'Check response.ok.', 'Parse both JSON bodies.', 'Return { user, notifications }.'],
    starterHints: ['Create Promise-returning helpers and use Promise.all.'], expectedOutput: 'Both independent requests overlap and the function returns combined parsed data.',
    solution: "async function getJson(url) {\n  const response = await fetch(url);\n  if (!response.ok) throw new Error('Request failed: ' + response.status);\n  return response.json();\n}\nasync function loadDashboard() {\n  const userPromise = getJson('/api/user');\n  const notificationsPromise = getJson('/api/notifications');\n  const [user, notifications] = await Promise.all([userPromise, notificationsPromise]);\n  return { user, notifications };\n}",
    evaluationChecklist: ['Checks HTTP status', 'Starts requests independently', 'Uses Promise.all', 'Returns combined data'], tags: ['fetch', 'promise-all', 'concurrency'], estimatedMinutes: 50
  }),
  task({
    topicKey: 'javascript-internals', title: 'Build a Closure-Based Counter', difficulty: 'advanced', relatedLessonKeys: ['closures-intuition', 'closure-patterns-memory'],
    description: 'Create private counter state that can only be changed through returned methods.',
    requirements: ['Keep count local to the factory.', 'Return increment, decrement, and current methods.', 'Do not expose count directly.', 'Show two independent counters.'],
    starterHints: ['Each factory call creates a separate lexical environment.'], expectedOutput: 'Two counters keep independent private state.',
    solution: "function createCounter(start = 0) {\n  let count = start;\n  return {\n    increment() { count += 1; return count; },\n    decrement() { count -= 1; return count; },\n    current() { return count; }\n  };\n}\nconst a = createCounter(5);\nconst b = createCounter(10);",
    evaluationChecklist: ['Uses closure state', 'Exposes requested methods', 'Keeps count private', 'Demonstrates independent factories'], tags: ['closures', 'private-state'], estimatedMinutes: 45
  }),
  task({
    topicKey: 'javascript-internals', title: 'Fix a Lost this Callback', difficulty: 'advanced', relatedLessonKeys: ['this-method-loss-arrows', 'call-apply-bind'],
    description: 'Fix a method that loses its receiver when it is passed as a callback.',
    requirements: ['Create a method that uses this.name.', 'Demonstrate the detached method problem.', 'Fix it with bind or an arrow wrapper.', 'Explain why the receiver is preserved.'],
    starterHints: ['bind returns a new function with a fixed this value.'], expectedOutput: 'The delayed callback uses the correct user name.',
    solution: "const user = {\n  name: 'Asha',\n  greet() { return 'Hello ' + this.name; }\n};\nconst safeGreet = user.greet.bind(user);\nsetTimeout(() => console.log(safeGreet()), 0);",
    evaluationChecklist: ['Method uses this', 'Fixes detached call', 'Uses bind or wrapper correctly', 'Explains receiver preservation'], tags: ['this', 'bind', 'callbacks'], estimatedMinutes: 45
  }),
  task({
    topicKey: 'prototypes-object-model', title: 'Create Shared Prototype Methods', difficulty: 'advanced', relatedLessonKeys: ['constructors-new'],
    description: 'Create two instances that share one method through a constructor prototype.',
    requirements: ['Create a User constructor.', 'Store name on each instance.', 'Put greet on User.prototype.', 'Show both instances share the same greet function.'],
    starterHints: ['Compare first.greet === second.greet.'], expectedOutput: 'Both instances work and the method-reference comparison is true.',
    solution: "function User(name) {\n  this.name = name;\n}\nUser.prototype.greet = function () {\n  return 'Hello ' + this.name;\n};\nconst first = new User('Asha');\nconst second = new User('Ravi');\nconsole.log(first.greet === second.greet);",
    evaluationChecklist: ['Uses constructor with new', 'Stores instance data', 'Uses prototype method', 'Proves method sharing'], tags: ['prototype', 'constructor'], estimatedMinutes: 45
  }),
  task({
    topicKey: 'prototypes-object-model', title: 'Refactor Inheritance into Composition', difficulty: 'advanced', relatedLessonKeys: ['composition-vs-inheritance'],
    description: 'Replace an unnecessary inheritance relationship with a small composed logging dependency.',
    requirements: ['Create one logger capability.', 'Create a service that receives logging behavior.', 'Avoid a subclass.', 'Preserve logging behavior.'],
    starterHints: ['Composition can be a function dependency.'], expectedOutput: 'The service logs through the composed capability without inheritance.',
    solution: "const logger = { log(message) { console.log(message); } };\nfunction createCourseService(log) {\n  return { publish(title) { log('Published: ' + title); } };\n}\nconst service = createCourseService(logger.log.bind(logger));",
    evaluationChecklist: ['Removes inheritance', 'Uses composition', 'Preserves behavior', 'Keeps responsibilities clear'], tags: ['composition', 'design'], estimatedMinutes: 50
  }),
  task({
    topicKey: 'event-loop-performance', title: 'Predict Event Loop Ordering', difficulty: 'advanced', relatedLessonKeys: ['event-loop-ordering'],
    description: 'Reason through synchronous logs, Promise microtasks, and a timer task.',
    requirements: ['Write the expected order first.', 'Identify synchronous work.', 'Identify microtasks.', 'Identify the timer task.', 'Explain why microtasks run first.'],
    starterHints: ['Microtasks are drained after the synchronous stack becomes empty.'], expectedOutput: 'The expected order is A, E, B, C, D.',
    solution: "console.log('A');\nPromise.resolve().then(() => {\n  console.log('B');\n  Promise.resolve().then(() => console.log('C'));\n});\nsetTimeout(() => console.log('D'), 0);\nconsole.log('E');\n// A, E, B, C, D",
    evaluationChecklist: ['Gets order correct', 'Identifies synchronous work', 'Identifies microtasks', 'Identifies timer task', 'Explains draining'], tags: ['event-loop', 'microtasks'], estimatedMinutes: 45
  }),
  task({
    topicKey: 'event-loop-performance', title: 'Implement debounce', difficulty: 'advanced', relatedLessonKeys: ['debounce-throttle-performance'],
    description: 'Implement debounce(fn, delay) so repeated calls reset the timer and only the latest call runs after a quiet period.',
    requirements: ['Return a wrapper function.', 'Keep timerId in closure state.', 'Clear the previous timeout.', 'Preserve arguments.', 'Preserve this.'],
    starterHints: ['Use rest parameters.', 'Use fn.apply(this, args) in the timeout.'], expectedOutput: 'Rapid calls produce only the final invocation after the delay.',
    solution: "function debounce(fn, delay) {\n  let timerId;\n  return function (...args) {\n    clearTimeout(timerId);\n    timerId = setTimeout(() => fn.apply(this, args), delay);\n  };\n}",
    evaluationChecklist: ['Returns wrapper', 'Uses closure timer state', 'Clears previous timer', 'Preserves arguments', 'Preserves this'], tags: ['debounce', 'performance', 'closures'], estimatedMinutes: 50
  })
];
