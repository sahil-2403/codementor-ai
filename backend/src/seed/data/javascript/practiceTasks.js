const task = (key, topicKey, title, difficulty, description, relatedLessonKeys, requirements, starterHints, expectedOutput, evaluationChecklist, solution, tags, estimatedMinutes) => ({
  key, topicKey, title, difficulty, description, relatedLessonKeys, requirements, starterHints,
  expectedOutput, evaluationChecklist, solution, tags, estimatedMinutes
});

export const javascriptPracticeTasks = [
  task(
    'format-user-profile', 'javascript-foundations', 'Format a User Profile', 'beginner',
    'Write a function that receives a user object and returns one display string without mutating the input.',
    ['variables-constants', 'primitive-types'],
    ['Accept an object with name, age, and active fields', 'Return "Name: <name> | Age: <age> | Status: Active/Inactive"', 'Do not mutate the user object', 'Handle a missing age with the text "Unknown"'],
    ['Prefer const for values that are not reassigned', 'Use a conditional expression for the status'],
    'formatUser({ name: "Asha", age: 22, active: true }) -> "Name: Asha | Age: 22 | Status: Active"',
    ['Returns the required display format', 'Handles missing age', 'Uses the active boolean correctly', 'Does not mutate the input'],
    "function formatUser(user) {\n  const age = user.age ?? 'Unknown';\n  const status = user.active ? 'Active' : 'Inactive';\n  return `Name: ${user.name} | Age: ${age} | Status: ${status}`;\n}",
    ['javascript', 'variables', 'types', 'strings'], 25
  ),
  task(
    'type-inspector', 'javascript-foundations', 'Build a Type Inspector', 'beginner',
    'Implement describeType(value) so arrays and null are reported correctly instead of relying only on typeof.',
    ['primitive-types'],
    ['Return "array" for arrays', 'Return "null" for null', 'Return the normal typeof result for other values', 'Do not stringify the input first'],
    ['Check Array.isArray before typeof', 'Check null explicitly'],
    'describeType([1, 2]) -> "array"; describeType(null) -> "null"; describeType(5) -> "number"',
    ['Detects arrays correctly', 'Detects null correctly', 'Returns valid typeof results for normal values', 'Works for functions and objects'],
    "function describeType(value) {\n  if (Array.isArray(value)) return 'array';\n  if (value === null) return 'null';\n  return typeof value;\n}",
    ['javascript', 'typeof', 'arrays', 'null'], 20
  ),

  task(
    'grade-calculator', 'operators-control-flow', 'Build a Grade Calculator', 'beginner',
    'Convert a numeric score into a letter grade while rejecting scores outside the accepted range.',
    ['operators-coercion', 'conditions'],
    ['Accept a score from 0 to 100', 'Return A for 90+, B for 80+, C for 70+, D for 60+, otherwise F', 'Return "Invalid score" for non-numbers or out-of-range values', 'Use clear guard clauses'],
    ['Validate before checking grade ranges', 'Order conditions from highest threshold to lowest'],
    'getGrade(86) -> "B"; getGrade(120) -> "Invalid score"',
    ['Rejects invalid input', 'Handles all five grade ranges', 'Boundary values are correct', 'Control flow is easy to follow'],
    "function getGrade(score) {\n  if (typeof score !== 'number' || score < 0 || score > 100) return 'Invalid score';\n  if (score >= 90) return 'A';\n  if (score >= 80) return 'B';\n  if (score >= 70) return 'C';\n  if (score >= 60) return 'D';\n  return 'F';\n}",
    ['javascript', 'conditions', 'validation'], 25
  ),
  task(
    'fizzbuzz-rules', 'operators-control-flow', 'FizzBuzz with Custom Rules', 'beginner',
    'Generate values from 1 to limit, replacing multiples of 3 and 5 with meaningful labels.',
    ['conditions', 'loops'],
    ['Return an array from 1 through limit', 'Use Fizz for multiples of 3', 'Use Buzz for multiples of 5', 'Use FizzBuzz for multiples of both', 'Return an empty array when limit is below 1'],
    ['Check the combined 3-and-5 condition first', 'Modulo (%) gives the remainder'],
    'fizzBuzz(5) -> [1, 2, "Fizz", 4, "Buzz"]',
    ['Loops through the correct range', 'Combined multiples return FizzBuzz', 'Other multiples return the correct label', 'Normal numbers remain numbers'],
    "function fizzBuzz(limit) {\n  const result = [];\n  for (let n = 1; n <= limit; n += 1) {\n    if (n % 15 === 0) result.push('FizzBuzz');\n    else if (n % 3 === 0) result.push('Fizz');\n    else if (n % 5 === 0) result.push('Buzz');\n    else result.push(n);\n  }\n  return result;\n}",
    ['javascript', 'loops', 'modulo', 'conditions'], 30
  ),

  task(
    'price-calculator', 'functions-scope', 'Build a Reusable Price Calculator', 'beginner',
    'Create small functions for subtotal, discount, tax, and final total instead of one large calculation.',
    ['function-basics', 'parameters-arrow-functions'],
    ['Create calculateSubtotal(prices)', 'Create applyDiscount(total, percent = 0)', 'Create addTax(total, rate = 0.18)', 'Create calculateFinal(prices, options)', 'Do not mutate the prices array'],
    ['Keep each function responsible for one calculation', 'Use default parameters for optional percentages'],
    'calculateFinal([100, 200], { discount: 10, tax: 0.18 }) -> 318.6',
    ['Functions are separated by responsibility', 'Defaults work when options are omitted', 'Calculations are composed correctly', 'Input array is not mutated'],
    "const calculateSubtotal = (prices) => prices.reduce((sum, price) => sum + price, 0);\nconst applyDiscount = (total, percent = 0) => total * (1 - percent / 100);\nconst addTax = (total, rate = 0.18) => total * (1 + rate);\nfunction calculateFinal(prices, { discount = 0, tax = 0.18 } = {}) {\n  return addTax(applyDiscount(calculateSubtotal(prices), discount), tax);\n}",
    ['javascript', 'functions', 'parameters', 'composition'], 35
  ),
  task(
    'fix-scope-bug', 'functions-scope', 'Fix a Scope Bug', 'beginner',
    'Refactor a function that accidentally depends on a global variable so its result depends only on explicit inputs.',
    ['lexical-scope', 'function-basics'],
    ['Implement createGreeting(name, prefix)', 'Do not read or write global variables', 'Use "Hello" when prefix is omitted', 'Return the greeting string instead of logging it'],
    ['Move required values into parameters', 'Use a default parameter'],
    'createGreeting("Sahil") -> "Hello, Sahil"',
    ['No global dependency remains', 'Default prefix works', 'Custom prefix works', 'Function returns a value'],
    "function createGreeting(name, prefix = 'Hello') {\n  return `${prefix}, ${name}`;\n}",
    ['javascript', 'scope', 'functions', 'defaults'], 25
  ),

  task(
    'group-products', 'arrays-objects', 'Group Products by Category', 'beginner',
    'Transform an array of product records into an object where each category contains its products.',
    ['arrays', 'objects-references', 'array-object-iteration'],
    ['Return an object keyed by category', 'Each category value must be an array', 'Do not mutate product objects', 'Handle an empty input with {}'],
    ['reduce can accumulate an object', 'Create a category array only when it is first needed'],
    'groupProducts([{name:"A",category:"books"},{name:"B",category:"games"}]) -> { books:[...], games:[...] }',
    ['Correctly groups every product', 'Supports multiple products in one category', 'Returns {} for empty input', 'Does not mutate source records'],
    "function groupProducts(products) {\n  return products.reduce((groups, product) => {\n    const key = product.category;\n    groups[key] = [...(groups[key] || []), product];\n    return groups;\n  }, {});\n}",
    ['javascript', 'arrays', 'objects', 'grouping'], 35
  ),
  task(
    'transform-users', 'arrays-objects', 'Find and Transform User Records', 'beginner',
    'Select active users and return a simplified display model sorted by name.',
    ['arrays', 'array-object-iteration'],
    ['Keep only active users', 'Return objects containing id and displayName', 'displayName must be uppercase', 'Sort the returned objects by displayName', 'Do not mutate the source array'],
    ['Use filter then map', 'Sort a copied/transformed array, not the source'],
    'Returns [{ id, displayName }] for active users only, alphabetically by displayName.',
    ['Filters inactive users', 'Creates the required object shape', 'Uppercases names', 'Sorts output without mutating source'],
    "function activeUserSummaries(users) {\n  return users\n    .filter((user) => user.active)\n    .map((user) => ({ id: user.id, displayName: user.name.toUpperCase() }))\n    .sort((a, b) => a.displayName.localeCompare(b.displayName));\n}",
    ['javascript', 'filter', 'map', 'objects'], 30
  ),

  task(
    'counter-event-logic', 'dom-browser-events', 'Build Interactive Counter Logic', 'beginner',
    'Write the JavaScript for a counter with increment, decrement, and reset buttons using one render function.',
    ['dom-manipulation', 'browser-events'],
    ['Select the counter display and three buttons', 'Keep the numeric count in JavaScript state', 'Increment and decrement by one', 'Reset to zero', 'Use one render function to update textContent'],
    ['Do not store the source of truth only in the DOM', 'Attach listeners once'],
    'The display starts at 0 and updates after each button action.',
    ['Keeps a numeric state variable', 'All three controls work', 'Uses textContent for rendering', 'Avoids duplicate render logic'],
    "const display = document.querySelector('[data-count]');\nconst increment = document.querySelector('[data-increment]');\nconst decrement = document.querySelector('[data-decrement]');\nconst reset = document.querySelector('[data-reset]');\nlet count = 0;\nconst render = () => { display.textContent = String(count); };\nincrement.addEventListener('click', () => { count += 1; render(); });\ndecrement.addEventListener('click', () => { count -= 1; render(); });\nreset.addEventListener('click', () => { count = 0; render(); });\nrender();",
    ['javascript', 'dom', 'events', 'state'], 35
  ),
  task(
    'form-validation-handler', 'dom-browser-events', 'Build a Form Validation Handler', 'beginner',
    'Create plain validation functions plus a submit handler for name and email fields.',
    ['forms-validation', 'browser-events'],
    ['Trim both values', 'Name must be at least 2 characters', 'Email must contain @', 'Prevent submission when invalid', 'Return or display specific field errors instead of one generic message'],
    ['Keep validation rules separate from DOM updates', 'Validate normalized values'],
    'Valid input produces no errors; invalid input returns a clear name or email message.',
    ['Normalizes whitespace', 'Validates both fields', 'Prevents invalid submission', 'Validation logic can be tested without the DOM'],
    "function validateForm({ name, email }) {\n  const errors = {};\n  const cleanName = name.trim();\n  const cleanEmail = email.trim().toLowerCase();\n  if (cleanName.length < 2) errors.name = 'Name is too short';\n  if (!cleanEmail.includes('@')) errors.email = 'Email is invalid';\n  return { values: { name: cleanName, email: cleanEmail }, errors };\n}",
    ['javascript', 'forms', 'validation', 'events'], 35
  ),

  task(
    'normalize-user-record', 'modern-javascript', 'Normalize a User Record with Modern Syntax', 'beginner',
    'Use destructuring, defaults, optional chaining, and nullish coalescing to create a safe display record from an API-like user object.',
    ['destructuring', 'spread-rest-optional'],
    ['Read id and name with destructuring', 'Use "Unknown" when profile.city is missing', 'Preserve a valid score of 0', 'Return a new object without mutating the input'],
    ['Optional chaining is useful for profile?.city', 'Use ?? rather than || when zero is valid'],
    'normalizeUser({id:1,name:"A",score:0}) -> { id:1, name:"A", city:"Unknown", score:0 }',
    ['Uses destructuring', 'Handles missing nested data', 'Preserves zero', 'Returns a new normalized object'],
    "function normalizeUser(user) {\n  const { id, name, score } = user;\n  return {\n    id,\n    name,\n    city: user.profile?.city ?? 'Unknown',\n    score: score ?? 0\n  };\n}",
    ['javascript', 'destructuring', 'optional-chaining'], 25
  ),
  task(
    'merge-config-safely', 'modern-javascript', 'Merge Configuration Objects Safely', 'intermediate',
    'Merge defaults with user settings while intentionally merging one nested preferences object.',
    ['spread-rest-optional'],
    ['User top-level values override defaults', 'Nested preferences must merge instead of being fully replaced', 'Preserve false and 0 values', 'Do not mutate either input object'],
    ['Object spread is shallow', 'Spread nested preferences separately'],
    'mergeConfig({timeout:3000,preferences:{theme:"light",compact:false}}, {timeout:0,preferences:{compact:true}}) preserves theme and uses timeout 0.',
    ['Top-level precedence is correct', 'Nested preferences merge correctly', 'Falsy values are preserved', 'Inputs are not mutated'],
    "function mergeConfig(defaults, user) {\n  return {\n    ...defaults,\n    ...user,\n    preferences: {\n      ...(defaults.preferences || {}),\n      ...(user.preferences || {})\n    }\n  };\n}",
    ['javascript', 'spread', 'configuration', 'immutability'], 35
  ),

  task(
    'order-summary', 'functional-javascript', 'Build an Order Summary with reduce', 'beginner',
    'Aggregate paid orders into useful summary values with array methods.',
    ['map-filter-reduce'],
    ['Ignore orders whose status is not paid', 'Return paidCount and revenue', 'Return revenueByCategory as an object', 'Handle an empty array', 'Do not mutate orders'],
    ['Filter first if it makes the reduce easier to read', 'Start reduce with an explicit object accumulator'],
    'Returns { paidCount, revenue, revenueByCategory } for the supplied orders.',
    ['Ignores unpaid orders', 'Counts paid orders', 'Sums revenue correctly', 'Groups revenue by category'],
    "function summarizeOrders(orders) {\n  return orders.filter((order) => order.status === 'paid').reduce((summary, order) => {\n    summary.paidCount += 1;\n    summary.revenue += order.total;\n    summary.revenueByCategory[order.category] = (summary.revenueByCategory[order.category] || 0) + order.total;\n    return summary;\n  }, { paidCount: 0, revenue: 0, revenueByCategory: {} });\n}",
    ['javascript', 'reduce', 'arrays', 'aggregation'], 35
  ),
  task(
    'filter-pipeline', 'functional-javascript', 'Create a Reusable Filtering Pipeline', 'intermediate',
    'Build a higher-order function that combines multiple predicate functions into one reusable filter.',
    ['callbacks-hof', 'pure-functions-immutability'],
    ['Implement combinePredicates(...predicates)', 'Return a function that accepts one value', 'The returned function passes only when every predicate passes', 'Do not mutate predicates or input values'],
    ['Array.every is a natural fit', 'The outer function should return the actual predicate'],
    'const valid = combinePredicates(isActive, hasEmail); users.filter(valid) keeps users passing both rules.',
    ['Returns a function', 'Runs every supplied predicate', 'Uses AND/every semantics', 'Remains pure for pure predicates'],
    "function combinePredicates(...predicates) {\n  return (value) => predicates.every((predicate) => predicate(value));\n}",
    ['javascript', 'higher-order-functions', 'callbacks', 'functional'], 30
  ),

  task(
    'parse-positive-number', 'errors-debugging-modules', 'Validate Input with Custom Errors', 'beginner',
    'Create a parsing function that clearly distinguishes invalid numeric input from non-positive input.',
    ['error-handling'],
    ['Convert the input with Number()', 'Throw Error("Not a number") for NaN', 'Throw Error("Must be positive") for zero or negatives', 'Return the valid number'],
    ['Number.isNaN is safer than comparing directly with NaN', 'Validate after conversion'],
    'parsePositiveNumber("12") -> 12; parsePositiveNumber("abc") throws "Not a number".',
    ['Converts valid numeric strings', 'Rejects NaN', 'Rejects zero/negative values', 'Throws Error objects with useful messages'],
    "function parsePositiveNumber(input) {\n  const value = Number(input);\n  if (Number.isNaN(value)) throw new Error('Not a number');\n  if (value <= 0) throw new Error('Must be positive');\n  return value;\n}",
    ['javascript', 'errors', 'validation'], 25
  ),
  task(
    'debug-module-workflow', 'errors-debugging-modules', 'Debug a Broken Module Workflow', 'intermediate',
    'Refactor a small module design where two files import each other only to share formatting behavior.',
    ['debugging', 'es-modules'],
    ['Remove the circular dependency', 'Move shared formatting into its own module', 'Use named exports', 'Keep each module responsibility clear', 'Explain why the original cycle was risky'],
    ['Draw the dependency direction first', 'Shared behavior can move to a third module'],
    'A dependency structure where user.js and report.js both import format.js, with no user.js <-> report.js cycle.',
    ['Circular dependency removed', 'Shared function has one clear home', 'Imports/exports are valid ES module syntax', 'Explanation identifies initialization/maintenance risk'],
    "// format.js\nexport const formatName = (user) => user.name.trim();\n\n// user.js\nimport { formatName } from './format.js';\nexport const userLabel = (user) => `User: ${formatName(user)}`;\n\n// report.js\nimport { formatName } from './format.js';\nexport const reportOwner = (user) => `Owner: ${formatName(user)}`;",
    ['javascript', 'modules', 'debugging', 'architecture'], 40
  ),

  task(
    'fetch-transform-data', 'asynchronous-javascript', 'Fetch and Transform API Data', 'beginner',
    'Write an async function that fetches users, validates the HTTP response, and returns names of active users.',
    ['promises', 'async-await-fetch'],
    ['Use async/await', 'Throw when response.ok is false', 'Parse JSON exactly once', 'Keep only active users', 'Return an array of names'],
    ['fetch does not normally reject for HTTP 404/500', 'After parsing, filter then map'],
    'loadActiveNames(url) resolves to an array such as ["Asha", "Neha"].',
    ['Uses await correctly', 'Checks HTTP status', 'Parses response JSON', 'Returns transformed active names'],
    "async function loadActiveNames(url) {\n  const response = await fetch(url);\n  if (!response.ok) throw new Error(`Request failed: ${response.status}`);\n  const users = await response.json();\n  return users.filter((user) => user.active).map((user) => user.name);\n}",
    ['javascript', 'fetch', 'async-await', 'arrays'], 35
  ),
  task(
    'multiple-async-requests', 'asynchronous-javascript', 'Handle Multiple Async Requests', 'intermediate',
    'Load a profile and notifications concurrently when both results are required.',
    ['promises', 'async-await-fetch'],
    ['Accept two functions loadProfile and loadNotifications', 'Start both operations without awaiting one before starting the other', 'Use Promise.all', 'Return { profile, notifications }', 'Let rejection propagate to the caller'],
    ['Call both functions inside the Promise.all array', 'Destructure the resulting array'],
    'loadDashboard(loadProfile, loadNotifications) resolves to { profile, notifications }.',
    ['Operations start concurrently', 'Uses Promise.all', 'Returns the expected object shape', 'Does not hide a required-operation failure'],
    "async function loadDashboard(loadProfile, loadNotifications) {\n  const [profile, notifications] = await Promise.all([\n    loadProfile(),\n    loadNotifications()\n  ]);\n  return { profile, notifications };\n}",
    ['javascript', 'promises', 'promise-all', 'concurrency'], 30
  ),

  task(
    'closure-rate-limiter', 'execution-context-closures-this', 'Build a Counter with Closure', 'intermediate',
    'Use closure to keep private state for a small fixed-attempt limiter.',
    ['closures'],
    ['Implement createLimiter(limit)', 'Expose allow(), remaining(), and reset()', 'Do not expose the internal counter directly', 'allow() returns false after the limit is used'],
    ['Store used calls in the factory scope', 'Returned methods should close over the same binding'],
    'For limit 2: allow() -> true, allow() -> true, allow() -> false; reset() restores two calls.',
    ['State is private', 'Limit is enforced', 'remaining is correct', 'reset restores state'],
    "function createLimiter(limit) {\n  let used = 0;\n  return {\n    allow() { if (used >= limit) return false; used += 1; return true; },\n    remaining() { return Math.max(0, limit - used); },\n    reset() { used = 0; }\n  };\n}",
    ['javascript', 'closures', 'private-state'], 35
  ),
  task(
    'fix-lost-this', 'execution-context-closures-this', 'Fix Lost this Context', 'intermediate',
    'Repair a detached object method used as a callback so it still reads the correct object state.',
    ['this-call-apply-bind'],
    ['Keep the greet method as a normal method', 'Create a callback that always uses the user object as this', 'Do not duplicate the greeting logic', 'Demonstrate a solution using bind'],
    ['bind returns a new function', 'A bare user.greet reference loses the receiver'],
    'Calling the callback with "Hello" returns "Hello, Asha".',
    ['Uses bind correctly', 'Preserves method implementation', 'Uses the expected receiver', 'Does not rely on a global variable'],
    "const user = {\n  name: 'Asha',\n  greet(prefix) { return `${prefix}, ${this.name}`; }\n};\nconst callback = user.greet.bind(user);",
    ['javascript', 'this', 'bind', 'callbacks'], 25
  ),

  task(
    'prototype-inheritance', 'prototypes-object-model', 'Implement Prototype-based Inheritance', 'advanced',
    'Create a constructor whose instances share methods through the prototype instead of receiving method copies.',
    ['prototype-chain'],
    ['Create User(name)', 'Add greet() on User.prototype', 'Create two instances', 'Both instances must share the exact same greet function', 'Do not define greet inside the constructor'],
    ['Compare first.greet === second.greet', 'new links each instance to User.prototype'],
    'Two users return personalized greetings and first.greet === second.greet is true.',
    ['Constructor initializes state', 'Method is stored on prototype', 'Both instances work', 'Method reference is shared'],
    "function User(name) { this.name = name; }\nUser.prototype.greet = function () { return `Hello ${this.name}`; };\nconst first = new User('Asha');\nconst second = new User('Neha');",
    ['javascript', 'prototype', 'constructors'], 35
  ),
  task(
    'composition-refactor', 'prototypes-object-model', 'Refactor Inheritance into Composition', 'advanced',
    'Replace inheritance that exists only for logging reuse with explicit dependency composition.',
    ['classes-inheritance', 'composition-object-design'],
    ['Create createOrderService({ repository, logger })', 'create(order) must log and then save', 'Do not extend a logger class', 'Return the repository result', 'Dependencies must be passed in explicitly'],
    ['The service can be a factory returning an object', 'Use the injected logger and repository directly'],
    'The service can be tested with fake logger and repository objects without subclassing anything.',
    ['Uses composition instead of inheritance', 'Dependencies are explicit', 'Logs before saving', 'Returns repository result'],
    "function createOrderService({ repository, logger }) {\n  return {\n    async create(order) {\n      logger.info('Creating order');\n      return repository.save(order);\n    }\n  };\n}",
    ['javascript', 'composition', 'object-design'], 40
  ),

  task(
    'implement-debounce', 'event-loop-performance', 'Implement debounce', 'advanced',
    'Implement a reusable debounce function suitable for a search input or resize handler.',
    ['debounce-throttle', 'closures'],
    ['Return a new function', 'Reset the previous timer on every call', 'Call fn only after the delay', 'Preserve arguments', 'Preserve the caller this value'],
    ['Keep timerId in closure', 'clearTimeout before scheduling the next timer', 'apply can preserve this and args'],
    'Repeated calls within the delay produce only one final fn call with the latest arguments.',
    ['Returns a wrapper function', 'Uses closure for timer state', 'Clears the previous timer', 'Preserves arguments', 'Preserves this'],
    "function debounce(fn, delay) {\n  let timerId;\n  return function (...args) {\n    clearTimeout(timerId);\n    timerId = setTimeout(() => fn.apply(this, args), delay);\n  };\n}",
    ['javascript', 'debounce', 'closures', 'performance'], 35
  ),
  task(
    'async-order-debugging', 'event-loop-performance', 'Predict and Fix Async Execution Ordering', 'advanced',
    'Explain the execution order of synchronous logs, Promise microtasks, and a timer, then modify the code so a final message runs after both async operations complete.',
    ['event-loop-microtasks', 'promises'],
    ['Correctly state the original output order', 'Explain why the Promise callback runs before the timer', 'Create a Promise for the timer', 'Use Promise.all to run a final log after both async operations', 'Do not use arbitrary larger delays as the fix'],
    ['Microtasks drain before the next timer task', 'Wrap setTimeout in a Promise when you need to await it'],
    'Original order is Start, End, Promise, Timer. The revised version logs Done only after Promise and Timer have both completed.',
    ['Original ordering is correct', 'Microtask explanation is correct', 'Timer is converted into awaitable work', 'Done is coordinated with Promise.all'],
    "console.log('Start');\nconst timer = new Promise((resolve) => setTimeout(() => { console.log('Timer'); resolve(); }, 0));\nconst microtask = Promise.resolve().then(() => console.log('Promise'));\nconsole.log('End');\nPromise.all([timer, microtask]).then(() => console.log('Done'));",
    ['javascript', 'event-loop', 'microtasks', 'promises'], 45
  )
];
