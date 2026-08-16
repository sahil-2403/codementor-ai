import { makeLesson } from './lessonFactory.js';

export const javascriptAsyncLessons = [
  makeLesson({
    key: 'async-sync-model',
    topicKey: 'asynchronous-javascript',
    title: 'Synchronous vs Asynchronous Work',
    difficulty: 'intermediate',
    theory: [
      "Synchronous JavaScript runs the current call stack one instruction at a time. A normal function call starts, completes, returns, and then the caller continues. If one synchronous operation takes a long time on the browser main thread, other JavaScript work and many interface updates must wait.",
      "Asynchronous APIs let an operation begin now and finish later. Timers, network requests, and user events are common examples. JavaScript registers what should happen when the result becomes available, continues with other work, and later runs the completion logic when the runtime schedules it.",
      "Asynchronous code does not mean all JavaScript statements suddenly run in parallel on one call stack. The host environment coordinates timers, networking, and events outside the current stack and later queues callbacks or Promise reactions for JavaScript to process when it is able to do so.",
      "The most important mental shift is understanding values over time. A result that will exist after a network request cannot be returned synchronously before the request finishes. Code must represent that future completion through a callback, Promise, or async function."
    ],
    codeExample: "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nconsole.log('C');",
    codeExplanation: 'A and C run synchronously on the current stack. The timer callback is scheduled for later, so B runs only after the current synchronous work finishes.',
    commonMistakes: [
      'Thinking asynchronous code automatically executes in parallel on the same JavaScript call stack.',
      'Trying to synchronously return a result that will only exist inside a future callback.',
      'Assuming a zero-millisecond timer means the callback runs immediately.'
    ],
    interviewDefinition: 'Synchronous work completes on the current call stack, while asynchronous APIs complete later and schedule continuation logic.',
    interviewQuestion: 'Why does setTimeout(callback, 0) not call the callback immediately?',
    interviewAnswer: 'The callback is scheduled and can run only after the current synchronous stack is empty and the runtime processes the queued task.',
    interviewChecklist: ['Explains synchronous order', 'Explains later completion', 'Mentions scheduling or queueing'],
    practiceTask: 'Predict the output order of three small scripts that mix console logs and zero-delay timers, then run them and explain any difference from your prediction.',
    knowledgeCheck: {
      type: 'code_output',
      question: 'What is the output order?',
      codeSnippet: "console.log('1');\nsetTimeout(() => console.log('2'), 0);\nconsole.log('3');",
      correctAnswer: '1, 3, 2',
      explanation: 'The synchronous logs complete before the queued timer callback.'
    },
    tags: ['javascript', 'async', 'synchronous', 'timers'],
    estimatedMinutes: 60
  }),
  makeLesson({
    key: 'timers-callbacks',
    topicKey: 'asynchronous-javascript',
    title: 'Timers and Completion Callbacks',
    difficulty: 'intermediate',
    theory: [
      "setTimeout asks the host environment to make a callback eligible after at least the requested delay. The delay is not an exact execution guarantee. When the timer expires, the callback still has to wait until JavaScript can process the queued task and the current call stack is clear.",
      "setInterval schedules repeated callbacks, but repeated intervals need care because the callback itself may take time or the application state may change. In some cases a recursive setTimeout is easier to control because the next timer is scheduled after the current work has completed.",
      "Timer APIs return identifiers that can be passed to clearTimeout or clearInterval. Cleanup matters in long-lived interfaces because a callback may no longer be relevant after navigation, a component change, or a newer user action. Leaving old timers active can create confusing duplicate behavior.",
      "Timers are a simple way to learn asynchronous callbacks without adding network complexity. Your code registers a function, the environment tracks time, and the function is invoked later. The same basic idea appears in many event and legacy callback APIs."
    ],
    codeExample: "const timerId = setTimeout(() => {\n  console.log('Reminder');\n}, 1000);\n// clearTimeout(timerId);",
    codeExplanation: 'setTimeout returns an id. Calling clearTimeout with that id before execution would cancel the pending callback.',
    commonMistakes: [
      'Treating the timer delay as an exact guaranteed execution time.',
      'Forgetting to clean up timers that are no longer relevant.',
      'Using setInterval for repeated work without considering overlapping or stale callbacks.'
    ],
    interviewDefinition: 'Timer APIs are host-provided asynchronous functions that schedule callbacks to become eligible after a delay.',
    interviewQuestion: 'Does setTimeout(fn, 1000) guarantee fn runs at exactly one second?',
    interviewAnswer: 'No. The callback becomes eligible after the delay but can run later if JavaScript is busy or scheduling is delayed.',
    interviewChecklist: ['Explains minimum delay', 'Mentions queued callback', 'Mentions cancellation or cleanup'],
    practiceTask: 'Schedule a message, store its timer id, and add a second action that cancels the timer before it executes.',
    knowledgeCheck: {
      type: 'short_answer',
      question: 'Which function cancels a timeout created by setTimeout?',
      correctAnswer: 'clearTimeout',
      explanation: 'clearTimeout uses the timer id returned by setTimeout.'
    },
    tags: ['javascript', 'timers', 'callbacks', 'settimeout'],
    estimatedMinutes: 55
  }),
  makeLesson({
    key: 'callback-completion-errors',
    topicKey: 'asynchronous-javascript',
    title: 'Designing Callback-Based Completion and Error Paths',
    difficulty: 'intermediate',
    theory: [
      "Before Promises became common, many asynchronous APIs delivered future results through callbacks. A simple design may accept separate success and error callbacks, while many Node.js APIs use an error-first callback where the first argument represents a possible error and the second represents the successful result.",
      "The asynchronous function cannot synchronously return a result that does not exist yet. Instead, it invokes the supplied callback when the operation finishes. Code that depends on that result therefore belongs in the completion path or in another abstraction that waits for the completion.",
      "Failure handling must be part of the design. If only successful completion has a callback, errors can disappear or leave the application in an unclear state. One reason Promises became popular is that they provide one standard object for composing both success and failure behavior.",
      "Callback APIs remain important because browser events, library hooks, and existing codebases use them heavily. When reading callback code, identify who owns the callback, who invokes it, when invocation can happen, and which values are supplied at that time."
    ],
    codeExample: "function loadUser(id, onSuccess, onError) {\n  setTimeout(() => {\n    if (!id) return onError(new Error('id is required'));\n    onSuccess({ id, name: 'Asha' });\n  }, 100);\n}",
    codeExplanation: 'The function does not return the future user. After the timer finishes, it calls exactly one supplied completion callback.',
    commonMistakes: [
      'Returning inside the callback and expecting the outer async function to synchronously return that value.',
      'Designing a success callback while ignoring the failure path.',
      'Allowing both success and error callbacks to run for one completion.'
    ],
    interviewDefinition: 'Callback-based asynchronous APIs deliver future success or failure by invoking supplied functions when the operation completes.',
    interviewQuestion: 'Why can an asynchronous loadUser function not return the future user immediately?',
    interviewAnswer: 'The user does not exist yet when the outer function returns, so completion must be delivered later through a callback or Promise.',
    interviewChecklist: ['Mentions future timing', 'Explains callback completion', 'Mentions failure handling'],
    practiceTask: 'Create a timer-based fake request with separate success and error callbacks, then test both a valid identifier and a missing identifier.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'Where should code that depends on a callback result run?',
      options: ['In or after the asynchronous completion path', 'Before the asynchronous operation completes', 'Only when the file is parsed'],
      correctAnswer: 'In or after the asynchronous completion path',
      explanation: 'Dependent work must wait until the future result is actually available.'
    },
    tags: ['javascript', 'callbacks', 'async', 'errors'],
    estimatedMinutes: 60
  }),
  makeLesson({
    key: 'promise-basics',
    topicKey: 'asynchronous-javascript',
    title: 'Promises: Pending, Fulfilled and Rejected',
    difficulty: 'intermediate',
    theory: [
      "A Promise is an object representing one eventual asynchronous result. It starts in the pending state and later becomes fulfilled with a value or rejected with a reason. Once a Promise settles, its state does not change again. This gives JavaScript a standard way to represent future completion.",
      "then registers logic for fulfilled values, catch handles rejections, and finally runs cleanup after settlement. These methods return new Promises, which is what makes Promise chains possible. The registered handlers normally run after the current synchronous work rather than interrupting the current call stack.",
      "Most application code consumes Promises returned by APIs rather than constructing every Promise manually. new Promise is useful when adapting a callback-style API or creating a custom asynchronous operation, but wrapping an existing Promise inside another new Promise usually adds unnecessary complexity.",
      "A rejection should eventually be handled or intentionally allowed to propagate to a caller that will handle it. Catching an error and returning undefined without considering the consequence can hide the original failure and create a more confusing bug later in the chain."
    ],
    codeExample: "const userPromise = Promise.resolve({ id: 1, name: 'Asha' });\nuserPromise\n  .then((user) => user.name.toUpperCase())\n  .then(console.log)\n  .catch(console.error);",
    codeExplanation: 'The first then receives the fulfilled user and returns a transformed value. The next then receives that returned value, while catch would receive a rejection from earlier in the chain.',
    commonMistakes: [
      'Thinking a Promise already contains its final value before it settles.',
      'Wrapping an existing Promise in new Promise without a real need.',
      'Catching a rejection and accidentally hiding a failure that the caller should know about.'
    ],
    interviewDefinition: 'A Promise represents one future result that starts pending and settles once as fulfilled or rejected.',
    interviewQuestion: 'What are the three Promise states?',
    interviewAnswer: 'Pending, fulfilled, and rejected.',
    interviewChecklist: ['Names the three states', 'Explains settlement', 'Mentions then or catch'],
    practiceTask: 'Create one resolved Promise and one rejected Promise, handle both outcomes, and explain why neither settled Promise can later change state.',
    knowledgeCheck: {
      type: 'short_answer',
      question: 'Can a fulfilled Promise later become rejected?',
      correctAnswer: 'no',
      explanation: 'Once a Promise settles, its state is fixed.'
    },
    tags: ['javascript', 'promises', 'async'],
    estimatedMinutes: 65
  }),
  makeLesson({
    key: 'promise-chaining',
    topicKey: 'asynchronous-javascript',
    title: 'Promise Chaining and Returning Async Work',
    difficulty: 'intermediate',
    theory: [
      "Promise chains work because each then call returns a new Promise. If a handler returns a normal value, the next stage receives that value. If the handler returns another Promise, the chain waits for that Promise to settle before continuing. This lets dependent asynchronous steps remain in one readable chain.",
      "A common bug is starting asynchronous work inside a then handler but forgetting to return that Promise. The outer chain then continues as if the handler had already finished. Whenever the next stage depends on asynchronous work created in the current stage, return that Promise so the chain can follow it.",
      "If a then handler throws an error, the returned Promise becomes rejected and a later catch can handle it. This gives the chain one consistent failure path instead of requiring a separate manual error check after every step. The same behavior appears later with async/await and try/catch.",
      "Keep each chain stage focused. Loading data, validating it, transforming it, and saving it are easier to understand as separate steps than as deeply nested then calls. If the chain becomes difficult to scan, async/await can express the same Promise behavior in a more sequential-looking style."
    ],
    codeExample: "loadUser()\n  .then((user) => loadOrders(user.id))\n  .then((orders) => orders.filter((order) => order.status === 'paid'))\n  .then(console.log)\n  .catch(console.error);",
    codeExplanation: 'The first handler returns loadOrders, so the next then waits for that Promise and receives the completed orders array.',
    commonMistakes: [
      'Forgetting to return a Promise created inside a then handler.',
      'Nesting then calls instead of returning the Promise and continuing one chain.',
      'Catching too early and converting a useful failure into undefined unintentionally.'
    ],
    interviewDefinition: 'Promise chaining passes returned values or adopted Promise results from one stage to the next while propagating failures as rejections.',
    interviewQuestion: 'Why should a Promise created inside then usually be returned?',
    interviewAnswer: 'Returning it makes the outer chain wait for that work and lets the next stage receive its result.',
    interviewChecklist: ['Explains a new Promise from then', 'Mentions returning async work', 'Mentions rejection propagation'],
    practiceTask: 'Chain fake loadUser and loadProgress Promise functions without nesting then calls, and make the final stage return one combined result.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'What happens when a then handler returns a Promise?',
      options: ['The chain waits for it to settle', 'The Promise becomes a string', 'The next then always runs immediately'],
      correctAnswer: 'The chain waits for it to settle',
      explanation: 'Promise resolution adopts the returned Promise before the next stage continues.'
    },
    tags: ['javascript', 'promises', 'chaining'],
    estimatedMinutes: 65
  }),
  makeLesson({
    key: 'async-await',
    topicKey: 'asynchronous-javascript',
    title: 'async Functions and await',
    difficulty: 'intermediate',
    theory: [
      "async/await is syntax built on top of Promises. An async function always returns a Promise, even when its return statement contains a normal value. await can pause the continuation of that async function until a Promise settles, which makes dependent steps easier to read.",
      "await does not block the entire JavaScript runtime. Other events and asynchronous work can continue while the current async function is waiting. When the awaited Promise settles, the function continuation is scheduled to resume according to normal Promise and event-loop rules.",
      "try/catch can handle rejected awaited Promises in a style that resembles synchronous error handling. The underlying error is still a Promise rejection. This syntax can make sequences of dependent requests easier to understand without changing the fundamental asynchronous model.",
      "Do not await independent work one operation at a time unless order is required. Starting independent Promises together and then awaiting Promise.all can reduce total waiting time. Also remember that callers of an async function still receive a Promise and must await, return, or handle it when completion matters."
    ],
    codeExample: "async function loadDashboard() {\n  const user = await loadUser();\n  const orders = await loadOrders(user.id);\n  return { user, orders };\n}",
    codeExplanation: 'The orders request depends on the loaded user id, so sequential awaits are appropriate. The async function itself returns a Promise for the final object.',
    commonMistakes: [
      'Thinking await blocks the entire JavaScript thread.',
      'Calling an async function without observing its returned Promise when completion matters.',
      'Awaiting independent requests sequentially and creating unnecessary delay.'
    ],
    interviewDefinition: 'async/await is Promise-based syntax where async functions return Promises and await pauses only the current async function until a Promise settles.',
    interviewQuestion: 'What does an async function always return?',
    interviewAnswer: 'A Promise, even when the return statement contains a normal value.',
    interviewChecklist: ['Explains async returns Promise', 'Explains await', 'Clarifies that the whole runtime is not blocked'],
    practiceTask: 'Rewrite a two-step Promise chain using async/await, add try/catch for failure, and return the final combined result to the caller.',
    knowledgeCheck: {
      type: 'short_answer',
      question: 'What does an async function return?',
      correctAnswer: 'Promise',
      explanation: 'The async keyword makes the function return a Promise.'
    },
    tags: ['javascript', 'async-await', 'promises'],
    estimatedMinutes: 65
  }),
  makeLesson({
    key: 'fetch-http-errors',
    topicKey: 'asynchronous-javascript',
    title: 'Fetch API, JSON Responses and HTTP Errors',
    difficulty: 'intermediate',
    theory: [
      "fetch is a browser API that starts an HTTP request and returns a Promise for a Response object. The Response contains status information, headers, and methods for reading the body. Calling response.json() is also asynchronous and returns a Promise for parsed JSON data.",
      "A crucial rule is that fetch normally does not reject only because the server returned an HTTP error status such as 404 or 500. A server response was received successfully at the transport level, so the Promise resolves. Application code must inspect response.ok or response.status and decide whether the response represents success.",
      "fetch can reject for network-level failures such as loss of connectivity or certain blocked requests. Robust request code therefore needs both an HTTP status check and a rejection-handling path. Treat transport failure and application-level HTTP failure as related but different cases.",
      "Keep request logic separate from interface rendering when possible. A loadUser function can request and validate data, then a page component can decide how to show loading, success, or error state. This separation makes network code reusable and easier to test."
    ],
    codeExample: "async function loadUser(id) {\n  const response = await fetch('/api/users/' + id);\n  if (!response.ok) {\n    throw new Error('Request failed with status ' + response.status);\n  }\n  return response.json();\n}",
    codeExplanation: 'The function awaits the Response, checks whether the HTTP status represents success, and then returns the Promise produced by response.json().',
    commonMistakes: [
      'Assuming fetch automatically rejects for a normal 404 or 500 response.',
      'Forgetting that response.json() is asynchronous.',
      'Mixing request logic with many unrelated DOM updates in the same function.'
    ],
    interviewDefinition: 'fetch returns a Promise for an HTTP Response, and application code normally checks response.ok because HTTP error statuses do not automatically reject it.',
    interviewQuestion: 'Does fetch usually reject for an HTTP 404 response?',
    interviewAnswer: 'No. It normally resolves with a Response whose ok property is false, so application code must handle the status explicitly.',
    interviewChecklist: ['Mentions Response Promise', 'Mentions response.ok or status', 'Mentions JSON parsing or network rejection'],
    practiceTask: 'Write loadCourses() that fetches JSON, throws for non-success HTTP statuses, returns parsed data, and handles a network failure at the caller.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'What should code normally check after fetch resolves?',
      options: ['response.ok or response.status', 'Only whether the Response object exists', 'The page CSS class'],
      correctAnswer: 'response.ok or response.status',
      explanation: 'HTTP error responses can still resolve the fetch Promise.'
    },
    tags: ['javascript', 'fetch', 'http', 'async'],
    estimatedMinutes: 70
  }),
  makeLesson({
    key: 'promise-concurrency',
    topicKey: 'asynchronous-javascript',
    title: 'Concurrent Promises with all, allSettled, race and any',
    difficulty: 'intermediate',
    theory: [
      "Independent asynchronous operations can often begin at the same time. If two requests do not depend on each other, starting both before waiting can reduce total delay compared with awaiting the first request before even starting the second. This is concurrency rather than synchronous sequencing.",
      "Promise.all waits for every input Promise to fulfill and produces an array of results in input order. If any required input rejects, Promise.all rejects. It is appropriate when the overall operation only makes sense if all required pieces succeed.",
      "Promise.allSettled waits for every input and records each fulfillment or rejection, so it is useful when partial success is still valuable. Promise.race settles with the first settled input. Promise.any fulfills with the first successful input and rejects only when all inputs reject.",
      "Choose the combinator from product requirements rather than habit. Ask whether every result is required, whether partial results are useful, whether the first completion matters, or whether the first success is enough. These combinators coordinate Promises; they do not automatically cancel operations that lose a race."
    ],
    codeExample: "async function loadDashboard() {\n  const userPromise = fetch('/api/user').then((res) => res.json());\n  const notificationsPromise = fetch('/api/notifications').then((res) => res.json());\n  const [user, notifications] = await Promise.all([userPromise, notificationsPromise]);\n  return { user, notifications };\n}",
    codeExplanation: 'Both requests start before Promise.all is awaited, so their waiting time can overlap. The returned array keeps the same order as the input Promises.',
    commonMistakes: [
      'Awaiting independent requests one at a time without a dependency reason.',
      'Using Promise.all when the application should preserve partial success.',
      'Assuming Promise.race automatically cancels the other operations.'
    ],
    interviewDefinition: 'Promise combinators coordinate multiple Promises: all requires every success, allSettled records every outcome, race uses the first settlement, and any uses the first fulfillment.',
    interviewQuestion: 'How do Promise.all and Promise.allSettled differ?',
    interviewAnswer: 'Promise.all rejects when any required input rejects, while allSettled waits for every input and reports each outcome.',
    interviewChecklist: ['Explains Promise.all', 'Explains allSettled', 'Mentions concurrency or another combinator'],
    practiceTask: 'Load three independent fake resources concurrently and compare Promise.all with Promise.allSettled when one resource fails.',
    knowledgeCheck: {
      type: 'short_answer',
      question: 'Which Promise combinator waits for every result even when some reject?',
      correctAnswer: 'Promise.allSettled',
      explanation: 'allSettled reports every fulfilled or rejected outcome.'
    },
    tags: ['javascript', 'promise-all', 'allsettled', 'concurrency'],
    estimatedMinutes: 70
  })
];
