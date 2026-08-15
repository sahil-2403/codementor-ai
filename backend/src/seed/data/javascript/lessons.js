const lesson = (key, topicKey, title, difficulty, theory, codeExample, codeExplanation, commonMistakes, interviewDefinition, interviewQuestions, practiceTask, tags, estimatedMinutes = 40) => ({
  key, topicKey, title, difficulty, theory, codeExample, codeExplanation, commonMistakes,
  interviewDefinition, interviewQuestions, practiceTask, tags, estimatedMinutes
});

export const javascriptLessons = [
  lesson(
    'js-runtime', 'javascript-foundations', 'How JavaScript Runs', 'beginner',
    'JavaScript is executed by an engine such as V8. In browsers, the engine runs the language while browser APIs provide the DOM, timers, storage, and networking. On Node.js, the same language runs with different host APIs. Separating the language from its runtime helps explain why document exists in a browser but not in a normal Node.js script.',
    "console.log('start');\n\nconst runtime = typeof window === 'undefined' ? 'Node.js' : 'Browser';\nconsole.log(`Running in ${runtime}`);",
    'The script executes synchronously. The typeof check safely detects whether the browser global exists without throwing an error when it does not.',
    ['Treating the browser and JavaScript engine as the same thing', 'Assuming browser globals exist in Node.js', 'Using environment-specific APIs without checking the runtime'],
    'JavaScript is the language; an engine executes it and the host environment supplies APIs such as the DOM, timers, or server features.',
    [{ question: 'What is the difference between JavaScript and a browser API?', answer: 'JavaScript defines the language while browser APIs such as document, localStorage, and fetch are capabilities supplied by the browser environment.' }],
    'Run a small script in both the browser console and Node.js and list two globals that differ.',
    ['javascript', 'runtime', 'engine', 'browser', 'node'], 35
  ),
  lesson(
    'variables-constants', 'javascript-foundations', 'Variables, let, const and Assignment', 'beginner',
    'Modern JavaScript mainly uses const when a binding will not be reassigned and let when reassignment is required. var is function-scoped and has older hoisting behavior, so new application code normally prefers let and const. const protects the binding, not the contents of an object or array.',
    "const user = { name: 'Asha', score: 10 };\nuser.score += 5;\n\nlet attempts = 0;\nattempts += 1;\n\nconsole.log(user.score, attempts);",
    'The user binding still points to the same object, so changing a property is allowed. attempts uses let because the number stored in the binding is reassigned.',
    ['Using let for values that never change', 'Expecting const objects to be deeply immutable', 'Using var without understanding function scope'],
    'Use const by default for bindings that are not reassigned and let when reassignment is required; var is function-scoped legacy syntax worth understanding.',
    [{ question: 'Can a const object be modified?', answer: 'Yes. The binding cannot point to a different object, but properties of the existing object can still change.' }, { question: 'Why is let safer than var inside blocks?', answer: 'let is block-scoped and cannot be accessed before initialization, reducing accidental leakage and redeclaration.' }],
    'Create a cart total with let and a const settings object. Demonstrate one allowed mutation and one reassignment that should fail.',
    ['javascript', 'variables', 'let', 'const', 'var'], 40
  ),
  lesson(
    'primitive-types', 'javascript-foundations', 'Primitive Types and typeof', 'beginner',
    'JavaScript primitives include string, number, bigint, boolean, undefined, symbol, and null. Primitive values are immutable and copied by value. Objects, arrays, and functions are reference values. typeof identifies most values, but typeof null is object and arrays also report object, so special checks are sometimes required.',
    "const values = ['hello', 42, true, undefined, null, [1, 2]];\n\nfor (const value of values) {\n  console.log(value, typeof value, Array.isArray(value));\n}",
    'The loop exposes the typeof null historical quirk and shows why Array.isArray is the correct array check.',
    ['Using typeof value === object to detect arrays', 'Forgetting to check null explicitly', 'Treating numeric strings as numbers without conversion'],
    'Primitive values are immutable values copied by value; typeof identifies most types but null and arrays need special handling.',
    [{ question: 'What does typeof null return?', answer: 'It returns object because of a historical JavaScript quirk.' }, { question: 'How do you reliably detect an array?', answer: 'Use Array.isArray(value).' }],
    'Write describeValue(value) so it returns array, null, or the normal typeof result.',
    ['javascript', 'types', 'primitives', 'typeof'], 35
  ),

  lesson(
    'operators-coercion', 'operators-control-flow', 'Operators, Equality and Type Coercion', 'beginner',
    'JavaScript can convert values automatically during operations, which is called coercion. The + operator can perform numeric addition or string concatenation. Strict equality compares type and value without coercion, so === and !== are the safest defaults for application comparisons. Explicit Number, String, and Boolean conversions make intent easier to read.',
    "const input = '10';\nconsole.log(input + 5);\nconsole.log(Number(input) + 5);\nconsole.log(input == 10);\nconsole.log(input === 10);",
    'The first result is string concatenation. Explicit conversion produces numeric addition. Loose equality converts types, while strict equality does not.',
    ['Using == when strict equality matches the requirement', 'Relying on hidden string-to-number conversion', 'Using || for defaults when 0 or an empty string are valid values'],
    'Type coercion is JavaScript converting a value to another type; strict equality avoids coercion and should be the normal comparison choice.',
    [{ question: 'Why is === usually preferred over ==?', answer: 'It compares both type and value without hidden coercion, making the rule more predictable.' }],
    'Create normalizeAge(input) that accepts a number or numeric string and rejects invalid values.',
    ['javascript', 'operators', 'coercion', 'equality'], 40
  ),
  lesson(
    'conditions', 'operators-control-flow', 'Conditions and Decision Making', 'beginner',
    'Use if and else for flexible boolean rules, switch when one value maps cleanly to several known cases, and a ternary for small conditional expressions. Guard clauses return early for invalid or exceptional cases and can make the main path easier to follow. Remember that ?? falls back only for null or undefined while || falls back for every falsy value.',
    "function shippingCost(total, isMember) {\n  if (total < 0) return null;\n  if (isMember || total >= 1000) return 0;\n  return 80;\n}\n\nconsole.log(shippingCost(1200, false));",
    'The first guard rejects invalid input. The second condition combines the two free-shipping rules, leaving the normal cost as the simple final return.',
    ['Deeply nesting conditions instead of using guard clauses', 'Using assignment = inside a condition by mistake', 'Using || when false, 0, or empty string should be preserved'],
    'A conditional chooses a code path from a boolean-like expression; guard clauses handle exceptional cases early and reduce nesting.',
    [{ question: 'When is ?? better than || for a default?', answer: 'When false, 0, or an empty string are valid and only null or undefined should trigger the fallback.' }],
    'Write a discount function with guard clauses for invalid totals and separate rules for members and coupon codes.',
    ['javascript', 'conditions', 'if', 'switch', 'guard-clauses'], 40
  ),
  lesson(
    'loops', 'operators-control-flow', 'Loops and Iteration', 'beginner',
    'Loops repeat work. for is useful when you control an index, for...of iterates values from arrays and other iterables, and while is useful when repetition depends on a changing condition. break stops a loop and continue skips the current iteration. Prefer transformation methods later when they make intent clearer, but understand loops first.',
    "const scores = [72, 45, 91, 66];\nlet passed = 0;\n\nfor (const score of scores) {\n  if (score < 60) continue;\n  passed += 1;\n}\n\nconsole.log(`Passed: ${passed}`);",
    'for...of gives each score directly. continue ignores failing values and the counter changes only for scores that pass.',
    ['Using for...in when you need array values', 'Creating an infinite while loop by never changing its condition', 'Mutating array length unexpectedly while iterating'],
    'Iteration repeats logic over a collection or while a condition remains true; choose the loop form that makes the stopping rule obvious.',
    [{ question: 'How do for...of and for...in differ?', answer: 'for...of iterates iterable values while for...in iterates enumerable property keys.' }],
    'Count positive transaction amounts with a loop and stop immediately if an invalid non-number appears.',
    ['javascript', 'loops', 'iteration', 'for-of'], 40
  ),

  lesson(
    'function-basics', 'functions-scope', 'Function Declarations and Expressions', 'beginner',
    'Functions package reusable behavior. Function declarations are available before their source line, while function expressions follow the initialization rules of the variable holding them. Functions can receive inputs, return outputs, and be passed around as values. Keep a function focused on one clear responsibility.',
    "function calculateTax(amount, rate) {\n  return amount * rate;\n}\n\nconst formatPrice = function (amount) {\n  return `₹${amount.toFixed(2)}`;\n};\n\nconsole.log(formatPrice(calculateTax(1000, 0.18)));",
    'One function calculates a value and another formats it. Small functions can be composed without mixing unrelated concerns.',
    ['Forgetting to return a calculated value', 'Mixing several responsibilities into one large function', 'Calling a function expression before its variable is initialized'],
    'A function is a first-class JavaScript value that can accept inputs, return an output, and be stored or passed to other code.',
    [{ question: 'How does a declaration differ from a function expression during hoisting?', answer: 'A declaration is available before its source line, while an expression depends on when the variable holding it is initialized.' }],
    'Write separate functions for cart subtotal, tax, and final total, then compose them.',
    ['javascript', 'functions', 'declarations', 'expressions'], 40
  ),
  lesson(
    'parameters-arrow-functions', 'functions-scope', 'Parameters, Defaults and Arrow Functions', 'beginner',
    'Parameters describe inputs. Default parameters handle omitted values, rest parameters collect remaining arguments into an array, and destructured parameters can make object inputs self-documenting. Arrow functions are concise and capture this lexically, making them excellent callbacks but a poor choice for methods that need a dynamic receiver.',
    "const totalWithTax = (amount, rate = 0.18) => amount * (1 + rate);\n\nfunction total(...values) {\n  return values.reduce((sum, value) => sum + value, 0);\n}\n\nconsole.log(totalWithTax(500), total(10, 20, 30));",
    'The arrow uses a default value and implicit return. The regular function uses a rest parameter to collect all supplied numbers into an array.',
    ['Using arrows as methods when dynamic this is needed', 'Confusing rest parameters with spread syntax', 'Using too many positional parameters instead of an options object'],
    'Default parameters provide fallback inputs, rest collects arguments, and arrow functions provide concise lexical-this function syntax.',
    [{ question: 'Why can an arrow function be a poor object method?', answer: 'It does not create its own this; it captures this from the surrounding lexical scope.' }],
    'Create createUser(name, options) with defaults for role and active status.',
    ['javascript', 'parameters', 'arrow-functions', 'rest'], 45
  ),
  lesson(
    'lexical-scope', 'functions-scope', 'Scope, Hoisting and Lexical Lookup', 'beginner',
    'Scope determines where names can be accessed. let and const are block-scoped, function locals stay inside the function, and nested functions can read values from outer lexical scopes. let and const exist in the temporal dead zone until their declaration is initialized. Prefer declaring values close to where they are used instead of depending on hoisting tricks.',
    "const appName = 'CodeMentor';\n\nfunction buildMessage(user) {\n  const prefix = 'Welcome';\n  function format() {\n    return `${prefix}, ${user} — ${appName}`;\n  }\n  return format();\n}\n\nconsole.log(buildMessage('Sahil'));",
    'The nested function finds prefix and user in its containing function and appName in the outer scope. Code outside buildMessage cannot access prefix.',
    ['Expecting block-scoped values outside their block', 'Accessing let or const before initialization', 'Creating accidental globals through undeclared assignments'],
    'Lexical scope means variable lookup is determined by where functions and blocks are written, not by where a function is called.',
    [{ question: 'What is the temporal dead zone?', answer: 'The period before a let or const declaration is initialized during which accessing that binding throws a ReferenceError.' }],
    'Predict values visible at three nested scopes, then rewrite the inner function so it no longer depends on a global variable.',
    ['javascript', 'scope', 'hoisting', 'tdz'], 45
  ),

  lesson(
    'arrays', 'arrays-objects', 'Working with Arrays', 'beginner',
    'Arrays store ordered collections. Some methods mutate the original array, such as push, splice, and sort, while methods such as slice, map, and filter return new arrays. Be intentional about mutation because shared arrays are common in application state and accidental changes can be difficult to trace.',
    "const prices = [120, 80, 250];\nconst withTax = prices.map((price) => Math.round(price * 1.18));\nconst expensive = withTax.filter((price) => price >= 150);\n\nconsole.log(prices);\nconsole.log(expensive);",
    'map produces one transformed value for each price and filter keeps matching values. The original prices array remains unchanged.',
    ['Using map only for side effects', 'Forgetting that sort mutates the source array', 'Reading indexes without checking whether an item exists'],
    'An array is an ordered zero-indexed collection with both mutating methods and methods that create transformed copies.',
    [{ question: 'How do slice and splice differ?', answer: 'slice returns a copied portion without changing the source, while splice removes or inserts items and mutates the source.' }],
    'Return a new array containing only passing scores, converted to rounded percentages.',
    ['javascript', 'arrays', 'map', 'filter'], 45
  ),
  lesson(
    'objects-references', 'arrays-objects', 'Objects, References and Copying', 'beginner',
    'Objects group related values under keys. Assigning one object variable to another copies the reference, not the object. Object spread creates a shallow copy: top-level values are copied, but nested objects remain shared references. When nested state changes, copy every level that should be independent.',
    "const original = { name: 'Riya', settings: { theme: 'dark' } };\nconst copy = { ...original };\ncopy.name = 'Aman';\ncopy.settings.theme = 'light';\n\nconsole.log(original.name);\nconsole.log(original.settings.theme);",
    'Changing the copied name does not affect original, but settings is still the same nested object, so its theme changes in both structures.',
    ['Assuming assignment creates an object copy', 'Assuming spread performs a deep clone', 'Mutating shared nested objects without noticing the shared reference'],
    'Objects are reference values; spread and Object.assign create shallow copies, so nested reference values remain shared unless copied separately.',
    [{ question: 'What is a shallow copy?', answer: 'A new outer object whose nested object references may still point to the same underlying values.' }],
    'Update user.settings.theme without mutating either the original user object or its settings object.',
    ['javascript', 'objects', 'references', 'shallow-copy'], 45
  ),
  lesson(
    'array-object-iteration', 'arrays-objects', 'Iterating and Transforming Structured Data', 'beginner',
    'Real applications often transform arrays of objects. find returns the first match, some and every answer boolean questions, filter returns all matches, and Object.keys, Object.values, and Object.entries expose object data for iteration. Pick a method based on the result you need instead of forcing every problem into one array method.',
    "const users = [{ id: 1, name: 'Asha', active: true }, { id: 2, name: 'Vikram', active: false }];\nconst names = users.filter((user) => user.active).map((user) => user.name);\nconsole.log(names);",
    'The first step selects active users and the second transforms each selected object to a name. Each operation has a clear purpose.',
    ['Using filter(...)[0] instead of find for one item', 'Returning the wrong shape from map callbacks', 'Creating long method chains that are harder to debug than named intermediate values'],
    'Collection methods express common search, selection, transformation, and aggregation operations over arrays and objects.',
    [{ question: 'When should find be used instead of filter?', answer: 'Use find when you need the first matching item; filter always returns an array of all matches.' }],
    'Transform products into an object keyed by id while keeping only in-stock products.',
    ['javascript', 'arrays', 'objects', 'iteration'], 45
  ),

  lesson(
    'dom-manipulation', 'dom-browser-events', 'Selecting and Updating the DOM', 'beginner',
    'The DOM is the browser object representation of an HTML document. querySelector and querySelectorAll locate elements, while textContent, attributes, classList, and other properties update them. Prefer textContent for plain text and avoid inserting untrusted input through innerHTML.',
    "const countElement = document.querySelector('[data-count]');\nlet count = 0;\n\nfunction render() {\n  countElement.textContent = String(count);\n}\n\ncount += 1;\nrender();",
    'State is kept in count while render is responsible only for reflecting that state in the selected DOM element.',
    ['Repeatedly querying the same element unnecessarily', 'Using innerHTML with user-controlled content', 'Accessing DOM elements before the markup exists'],
    'The DOM represents HTML as objects that browser JavaScript can query and update to change the rendered interface.',
    [{ question: 'Why is textContent safer than innerHTML for plain user text?', answer: 'textContent treats the value as text instead of parsing it as HTML.' }],
    'Render a user name and online/offline status into two existing elements.',
    ['javascript', 'dom', 'browser', 'queryselector'], 45
  ),
  lesson(
    'browser-events', 'dom-browser-events', 'Browser Events and Event Delegation', 'beginner',
    'Events let JavaScript respond to clicks, input, keyboard actions, form submissions, and browser activity. Events often bubble from the target toward ancestors. Event delegation uses one listener on a shared parent to manage many child controls, including controls added later.',
    "const list = document.querySelector('#todo-list');\n\nlist.addEventListener('click', (event) => {\n  const button = event.target.closest('[data-remove]');\n  if (!button) return;\n  button.closest('li')?.remove();\n});",
    'One parent listener handles every matching remove button. closest safely finds the intended control even when the exact click target is a nested icon or span.',
    ['Adding a separate listener to every dynamic list item', 'Confusing event.target with event.currentTarget', 'Calling preventDefault without understanding the default behavior'],
    'Event delegation handles bubbling events on an ancestor so many present or future child elements can share one listener.',
    [{ question: 'How do event.target and event.currentTarget differ?', answer: 'target is where the event originated; currentTarget is the element whose listener is currently running.' }],
    'Use event delegation to support complete and remove buttons inside a dynamic task list.',
    ['javascript', 'events', 'event-delegation', 'browser'], 45
  ),
  lesson(
    'forms-validation', 'dom-browser-events', 'Forms and Client-side Validation', 'beginner',
    'Handle form submission on the form element, prevent the browser default when JavaScript owns submission, and read values through elements or FormData. Normalize values before checking them and return clear field-specific errors. Browser validation improves UX but never replaces authoritative server validation.',
    "function validateEmail(value) {\n  const email = value.trim().toLowerCase();\n  if (!email.includes('@')) return { valid: false, message: 'Email is invalid' };\n  return { valid: true, value: email };\n}\n\nconsole.log(validateEmail(' USER@example.com '));",
    'Validation is written as plain JavaScript independent of the DOM, which makes the rule reusable and easy to test.',
    ['Treating client validation as a security boundary', 'Mixing validation rules directly into DOM rendering code', 'Forgetting to normalize whitespace before required checks'],
    'Client-side validation improves feedback before submission, but the server must still validate all untrusted input.',
    [{ question: 'Why is client-side validation insufficient for security?', answer: 'A user can bypass browser code and call the server directly, so the server must validate the request independently.' }],
    'Write reusable required-name, email, and password-length validators that return structured results.',
    ['javascript', 'forms', 'validation', 'dom'], 45
  ),

  lesson(
    'destructuring', 'modern-javascript', 'Destructuring Arrays and Objects', 'intermediate',
    'Destructuring extracts object properties or array positions into variables. Object destructuring can rename values and provide defaults, while array destructuring works by position. Use it when it clarifies the data a function needs, but avoid deeply nested patterns that are harder to read than direct access.',
    "const response = { user: { id: 7, profile: { name: 'Meera' } }, status: 'ok' };\nconst { user: { id, profile: { name } }, status = 'unknown' } = response;\nconsole.log(id, name, status);",
    'The pattern reads nested values and uses a default only if status is undefined. It does not clone the source object.',
    ['Assuming destructuring creates a deep copy', 'Using unreadably deep destructuring patterns', 'Expecting defaults to replace null values'],
    'Destructuring extracts array positions or object properties into bindings with optional renaming and defaults.',
    [{ question: 'When does a destructuring default apply?', answer: 'When the matched value is undefined; null does not trigger the default.' }],
    'Extract id, name, city, and the first role from a nested user payload with readable defaults.',
    ['javascript', 'destructuring', 'modern-js'], 40
  ),
  lesson(
    'spread-rest-optional', 'modern-javascript', 'Spread, Rest, Optional Chaining and Nullish Coalescing', 'intermediate',
    'Spread expands array items or object properties, while rest collects remaining values. Optional chaining stops access when the left side is null or undefined, and ?? supplies a fallback only for nullish values. These features reduce defensive boilerplate but should not replace validation for required domain data.',
    "const defaults = { retries: 2, timeout: 3000 };\nconst userConfig = { timeout: 0 };\nconst config = { ...defaults, ...userConfig };\nconst label = config.metadata?.label ?? 'Default job';\nconsole.log(config, label);",
    'Later spread values override earlier ones. timeout remains 0 because ?? treats it as valid, while missing metadata safely falls back to the label.',
    ['Confusing rest and spread because both use ...', 'Using || when 0 or false are valid', 'Believing object spread deeply merges nested configuration'],
    'Spread expands values, rest collects values, optional chaining safely reads nullish paths, and ?? defaults only null or undefined.',
    [{ question: 'How does ?? differ from ||?', answer: '?? falls back only for null or undefined, while || falls back for every falsy value.' }],
    'Merge default and user configuration while preserving valid 0 values and safely reading an optional nested label.',
    ['javascript', 'spread', 'rest', 'optional-chaining', 'nullish'], 45
  ),
  lesson(
    'map-set-modern-syntax', 'modern-javascript', 'Map, Set and Useful Modern Syntax', 'intermediate',
    'Set stores unique values and is useful for membership checks or deduplication. Map stores key-value pairs where keys can be any value and preserves insertion order. Plain objects remain a good choice for record-like data with known string keys; use Map and Set when their collection semantics make the intent clearer.',
    "const tags = ['js', 'web', 'js', 'async'];\nconst uniqueTags = [...new Set(tags)];\nconst visits = new Map([['home', 3], ['mentor', 5]]);\nconsole.log(uniqueTags, visits.get('mentor'));",
    'Set removes duplicate primitive values. Map explicitly represents a dynamic lookup table with a dedicated API.',
    ['Using Map when a simple domain object is clearer', 'Forgetting object keys are string/symbol while Map keys can be any type', 'Expecting Set to deep-compare separate object instances'],
    'Set represents unique values and Map represents explicit key-value collections with keys of any type.',
    [{ question: 'When is Map preferable to a plain object?', answer: 'When keys are dynamic or non-string values, or when the data is truly a map and Map collection APIs improve clarity.' }],
    'Deduplicate visitor ids with Set and build a Map of visit counts by page.',
    ['javascript', 'map', 'set', 'modern-js'], 40
  ),

  lesson(
    'callbacks-hof', 'functional-javascript', 'Callbacks and Higher-order Functions', 'intermediate',
    'A callback is a function supplied to other code. A higher-order function accepts a function, returns a function, or both. This lets control flow stay reusable while behavior changes through parameters. Keep callback contracts clear: know the arguments, expected return value, and whether invocation is synchronous or asynchronous.',
    "function createValidator(rule, message) {\n  return (value) => ({ valid: rule(value), message });\n}\n\nconst isPositive = createValidator((value) => value > 0, 'Must be positive');\nconsole.log(isPositive(5));",
    'createValidator receives behavior and returns a configured function. The returned function also closes over the supplied rule and message.',
    ['Invoking a callback immediately instead of passing the function', 'Ignoring the return value an array callback requires', 'Nesting anonymous callbacks until debugging becomes difficult'],
    'A higher-order function accepts functions, returns functions, or both, allowing behavior to be configured without duplicating control flow.',
    [{ question: 'What makes a function higher-order?', answer: 'It accepts a function as an argument, returns a function, or both.' }],
    'Create withLogging(fn) that logs arguments and the returned value without modifying fn.',
    ['javascript', 'callbacks', 'higher-order-functions', 'functional'], 45
  ),
  lesson(
    'map-filter-reduce', 'functional-javascript', 'map, filter and reduce', 'intermediate',
    'map creates one transformed output per input, filter keeps matching inputs, and reduce accumulates a collection into another value. Use the method that matches the desired result. reduce is powerful for totals, grouping, and indexes, but it should not replace a simpler map or filter operation just to look advanced.',
    "const orders = [{ status: 'paid', total: 400 }, { status: 'cancelled', total: 300 }, { status: 'paid', total: 250 }];\nconst revenue = orders.filter((order) => order.status === 'paid').reduce((sum, order) => sum + order.total, 0);\nconsole.log(revenue);",
    'filter states which orders count and reduce combines their totals. The explicit 0 defines a safe numeric accumulator even for an empty array.',
    ['Forgetting an initial reduce accumulator', 'Using reduce for simple mapping', 'Mutating source objects inside transformation callbacks'],
    'map transforms items, filter selects items, and reduce combines a collection into an accumulated result.',
    [{ question: 'Why provide an explicit initial value to reduce?', answer: 'It defines the accumulator type, handles empty arrays safely, and makes the intended result clear.' }],
    'Build an order summary containing paid count, revenue, and totals grouped by category.',
    ['javascript', 'map', 'filter', 'reduce'], 50
  ),
  lesson(
    'pure-functions-immutability', 'functional-javascript', 'Pure Functions and Immutability', 'intermediate',
    'A pure function returns the same result for the same inputs and does not mutate external state. Pure logic is easy to test and compose. Immutability means creating new values rather than unexpectedly changing shared inputs; unavoidable effects such as network requests, storage, and DOM updates should live at clear boundaries.',
    "function addItem(cart, item) {\n  return { ...cart, items: [...cart.items, item] };\n}\n\nconst cart = { items: ['book'] };\nconst nextCart = addItem(cart, 'pen');\nconsole.log(cart.items, nextCart.items);",
    'A new cart and a new nested items array are created, so callers can compare the old and new states without hidden mutation.',
    ['Calling a function pure while it mutates an argument', 'Copying only the outer object when nested data changes', 'Treating every side effect as bad instead of isolating necessary effects'],
    'A pure function has deterministic output for explicit inputs and produces no observable side effects such as mutating arguments or external state.',
    [{ question: 'Why are pure functions easy to test?', answer: 'Their output depends only on explicit inputs, so tests do not need hidden external state.' }],
    'Refactor a mutating user-preferences update so it returns new outer and nested objects.',
    ['javascript', 'pure-functions', 'immutability', 'functional'], 45
  ),

  lesson(
    'error-handling', 'errors-debugging-modules', 'Error Handling with try/catch', 'intermediate',
    'Throw Error objects when a failure cannot be represented safely as normal data. Catch errors where you can recover, translate them into a meaningful result, add context, or log them. finally is useful for cleanup that must run after success or failure. Avoid empty catch blocks because they hide the real problem.',
    "function parseSettings(json) {\n  try {\n    return { ok: true, value: JSON.parse(json) };\n  } catch (error) {\n    return { ok: false, error: `Invalid settings: ${error.message}` };\n  }\n}\n\nconsole.log(parseSettings('{bad json}'));",
    'JSON.parse can throw. This layer knows how to convert that expected parsing failure into a structured result for its caller.',
    ['Using empty catch blocks', 'Throwing plain strings instead of Error objects', 'Catching errors at a layer that cannot recover or add context'],
    'try/catch handles thrown exceptions; a catch block should recover, translate, add context, or rethrow rather than silently swallowing the failure.',
    [{ question: 'When should an error be rethrown?', answer: 'When the current layer cannot recover or when it adds context but a higher layer must still decide what to do.' }],
    'Write parsePositiveNumber(input) that throws clear errors and handle those errors at the caller.',
    ['javascript', 'errors', 'try-catch'], 45
  ),
  lesson(
    'debugging', 'errors-debugging-modules', 'Debugging JavaScript Systematically', 'intermediate',
    'Debugging works best as a repeatable process: reproduce the issue, inspect actual runtime values, isolate the failing case, form a hypothesis, make the smallest change, and retest. Browser DevTools breakpoints, call stacks, watches, network inspection, and console output provide evidence that is more reliable than rereading code and guessing.',
    "function average(values) {\n  let total = 0;\n  for (const value of values) total += Number(value);\n  return values.length ? total / values.length : 0;\n}\n\nconsole.log(average(['10', '20', '30']));",
    'Inspecting typeof value reveals why adding numeric strings without conversion can concatenate. Explicit conversion fixes the data boundary and the empty-array guard avoids NaN.',
    ['Changing several things at once', 'Reading code repeatedly without inspecting runtime values', 'Fixing a symptom without identifying the invalid state or input'],
    'Systematic debugging reproduces a problem, gathers runtime evidence, isolates the cause, applies the smallest correction, and verifies the original scenario.',
    [{ question: 'What extra information can a breakpoint provide over a console log?', answer: 'It pauses execution so you can inspect local scope, call stack, expressions, and state changes step by step.' }],
    'Debug a function that returns NaN for one input and document reproduction, root cause, and smallest fix.',
    ['javascript', 'debugging', 'devtools'], 40
  ),
  lesson(
    'es-modules', 'errors-debugging-modules', 'ES Modules and Code Organization', 'intermediate',
    'ES modules split behavior across files with explicit imports and exports. Named exports work well when a module exposes several related values. Modules have their own scope, making dependencies visible and reducing accidental globals. Organize modules around responsibilities and avoid circular imports between files.',
    "// math.js\nexport function add(a, b) { return a + b; }\nexport const TAX_RATE = 0.18;\n\n// app.js\nimport { add, TAX_RATE } from './math.js';\nconsole.log(add(10, 5) * (1 + TAX_RATE));",
    'The importing module names its dependencies explicitly. Named exports keep the exported and imported API names consistent.',
    ['Mixing CommonJS and ES modules without understanding the runtime configuration', 'Creating circular module dependencies', 'Exporting mutable global state that many modules modify'],
    'ES modules provide file-level scope with explicit import and export syntax so dependencies and public APIs remain visible.',
    [{ question: 'What is one benefit of named exports?', answer: 'They make available APIs explicit and keep consistent names across imports when a module exposes several related values.' }],
    'Split validation helpers into a module and import only the validators needed by an app file.',
    ['javascript', 'modules', 'import', 'export'], 40
  ),

  lesson(
    'async-callbacks', 'asynchronous-javascript', 'Asynchronous Work and Callbacks', 'intermediate',
    'Asynchronous operations begin now and finish later without blocking the current call stack. Timers, events, and network requests are common examples. Callback APIs describe what should happen on completion, but nested callback flows become difficult to compose and handle consistently. Understanding callbacks makes Promises and async/await easier to reason about.',
    "console.log('start');\nsetTimeout(() => console.log('timer finished'), 0);\nconsole.log('end');",
    'The timer callback is scheduled for later. The current synchronous script prints start and end before the callback can run.',
    ['Expecting a zero-delay timer to execute immediately', 'Returning inside an async callback and expecting the outer function to receive the value', 'Nesting callbacks without a consistent error path'],
    'Asynchronous JavaScript starts work now and handles completion later; callbacks are functions invoked after a result or event becomes available.',
    [{ question: 'Why does setTimeout(fn, 0) run after synchronous code?', answer: 'The callback is queued and can run only after the current call stack is empty.' }],
    'Simulate loading user data with a timer and call either a success or error callback.',
    ['javascript', 'async', 'callbacks', 'timers'], 45
  ),
  lesson(
    'promises', 'asynchronous-javascript', 'Promises and Promise Composition', 'intermediate',
    'A Promise represents one future result that can be pending, fulfilled, or rejected. then transforms successful values, catch handles rejection, and finally performs cleanup. Returning another Promise from then makes the chain wait for it. Promise.all, allSettled, race, and any coordinate multiple asynchronous operations with different failure rules.',
    "const loadUser = () => Promise.resolve({ id: 7, name: 'Asha' });\n\nloadUser()\n  .then((user) => ({ ...user, label: user.name.toUpperCase() }))\n  .then(console.log)\n  .catch(console.error);",
    'Each then passes its returned value to the next stage. A thrown error or rejected Promise propagates to the catch handler.',
    ['Forgetting to return a Promise from a then callback', 'Catching too early and accidentally hiding a failure', 'Using Promise.all when partial success is acceptable'],
    'A Promise models one eventual result and provides composition rules for asynchronous success, failure, and coordination.',
    [{ question: 'How do Promise.all and Promise.allSettled differ?', answer: 'Promise.all rejects when any input rejects, while allSettled waits for every input and reports every outcome.' }],
    'Load three independent resources in parallel and return all values or one useful failure.',
    ['javascript', 'promises', 'promise-all'], 50
  ),
  lesson(
    'async-await-fetch', 'asynchronous-javascript', 'async/await and Fetch', 'intermediate',
    'async functions always return Promises. await pauses only the current async function until a Promise settles, making Promise-based workflows easier to read. fetch normally resolves even for HTTP 404 or 500 responses, so check response.ok or status before treating the response as success.',
    "async function loadUser(id) {\n  const response = await fetch(`/api/users/${id}`);\n  if (!response.ok) throw new Error(`Request failed with ${response.status}`);\n  return response.json();\n}",
    'The response is awaited, HTTP status is validated explicitly, and JSON parsing becomes the final async result returned to the caller.',
    ['Assuming fetch rejects automatically for HTTP error statuses', 'Awaiting independent requests one-by-one instead of running them in parallel', 'Catching errors and returning undefined without communicating failure'],
    'async/await is Promise syntax that makes asynchronous control flow sequential to read; fetch still requires explicit HTTP status handling.',
    [{ question: 'Does fetch normally reject for a 404 response?', answer: 'No. It resolves with a Response and application code must inspect response.ok or status.' }],
    'Write loadDashboard() that fetches user and notifications in parallel and validates both responses.',
    ['javascript', 'async-await', 'fetch', 'promises'], 50
  ),

  lesson(
    'execution-context-call-stack', 'execution-context-closures-this', 'Execution Context and the Call Stack', 'intermediate',
    'Each function call creates an execution context for its local bindings and execution state. The call stack tracks active contexts in last-in, first-out order. Synchronous calls must complete and leave the stack before earlier callers continue. Recursive functions keep adding frames until a base case stops recursion.',
    "function first() {\n  second();\n  console.log('first done');\n}\nfunction second() {\n  console.log('second');\n}\nfirst();",
    'first is pushed, then second is pushed above it. second completes and is removed before first continues and finally leaves the stack.',
    ['Thinking an async callback stays on the stack while waiting', 'Writing recursion without a reachable base case', 'Confusing lexical-scope lookup with stack order'],
    'An execution context stores state for running code and the call stack manages active function contexts in last-in, first-out order.',
    [{ question: 'What commonly causes a maximum call stack error?', answer: 'Too many nested synchronous calls, often recursion that does not reach a base case.' }],
    'Trace three nested calls on paper and then fix a recursive function with a missing base case.',
    ['javascript', 'execution-context', 'call-stack'], 45
  ),
  lesson(
    'closures', 'execution-context-closures-this', 'Closures and Private State', 'intermediate',
    'A closure exists when a function retains access to bindings from the lexical environment where it was created, even after the outer function has returned. Closures power factories, callbacks, memoization, and private state. Every factory call can create an independent environment with its own values.',
    "function createCounter(start = 0) {\n  let count = start;\n  return {\n    increment() { count += 1; return count; },\n    current() { return count; }\n  };\n}\n\nconst counter = createCounter(5);\nconsole.log(counter.increment());",
    'The returned methods retain access to count, while external code has no direct binding to change it.',
    ['Thinking closures copy a value instead of retaining access to a binding', 'Accidentally sharing one mutable closure across unrelated consumers', 'Retaining large unnecessary data in a long-lived closure'],
    'A closure is a function together with continued access to its defining lexical environment after the outer call has completed.',
    [{ question: 'Why can two counters from the same factory hold different values?', answer: 'Each factory call creates a separate lexical environment and each returned closure captures its own count binding.' }],
    'Build a closure-based rate limiter with allow(), remaining(), and reset() methods.',
    ['javascript', 'closures', 'scope', 'private-state'], 50
  ),
  lesson(
    'this-call-apply-bind', 'execution-context-closures-this', 'this, call, apply and bind', 'intermediate',
    'For normal functions, this is primarily determined by how the function is called. A detached method loses its original receiver. Arrow functions instead capture this from the surrounding lexical scope. call invokes a function with an explicit receiver, apply does the same with an argument array, and bind returns a new function with a fixed receiver.',
    "const user = {\n  name: 'Neha',\n  greet(prefix) { return `${prefix}, ${this.name}`; }\n};\n\nconst detached = user.greet;\nconst safeGreet = detached.bind(user);\nconsole.log(safeGreet('Hello'));",
    'Detaching greet removes the object call site. bind creates a new function whose this remains the user object when called later.',
    ['Assuming this is based on where a normal function is defined', 'Using an arrow method when a dynamic receiver is required', 'Calling bind but ignoring the new function it returns'],
    'For normal functions this is determined by the call site; call and apply invoke with a chosen receiver while bind returns a new bound function.',
    [{ question: 'How do call and bind differ?', answer: 'call invokes immediately with a chosen this value; bind returns a new function for later use.' }],
    'Fix a callback that loses its object context using bind and then using an arrow wrapper.',
    ['javascript', 'this', 'bind', 'call', 'apply'], 50
  ),

  lesson(
    'prototype-chain', 'prototypes-object-model', 'Prototype Chain and Property Lookup', 'advanced',
    'JavaScript objects can delegate missing property lookup to another object through the prototype chain. Constructor functions and classes place shared instance methods on prototypes so many objects can reuse the same function instead of owning copies. Lookup continues until a matching property is found or the chain reaches null.',
    "function User(name) { this.name = name; }\nUser.prototype.greet = function () { return `Hello ${this.name}`; };\n\nconst user = new User('Arjun');\nconsole.log(user.greet());\nconsole.log(Object.getPrototypeOf(user) === User.prototype);",
    'The new object is linked to User.prototype. greet is not an own property of the instance; it is found by prototype delegation.',
    ['Saying methods are copied from a prototype into each instance', 'Modifying built-in prototypes in application code', 'Confusing a constructor function with its prototype object'],
    'The prototype chain is JavaScript property delegation: missing properties are searched on linked prototype objects until found or null is reached.',
    [{ question: 'Where is a normal class instance method stored?', answer: 'On the constructor prototype, so instances delegate method lookup to it.' }],
    'Create two instances that share two prototype methods and prove the method function reference is the same.',
    ['javascript', 'prototype', 'prototype-chain'], 50
  ),
  lesson(
    'classes-inheritance', 'prototypes-object-model', 'Classes and Inheritance', 'advanced',
    'JavaScript class syntax provides a clearer interface over prototype-based behavior. constructors initialize instance state, methods live on prototypes, and extends links the prototype chains of related classes. Inheritance is useful for stable is-a relationships, but deep hierarchies become rigid and difficult to change.',
    "class Account {\n  constructor(owner) { this.owner = owner; }\n  describe() { return `Account: ${this.owner}`; }\n}\n\nclass PremiumAccount extends Account {\n  describe() { return `${super.describe()} (premium)`; }\n}",
    'The subclass reuses base behavior through super while still using the same prototype mechanism underneath class syntax.',
    ['Creating deep inheritance trees for unrelated behavior reuse', 'Using this before super in a derived constructor', 'Overriding base methods with incompatible behavior'],
    'JavaScript classes are syntax over the prototype system; extends establishes prototype delegation between related constructors.',
    [{ question: 'Are JavaScript classes separate from prototypes?', answer: 'No. Class syntax is built on JavaScript prototype-based behavior.' }],
    'Implement one useful subclass and identify one behavior that should be injected instead of inherited.',
    ['javascript', 'classes', 'inheritance', 'super'], 50
  ),
  lesson(
    'composition-object-design', 'prototypes-object-model', 'Composition and Object Design', 'advanced',
    'Composition builds an object by collaborating with focused capabilities rather than inheriting every behavior from a base class. It works well for logging, persistence, formatting, caching, and other behaviors that vary independently. Pass dependencies explicitly and keep each object public API small.',
    "function createOrderService({ repository, logger }) {\n  return {\n    async create(order) {\n      logger.info('Creating order');\n      return repository.save(order);\n    }\n  };\n}",
    'The order service uses repository and logger capabilities without inheriting from either one. Tests can provide simple fake dependencies.',
    ['Using inheritance only to reuse helper methods', 'Hiding many dependencies in globals inside a factory', 'Composing so many responsibilities that the object becomes a monolith'],
    'Composition assembles behavior from smaller collaborators and is often more flexible than inheritance when capabilities vary independently.',
    [{ question: 'What does favor composition over inheritance mean?', answer: 'Prefer assembling focused capabilities when behavior varies independently instead of forcing reuse through rigid parent-child hierarchies.' }],
    'Refactor a class that inherits only to reuse logging into a factory that receives a logger.',
    ['javascript', 'composition', 'object-design', 'factories'], 50
  ),

  lesson(
    'event-loop-microtasks', 'event-loop-performance', 'Event Loop, Tasks and Microtasks', 'advanced',
    'The event loop coordinates the call stack with queued work. After synchronous code finishes, the runtime drains microtasks such as Promise reactions before moving to the next task such as a timer callback. This is why an already-resolved Promise then callback normally runs before setTimeout with a zero delay.',
    "console.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => console.log('C')).then(() => console.log('D'));\nconsole.log('E');",
    'Synchronous output is A then E. Promise handlers C and D are microtasks and run before the timer task B, producing A, E, C, D, B.',
    ['Saying Promise callbacks run synchronously', 'Treating microtasks and tasks as one queue', 'Assuming a timer delay guarantees an exact execution time'],
    'The event loop runs synchronous stack work, drains queued microtasks, and then processes later tasks such as timers and events.',
    [{ question: 'Why does Promise.then usually run before setTimeout(..., 0)?', answer: 'Promise reactions are microtasks and the runtime drains microtasks before processing the next task.' }],
    'Predict a mixed synchronous, Promise, and timer snippet, then add one nested Promise and explain the changed order.',
    ['javascript', 'event-loop', 'microtasks', 'tasks'], 55
  ),
  lesson(
    'memory-performance', 'event-loop-performance', 'Memory, Leaks and Performance Basics', 'advanced',
    'Garbage collection reclaims values that are no longer reachable. A JavaScript memory leak happens when code accidentally retains references to data it no longer needs, such as forgotten event listeners, timers, global collections, or unbounded caches. Performance work should begin with measurement rather than speculative optimization.',
    "function createCache(maxSize = 100) {\n  const cache = new Map();\n  return {\n    set(key, value) {\n      if (cache.size >= maxSize) cache.delete(cache.keys().next().value);\n      cache.set(key, value);\n    },\n    get(key) { return cache.get(key); }\n  };\n}",
    'The cache has an explicit size bound, preventing a long-running process from retaining every value it has ever seen.',
    ['Optimizing without measuring the slow path', 'Keeping unbounded arrays or maps as caches', 'Forgetting to remove listeners or intervals when no longer needed'],
    'A memory leak is reachable data the application no longer needs; performance improvements should be driven by profiling and measurement.',
    [{ question: 'Can garbage collection prevent every memory leak?', answer: 'No. If application code still holds a reachable reference, the garbage collector correctly keeps that value alive.' }],
    'Find two leaks in an event/caching example and rewrite it with cleanup and a bounded cache.',
    ['javascript', 'memory', 'performance', 'garbage-collection'], 50
  ),
  lesson(
    'debounce-throttle', 'event-loop-performance', 'Debounce, Throttle and Event Performance', 'advanced',
    'High-frequency events such as input, resize, scroll, and mouse movement can trigger expensive work many times per second. Debounce waits until activity stops for a delay, while throttle limits execution frequency during continuous activity. Both patterns use closures to retain timing state between calls.',
    "function debounce(fn, delay) {\n  let timerId;\n  return function (...args) {\n    clearTimeout(timerId);\n    timerId = setTimeout(() => fn.apply(this, args), delay);\n  };\n}",
    'Each call clears the previous timer and starts a new one. The original function runs only when calls stop long enough, while apply preserves the receiver and arguments.',
    ['Creating a new debounced wrapper on every event', 'Losing arguments or this inside the delayed call', 'Using debounce when periodic updates are required during continuous activity'],
    'Debounce delays execution until calls stop for a period, while throttle limits how frequently execution can occur during continued calls.',
    [{ question: 'When is throttle preferable to debounce?', answer: 'When the UI should keep updating during sustained activity but no more often than a controlled interval, such as scroll progress.' }],
    'Implement debounce and a simple leading-edge throttle and explain which one fits search input versus scroll progress.',
    ['javascript', 'debounce', 'throttle', 'performance'], 55
  )
];
