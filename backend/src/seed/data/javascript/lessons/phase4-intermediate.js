import { makeLesson } from './lessonFactory.js';

export const javascriptIntermediateLessons = [
  makeLesson({
    key: 'template-literals', topicKey: 'modern-javascript-syntax', title: 'Template Literals and Readable Dynamic Strings', difficulty: 'intermediate',
    theory: [
      'Template literals are strings written with backticks instead of single or double quotes. Their main benefit is interpolation: ${...} can place the result of a JavaScript expression directly inside the string. This makes dynamic messages easier to read than long chains of string concatenation.',
      'Template literals can span multiple lines without manually inserting newline escape characters. That is useful for readable text blocks and small generated fragments, although large HTML templates should still be handled carefully and untrusted values should not be inserted as raw HTML.',
      'Interpolation can contain expressions, not only variable names. You can call a small formatting function, perform arithmetic, or use a conditional expression. Keep the expression short enough that the string remains readable; complex logic belongs in a named value before the template.',
      'Template literals do not automatically sanitize content or change type-conversion rules. Values inside interpolation are converted to text for the final string. Their purpose is clearer string construction, not security or validation.'
    ],
    codeExample: `const learner = 'Asha';\nconst completed = 12;\nconst total = 20;\nconsole.log(`${learner} completed ${completed} of ${total} lessons.`);`,
    codeExplanation: 'The backtick string contains three interpolated expressions, producing one readable message without + concatenation.',
    commonMistakes: ['Using normal quotes and expecting ${value} interpolation to work.', 'Putting large calculations inside interpolation and making the message difficult to read.', 'Assuming template literals sanitize HTML or user input.'],
    interviewDefinition: 'Template literals are backtick strings that support ${expression} interpolation and multiline text.',
    interviewQuestion: 'What is the main advantage of template literals over repeated string concatenation?', interviewAnswer: 'They let dynamic values and expressions appear directly inside a readable string.',
    interviewChecklist: ['Mentions backticks', 'Explains interpolation', 'Mentions multiline or readability benefit'],
    practiceTask: 'Create a progress message using learner name, completed count, total count, and calculated percentage.',
    knowledgeCheck: { type: 'mcq', question: 'Which quotes enable ${...} interpolation?', options: ['Backticks', 'Single quotes only', 'Double quotes only'], correctAnswer: 'Backticks', explanation: 'Template literals use backticks.' },
    tags: ['javascript', 'template-literals', 'strings'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'destructuring', topicKey: 'modern-javascript-syntax', title: 'Array and Object Destructuring', difficulty: 'intermediate',
    theory: [
      'Destructuring extracts values from arrays or properties from objects into local bindings. It is useful when a function receives a structured value and only a few parts are needed. Instead of repeatedly writing user.profile.name and user.profile.role, destructuring can give those properties clear local names.',
      'Object destructuring matches property names, while array destructuring uses positions. You can rename object properties with colon syntax and provide default values for missing or undefined properties. Defaults do not replace null because null is an explicit value.',
      'Destructuring also works in function parameters, which can make expected object inputs self-documenting. However, a long destructured parameter with many nested defaults can become harder to understand than a simple parameter followed by a few local declarations.',
      'Use destructuring when it makes the data you need obvious. It does not copy nested objects deeply; if a destructured property contains an object, the new binding still refers to that same nested object.'
    ],
    codeExample: `const user = { name: 'Ravi', role: 'learner', settings: { theme: 'dark' } };\nconst { name, role, settings: { theme } } = user;\nconsole.log(name, role, theme);\n\nconst [first, second] = ['JS', 'React'];`,
    codeExplanation: 'Object destructuring extracts named properties, including one nested value. Array destructuring extracts by position.',
    commonMistakes: ['Assuming array destructuring matches by name instead of position.', 'Believing destructuring deep-clones nested objects.', 'Creating extremely nested destructuring that is harder to read than normal access.'],
    interviewDefinition: 'Destructuring extracts object properties or array positions into bindings using a concise pattern.',
    interviewQuestion: 'How does object destructuring differ from array destructuring?', interviewAnswer: 'Object destructuring matches property names, while array destructuring reads values by position.',
    interviewChecklist: ['Explains object matching', 'Explains array position', 'Mentions defaults or renaming'],
    practiceTask: 'Destructure name and email from a user object and the first two values from a technologies array.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `const { name = 'Guest' } = {};\nconsole.log(name);`, correctAnswer: 'Guest', explanation: 'The property is undefined, so the destructuring default is used.' },
    tags: ['javascript', 'destructuring', 'objects', 'arrays'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'spread-rest-modern', topicKey: 'modern-javascript-syntax', title: 'Spread, Rest and Concise Object Syntax', difficulty: 'intermediate',
    theory: [
      'The ... syntax has two related but opposite uses. Spread expands values from an iterable or properties from an object into a new expression. Rest collects remaining values into one array or remaining properties into one object. The surrounding syntax tells you which role ... is playing.',
      'Array spread can combine or shallow-copy arrays. Object spread can combine object properties and is commonly used for immutable top-level updates. When later properties use the same key, they overwrite earlier ones. Remember that object spread is shallow, so nested references remain shared.',
      'Rest parameters collect extra function arguments into an array. Rest properties in destructuring gather the properties that were not extracted individually. The rest element must appear in the final position of the pattern or parameter list.',
      'Modern object literals can use property shorthand when the local variable name and desired property name are identical, and method shorthand for functions. These features reduce noise, but the data shape should still remain explicit and understandable.'
    ],
    codeExample: `const defaults = { theme: 'light', pageSize: 10 };\nconst saved = { theme: 'dark' };\nconst settings = { ...defaults, ...saved };\n\nfunction sum(...values) {\n  return values.reduce((total, value) => total + value, 0);\n}`,
    codeExplanation: 'Object spread creates a new settings object, and saved.theme overwrites the earlier default. Rest gathers all function arguments into values.',
    commonMistakes: ['Confusing spread expansion with rest collection.', 'Forgetting that object spread is shallow.', 'Placing a rest element before another parameter or destructured element.'],
    interviewDefinition: 'Spread expands iterable values or object properties, while rest collects remaining values into one binding.',
    interviewQuestion: 'How can you tell whether ... is spread or rest?', interviewAnswer: 'Its context determines the role: spread expands into an expression, while rest appears in a binding or parameter pattern and collects values.',
    interviewChecklist: ['Explains spread', 'Explains rest', 'Mentions shallow object spread'],
    practiceTask: 'Merge default settings with user settings using spread and write a function that totals any number of numeric arguments using rest.',
    knowledgeCheck: { type: 'mcq', question: 'When later object spread contains the same property key, which value wins?', options: ['The later property value', 'The first property can never be replaced', 'Both values become an array automatically'], correctAnswer: 'The later property value', explanation: 'Later properties overwrite earlier properties with the same key.' },
    tags: ['javascript', 'spread', 'rest', 'object-shorthand'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'optional-nullish-modern', topicKey: 'modern-javascript-syntax', title: 'Optional Chaining and Nullish Coalescing', difficulty: 'intermediate',
    theory: [
      'Optional chaining, written ?., safely accesses a property or method only when the value before the operator is not null or undefined. If that value is nullish, the chain stops and produces undefined. This reduces repetitive checks for optional nested data.',
      'Nullish coalescing, written ??, provides a fallback only when the left side is null or undefined. This is different from ||, which falls back for every falsy value. The difference matters when 0, false, or an empty string is valid data that should be preserved.',
      'These operators work well together. user.profile?.displayName ?? "Guest" means “use the display name if the optional path exists; otherwise use Guest when the final result is null or undefined.” That is clearer than several nested if statements.',
      'Optional chaining should not hide a data-model bug. If a property is required by the application, silently converting every missing value to undefined can make errors harder to detect. Use optional access for genuinely optional data and explicit validation for required data.'
    ],
    codeExample: `const user = { profile: { displayName: '' } };\nconst displayName = user.profile?.displayName ?? 'Guest';\nconsole.log(displayName);`,
    codeExplanation: 'The profile path exists and displayName is an empty string. Because ?? only falls back for null or undefined, the empty string is preserved.',
    commonMistakes: ['Using || when 0, false, or empty string should remain valid.', 'Using optional chaining on required data and hiding a real missing-field bug.', 'Thinking ?. catches every possible runtime error.'],
    interviewDefinition: 'Optional chaining safely stops property access on null or undefined, while ?? supplies a fallback only for nullish values.',
    interviewQuestion: 'Why can ?? be safer than || for default values?', interviewAnswer: 'It preserves valid falsy values such as 0, false, and an empty string and only falls back for null or undefined.',
    interviewChecklist: ['Explains ?. short circuit', 'Explains ??', 'Distinguishes nullish from all falsy values'],
    practiceTask: 'Read an optional settings.theme value and use dark only when the property is null or undefined.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `console.log(false ?? true);`, correctAnswer: 'false', explanation: 'false is not null or undefined, so ?? preserves it.' },
    tags: ['javascript', 'optional-chaining', 'nullish-coalescing'], estimatedMinutes: 55
  }),

  makeLesson({
    key: 'callbacks-functions-values', topicKey: 'functional-javascript', title: 'Callbacks from First Principles', difficulty: 'intermediate',
    theory: [
      'A callback is a function passed to other code so that code can call it at the appropriate time. You have already used callbacks with array methods and event listeners. The word callback does not imply asynchronous behavior by itself; map callbacks run synchronously, while an event callback runs later when an event occurs.',
      'Because JavaScript functions are values, a caller can decide what behavior should happen without hard-coding that behavior into the receiving function. This makes APIs flexible. An array method can receive one callback for filtering active users and another callback for filtering expensive products.',
      'When passing a callback, pass the function reference unless the API explicitly expects the result of calling it. handleClick and handleClick() are very different: the first is a function value, while the second immediately executes the function and produces its return value.',
      'Callbacks are a foundation for event-driven code, array transformations, Promises, and middleware. Before adding more abstraction, make sure you can trace who receives the function and when that receiver calls it.'
    ],
    codeExample: `function runOperation(value, operation) {\n  return operation(value);\n}\n\nconst double = (number) => number * 2;\nconsole.log(runOperation(5, double));`,
    codeExplanation: 'double is passed as a function value. runOperation decides when to call it and passes value as its argument.',
    commonMistakes: ['Calling a callback while passing it instead of passing the function reference.', 'Assuming every callback is asynchronous.', 'Writing deeply nested anonymous callbacks that are difficult to name or debug.'],
    interviewDefinition: 'A callback is a function supplied to another function or API so the receiver can invoke it later or during its operation.',
    interviewQuestion: 'Are callbacks always asynchronous?', interviewAnswer: 'No. Array methods such as map call their callbacks synchronously, while events and some APIs invoke callbacks later.',
    interviewChecklist: ['Defines function passed to other code', 'Explains receiver invokes it', 'Distinguishes synchronous and asynchronous callbacks'],
    practiceTask: 'Write applyToNumber(number, callback) and pass separate double and square callbacks.',
    knowledgeCheck: { type: 'mcq', question: 'Which value should addEventListener usually receive as its handler argument?', options: ['A callback function reference', 'The immediate return value of calling the handler', 'Only a number'], correctAnswer: 'A callback function reference', explanation: 'The browser needs the function to call when the event occurs.' },
    tags: ['javascript', 'callbacks', 'functions'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'higher-order-functions', topicKey: 'functional-javascript', title: 'Higher-Order Functions and Reusable Behavior', difficulty: 'intermediate',
    theory: [
      'A higher-order function accepts at least one function as an argument, returns a function, or both. Array methods such as map, filter, and reduce are familiar higher-order functions because they receive callback behavior. Function factories that return configured functions are another common form.',
      'Higher-order functions separate a general workflow from a changing piece of behavior. A retry helper can know how many times to attempt something without knowing exactly what operation is being retried. A validator runner can apply many validation functions without containing every rule itself.',
      'This flexibility can improve reuse, but abstraction should follow a real pattern. A higher-order function that is harder to understand than two normal functions is not automatically better. Use the pattern when several operations share the same control flow and only one behavior changes.',
      'Naming becomes important. Generic names such as handler or callback are acceptable in a tiny local function, but reusable higher-order helpers should describe what role the supplied function plays, such as predicate, formatter, validator, or operation.'
    ],
    codeExample: `function withLogging(operation) {\n  return function (...args) {\n    console.log('Running operation');\n    return operation(...args);\n  };\n}\n\nconst add = (a, b) => a + b;\nconst loggedAdd = withLogging(add);\nconsole.log(loggedAdd(2, 3));`,
    codeExplanation: 'withLogging receives one function and returns a new function that adds logging before delegating to the original operation.',
    commonMistakes: ['Creating abstraction before a repeated pattern actually exists.', 'Losing the original function return value in a wrapper.', 'Using vague parameter names that hide the role of the supplied function.'],
    interviewDefinition: 'A higher-order function receives a function, returns a function, or both.',
    interviewQuestion: 'Why are map and filter higher-order functions?', interviewAnswer: 'Because they accept callback functions that define the transformation or selection behavior.',
    interviewChecklist: ['Defines higher-order function', 'Gives a valid example', 'Explains separation of workflow and behavior'],
    practiceTask: 'Write withTiming(operation) that returns a wrapper which measures and logs how long the operation takes.',
    knowledgeCheck: { type: 'short_answer', question: 'What makes a function “higher-order”?', correctAnswer: 'It accepts a function or returns a function', explanation: 'Either receiving or returning function values qualifies a function as higher-order.' },
    tags: ['javascript', 'higher-order-functions', 'callbacks'], estimatedMinutes: 60
  }),
  makeLesson({
    key: 'pure-functions-side-effects', topicKey: 'functional-javascript', title: 'Pure Functions and Side Effects', difficulty: 'intermediate',
    theory: [
      'A pure function produces the same result for the same explicit inputs and does not create observable side effects. It does not mutate arguments, change global state, write to storage, update the DOM, or perform network requests. Pure functions are easier to test because all information needed to predict the result is visible in the inputs.',
      'Real applications still need side effects. Showing UI, saving data, logging, and requesting APIs are useful operations. Functional design does not mean eliminating side effects; it means separating pure calculations from effectful boundaries so each part has a clear responsibility.',
      'For example, calculateCartTotal(cart) can be pure, while saveCart(cart) performs a storage or network effect. A submit handler can call the pure calculation, validate the result, then perform the side effect. This structure makes business logic reusable outside the browser event.',
      'Purity is a design property, not a special JavaScript keyword. A function can look simple but still be impure if it reads changing global state or mutates an object passed by reference.'
    ],
    codeExample: `function calculateTotal(items) {\n  return items.reduce((sum, item) => sum + item.price, 0);\n}\n\nconst total = calculateTotal([{ price: 100 }, { price: 50 }]);\nconsole.log(total);`,
    codeExplanation: 'The function depends only on its input and returns a value without changing the input or external state.',
    commonMistakes: ['Calling a function pure while it mutates an argument object.', 'Treating all side effects as bad instead of isolating necessary effects.', 'Reading hidden global values inside a calculation that should depend on explicit inputs.'],
    interviewDefinition: 'A pure function has deterministic output for explicit inputs and produces no observable side effects.',
    interviewQuestion: 'Why are pure functions easy to test?', interviewAnswer: 'Because their output depends only on explicit inputs and they do not require hidden external state or side effects.',
    interviewChecklist: ['Mentions same inputs produce same output', 'Mentions no side effects', 'Explains testability'],
    practiceTask: 'Refactor a function that reads a global tax rate so the rate becomes an explicit parameter.',
    knowledgeCheck: { type: 'mcq', question: 'Which action makes a function impure?', options: ['Mutating a global object', 'Returning a calculation from its parameters', 'Creating a local constant'], correctAnswer: 'Mutating a global object', explanation: 'Changing external state is an observable side effect.' },
    tags: ['javascript', 'pure-functions', 'side-effects'], estimatedMinutes: 60
  }),
  makeLesson({
    key: 'immutability-composition', topicKey: 'functional-javascript', title: 'Immutability and Composing Small Transformations', difficulty: 'intermediate',
    theory: [
      'Immutability means treating existing data as unchanged and creating new values for updates. JavaScript does not enforce this for normal objects and arrays, but spread, map, filter, and other non-mutating patterns make immutable updates practical. The benefit is predictable history: code holding the old value does not suddenly observe an unexpected mutation.',
      'Small pure transformations can be composed. One function can normalize input, another can calculate a result, and another can format it. Each step has a clear input and output. This is often easier to test than one function that performs all transformations and side effects together.',
      'Immutability has costs too. Creating new objects uses memory and can add syntax for nested updates. The goal is not to clone everything automatically; copy the parts that should represent a new state and keep stable references for unchanged parts when appropriate.',
      'Composition works best when function responsibilities and data shapes are clear. A pipeline of five mysterious one-line functions can be harder to understand than a few named intermediate variables. Optimize for readability before cleverness.'
    ],
    codeExample: `const normalizeName = (name) => name.trim();\nconst capitalizeName = (name) => name.charAt(0).toUpperCase() + name.slice(1);\n\nconst raw = '  asha';\nconst clean = capitalizeName(normalizeName(raw));\nconsole.log(clean);`,
    codeExplanation: 'Each function performs one pure transformation, and the output of the first becomes the input of the second.',
    commonMistakes: ['Mutating nested input while claiming an update is immutable.', 'Creating excessive abstraction that hides a simple data flow.', 'Deep-cloning everything when only one changed path needs new references.'],
    interviewDefinition: 'Immutability creates new values instead of changing existing shared state; composition combines small functions by feeding one result into the next.',
    interviewQuestion: 'What is one benefit of immutable updates?', interviewAnswer: 'Other code can keep using the previous value without observing unexpected changes from a shared mutation.',
    interviewChecklist: ['Defines immutability', 'Explains predictable previous values', 'Explains composition'],
    practiceTask: 'Compose normalizeTitle and addPrefix functions without mutating the original input string or object.',
    knowledgeCheck: { type: 'short_answer', question: 'Does immutability mean JavaScript objects become automatically frozen?', correctAnswer: 'no', explanation: 'Immutability is usually a coding approach unless objects are explicitly frozen or managed by a system that enforces it.' },
    tags: ['javascript', 'immutability', 'composition', 'functional'], estimatedMinutes: 60
  }),

  makeLesson({
    key: 'reading-errors', topicKey: 'errors-debugging-modules', title: 'Reading JavaScript Errors and Stack Traces', difficulty: 'intermediate',
    theory: [
      'Errors are useful signals that a program reached a state it could not handle normally. Common built-in error types include ReferenceError for missing or unavailable identifiers, TypeError for invalid operations on a value, and SyntaxError when source text cannot be parsed as valid JavaScript.',
      'A stack trace shows where the error occurred and the chain of function calls that led there. Start with the first line from your own application code rather than unrelated framework internals. Inspect the values on that line and then move outward through the call stack if the cause began earlier.',
      'The line where an error becomes visible is not always the line where invalid data was introduced. A TypeError reading user.profile.name may happen because user came from an earlier API call without the expected shape. Debugging therefore combines the stack trace with actual runtime values.',
      'Do not immediately hide errors with try/catch. First understand whether the error represents a programming bug, invalid external input, or a failure that the application can meaningfully recover from. Different categories deserve different handling.'
    ],
    codeExample: `function showName(user) {\n  return user.profile.name;\n}\n\n// showName(null); // TypeError: cannot read properties of null`,
    codeExplanation: 'The operation expects an object with profile. Passing null violates that assumption and produces a TypeError at the property access.',
    commonMistakes: ['Ignoring the error type and message.', 'Assuming the top stack line always identifies where bad data was first created.', 'Adding catch blocks before understanding whether the error should actually be recovered from.'],
    interviewDefinition: 'A JavaScript error describes a failed operation, and its stack trace shows the call path that led to the failure.',
    interviewQuestion: 'What is the first useful step when reading a stack trace?', interviewAnswer: 'Find the first relevant line in your own code and inspect the operation and runtime values there.',
    interviewChecklist: ['Mentions error type/message', 'Explains stack trace', 'Mentions inspecting runtime values'],
    practiceTask: 'Trigger one ReferenceError and one TypeError intentionally, then identify the message, file line, and cause.',
    knowledgeCheck: { type: 'mcq', question: 'Which error commonly appears when accessing a property of null?', options: ['TypeError', 'RangeError only', 'No error can occur'], correctAnswer: 'TypeError', explanation: 'Property access is not valid on null, so JavaScript throws a TypeError.' },
    tags: ['javascript', 'errors', 'stack-trace'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'try-catch-finally', topicKey: 'errors-debugging-modules', title: 'Recovering with try, catch and finally', difficulty: 'intermediate',
    theory: [
      'try/catch handles exceptions that may be thrown while running a block of code. JavaScript executes the try block normally. If an exception is thrown before it finishes, control moves to catch, where the error object can be inspected and the application can recover, translate the failure, or report it.',
      'A catch block should have a purpose. It might convert invalid JSON into a user-friendly validation result, add context before rethrowing, or choose a fallback when the operation is genuinely optional. An empty catch block hides information and can leave the program in an incorrect state without explanation.',
      'finally runs after the try/catch sequence whether the operation succeeds or throws. It is useful for cleanup that must always happen, such as resetting a loading flag or releasing a resource. finally should not become a place for unrelated business logic.',
      'Do not wrap huge sections of code in one try/catch just to prevent crashes. Catch errors at a level that knows what recovery or message is appropriate. Programming bugs that cannot be meaningfully recovered may be better allowed to surface during development.'
    ],
    codeExample: `function parseSettings(text) {\n  try {\n    return { ok: true, value: JSON.parse(text) };\n  } catch (error) {\n    return { ok: false, message: 'Settings are not valid JSON' };\n  }\n}`,
    codeExplanation: 'JSON.parse may throw. This function knows how to translate that specific parsing failure into a structured result.',
    commonMistakes: ['Using an empty catch block.', 'Catching at a layer that cannot recover or add useful context.', 'Putting unrelated normal logic inside finally.'],
    interviewDefinition: 'try/catch handles thrown exceptions, while finally runs cleanup code after success or failure.',
    interviewQuestion: 'When is it reasonable to catch an error?', interviewAnswer: 'When the current layer can recover, translate the error, add useful context, or perform required cleanup.',
    interviewChecklist: ['Explains try', 'Explains catch purpose', 'Explains finally'],
    practiceTask: 'Write parseJsonSafely(text) that returns a success object or a clear error object instead of crashing.',
    knowledgeCheck: { type: 'short_answer', question: 'Which block runs after try/catch whether an exception occurred or not?', correctAnswer: 'finally', explanation: 'finally is designed for logic that must run after either outcome.' },
    tags: ['javascript', 'try-catch', 'finally', 'errors'], estimatedMinutes: 60
  }),
  makeLesson({
    key: 'throw-custom-errors', topicKey: 'errors-debugging-modules', title: 'Throwing Errors and Creating Clear Failure Messages', difficulty: 'intermediate',
    theory: [
      'Your own functions can throw an Error when continuing would produce an invalid or misleading result. For example, a divide function may reject a zero denominator, or a configuration loader may require a missing value. throw immediately stops the current normal flow and propagates the exception until something catches it.',
      'Throw Error objects rather than plain strings because Error carries standard properties such as name, message, and stack. Clear error messages describe the violated rule, not only the symptom. “Price must be a non-negative number” is more useful than “Bad input.”',
      'You can create custom Error subclasses when the application needs to distinguish categories such as ValidationError or AuthorizationError. A junior project should only add custom types when callers genuinely handle those categories differently; otherwise a normal Error with a clear message is simpler.',
      'Errors are for exceptional failure paths, not ordinary control flow. A search function returning no match can often return null or undefined normally. Throw when the contract says the operation cannot meaningfully continue with the provided state.'
    ],
    codeExample: `function calculateAverage(values) {\n  if (!Array.isArray(values)) throw new TypeError('values must be an array');\n  if (values.length === 0) throw new Error('values must not be empty');\n  return values.reduce((sum, value) => sum + value, 0) / values.length;\n}`,
    codeExplanation: 'The function rejects inputs that violate its contract before performing the calculation.',
    commonMistakes: ['Throwing plain strings instead of Error objects.', 'Using exceptions for every expected no-result case.', 'Writing vague messages that do not explain the violated requirement.'],
    interviewDefinition: 'throw raises an exception and stops normal execution; Error objects provide standard message and stack information.',
    interviewQuestion: 'Why throw an Error object instead of a plain string?', interviewAnswer: 'Error provides standard metadata such as name, message, and stack and works consistently with normal error-handling tools.',
    interviewChecklist: ['Explains throw behavior', 'Mentions Error object', 'Distinguishes exceptional failure from normal no-result flow'],
    practiceTask: 'Write parsePositiveNumber(input) that throws clear errors for nonnumeric and non-positive values.',
    knowledgeCheck: { type: 'mcq', question: 'What happens immediately after throw executes?', options: ['Normal execution of the current path stops', 'The next statement always runs', 'The value is silently ignored'], correctAnswer: 'Normal execution of the current path stops', explanation: 'The exception propagates until it is caught or reaches the runtime boundary.' },
    tags: ['javascript', 'throw', 'error-objects'], estimatedMinutes: 60
  }),
  makeLesson({
    key: 'systematic-debugging', topicKey: 'errors-debugging-modules', title: 'Debugging Systematically with DevTools', difficulty: 'intermediate',
    theory: [
      'Debugging is a repeatable investigation process, not random code editing. Start by reproducing the problem consistently. Write down what you expected and what actually happened. Then reduce the scenario until you know the smallest input or action that still causes the failure.',
      'Collect runtime evidence. Logs can show selected values, while breakpoints pause execution so you can inspect local scope, the call stack, and expressions before changing anything. The Network panel shows request status, payloads, and timing. The Elements panel shows actual DOM state.',
      'Form one hypothesis at a time. For example: “The total becomes NaN because one item price is a string that cannot be converted.” Inspect the values that would prove or disprove that idea. Then make the smallest change that addresses the root cause and rerun the original failing case.',
      'After fixing the issue, test nearby cases so the correction does not introduce another bug. A good debugging note can state reproduction, root cause, fix, and verification. This habit is useful in professional issue trackers and technical interviews because it demonstrates reasoning rather than guessing.'
    ],
    codeExample: `function average(values) {\n  let total = 0;\n  for (const value of values) {\n    console.log('value/type:', value, typeof value);\n    total += Number(value);\n  }\n  return values.length ? total / values.length : 0;\n}`,
    codeExplanation: 'The focused log checks the runtime value and type at the boundary where unexpected strings could affect the total.',
    commonMistakes: ['Changing several lines at once without isolating the cause.', 'Rereading code repeatedly without inspecting runtime state.', 'Fixing a visible symptom while leaving the invalid input or state that caused it.'],
    interviewDefinition: 'Systematic debugging reproduces the issue, gathers evidence, tests a hypothesis, applies the smallest root-cause fix, and verifies the result.',
    interviewQuestion: 'What should you do before changing code during debugging?', interviewAnswer: 'Reproduce the issue and gather evidence about the actual runtime state so you can form a specific hypothesis.',
    interviewChecklist: ['Mentions reproduction', 'Mentions evidence', 'Mentions hypothesis and verification'],
    practiceTask: 'Debug a function that produces NaN for one input and document reproduction, root cause, smallest fix, and retest.',
    knowledgeCheck: { type: 'mcq', question: 'Which approach is strongest for debugging?', options: ['Reproduce → inspect → hypothesize → change → verify', 'Change many lines randomly', 'Ignore runtime values and guess'], correctAnswer: 'Reproduce → inspect → hypothesize → change → verify', explanation: 'A repeatable evidence-based process reduces guesswork.' },
    tags: ['javascript', 'debugging', 'devtools', 'breakpoints'], estimatedMinutes: 65
  }),

  makeLesson({
    key: 'async-sync-model', topicKey: 'asynchronous-javascript', title: 'Synchronous vs Asynchronous Work', difficulty: 'intermediate',
    theory: [
      'Synchronous JavaScript runs one current call stack of instructions in order. A normal function call starts, completes, returns, and then the caller continues. If one synchronous operation takes a long time on the browser main thread, the interface can become unresponsive because other JavaScript and many UI tasks must wait.',
      'Asynchronous APIs let an operation begin and complete later. Timers, network requests, and user events are familiar examples. JavaScript can register what should happen when the result becomes available, continue running other work, and then handle the completion through a callback or Promise.',
      'Asynchronous does not mean JavaScript suddenly executes all code at the same time on the same call stack. Host environments coordinate background capabilities and queue callbacks for JavaScript to process when the stack is available. The event loop topic later will explain that scheduling in detail.',
      'The first async skill is understanding values over time. A result from a future network request cannot be returned synchronously before the request finishes. Code must represent the future result with a callback, Promise, or async function and continue from that completion path.'
    ],
    codeExample: `console.log('A');\nsetTimeout(() => console.log('B'), 0);\nconsole.log('C');`,
    codeExplanation: 'A and C run synchronously. The timer callback is scheduled for later, so B runs only after the current synchronous work finishes.',
    commonMistakes: ['Thinking asynchronous code automatically runs on the same JavaScript stack in parallel.', 'Trying to return a future callback result from a synchronous function.', 'Assuming a zero-millisecond timer means immediate execution.'],
    interviewDefinition: 'Synchronous work completes on the current call stack before later statements continue; asynchronous APIs complete later and schedule continuation logic.',
    interviewQuestion: 'Why does setTimeout(callback, 0) not run the callback immediately?', interviewAnswer: 'The callback is scheduled and can run only after the current synchronous call stack is empty and the runtime processes the queued task.',
    interviewChecklist: ['Explains synchronous order', 'Explains later async completion', 'Mentions scheduling/queue concept'],
    practiceTask: 'Predict the output order of three scripts mixing logs and zero-delay timers before running them.',
    knowledgeCheck: { type: 'code_output', question: 'What is the output order?', codeSnippet: `console.log('1');\nsetTimeout(() => console.log('2'), 0);\nconsole.log('3');`, correctAnswer: '1, 3, 2', explanation: 'Synchronous logs finish before the queued timer callback.' },
    tags: ['javascript', 'async', 'synchronous', 'timers'], estimatedMinutes: 60
  }),
  makeLesson({
    key: 'timers-callbacks', topicKey: 'asynchronous-javascript', title: 'Timers and Completion Callbacks', difficulty: 'intermediate',
    theory: [
      'setTimeout asks the host environment to schedule a callback after at least a specified delay. The delay is not a guaranteed exact execution time. When the timer becomes eligible, the callback still waits until JavaScript can process its queued task.',
      'setInterval schedules repeated callbacks, but repeated intervals can be difficult to control when the callback work itself takes time. Recursive setTimeout can be clearer for some polling flows because the next timer is scheduled after the current work completes.',
      'Timer functions return identifiers that can be passed to clearTimeout or clearInterval. Cleanup matters in long-lived interfaces because a callback may no longer be relevant after a component, screen, or user action has changed.',
      'Timers demonstrate the callback pattern without network complexity: register a function now, the environment tracks time, and the function is invoked later. This mental model prepares you for legacy callback APIs and then Promises.'
    ],
    codeExample: `const timerId = setTimeout(() => {\n  console.log('Saved reminder');\n}, 1000);\n\n// clearTimeout(timerId); // would cancel before it runs`,
    codeExplanation: 'setTimeout returns an id. If clearTimeout runs before the callback is scheduled for execution, the timer is cancelled.',
    commonMistakes: ['Treating the delay as an exact guaranteed execution time.', 'Forgetting to clean up timers that are no longer relevant.', 'Using setInterval for work that can overlap or drift without considering the behavior.'],
    interviewDefinition: 'Timer APIs are host-provided asynchronous functions that schedule callbacks to become eligible after a delay.',
    interviewQuestion: 'Does setTimeout(fn, 1000) guarantee fn runs at exactly one second?', interviewAnswer: 'No. It becomes eligible after the delay but can run later if the JavaScript thread is busy or scheduling is delayed.',
    interviewChecklist: ['Explains minimum delay', 'Mentions queued callback', 'Mentions cancellation or cleanup'],
    practiceTask: 'Schedule a message, store the timer id, and add a second action that cancels the timer before it runs.',
    knowledgeCheck: { type: 'short_answer', question: 'Which function cancels a timeout created by setTimeout?', correctAnswer: 'clearTimeout', explanation: 'clearTimeout uses the returned timer id to cancel a pending timeout.' },
    tags: ['javascript', 'timers', 'callbacks', 'settimeout'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'callback-completion-errors', topicKey: 'asynchronous-javascript', title: 'Designing Callback-Based Completion and Error Paths', difficulty: 'intermediate',
    theory: [
      'Before Promises became common, many asynchronous APIs used callbacks for both success and failure. A simple learning design can accept onSuccess and onError callbacks, while Node.js APIs often use an error-first convention where the callback receives an error value first and result second.',
      'The important rule is that the asynchronous function cannot synchronously return a result that does not exist yet. Instead, it calls the supplied completion callback when the future operation finishes. The caller’s next dependent step therefore belongs inside or after that completion path.',
      'Error handling must be part of the callback design. If only successful results have a callback, failures can disappear or produce inconsistent state. One reason Promises became popular is that they provide a standardized way to compose success and failure through the same object.',
      'Callback APIs are still important to understand because events, many library hooks, and existing codebases use them. Learn to trace who owns the callback, who invokes it, and which data is available at that moment.'
    ],
    codeExample: `function loadUser(id, onSuccess, onError) {\n  setTimeout(() => {\n    if (!id) return onError(new Error('id is required'));\n    onSuccess({ id, name: 'Asha' });\n  }, 100);\n}`,
    codeExplanation: 'The function does not return the future user. It calls one of the supplied callbacks after the timer completes.',
    commonMistakes: ['Returning inside a callback and expecting the outer asynchronous function to synchronously return that value.', 'Designing only a success path and ignoring failures.', 'Calling both success and error callbacks for the same completion.'],
    interviewDefinition: 'Callback-based asynchronous APIs deliver future results by invoking supplied functions when success or failure occurs.',
    interviewQuestion: 'Why can’t loadUser return the user immediately if it performs asynchronous work?', interviewAnswer: 'Because the result does not exist when the outer function returns; completion must be delivered later through a callback or Promise.',
    interviewChecklist: ['Mentions future result timing', 'Explains callback invocation', 'Mentions error path'],
    practiceTask: 'Create a timer-based fake request with separate success and error callbacks and test both paths.',
    knowledgeCheck: { type: 'mcq', question: 'Where should code that depends on a callback result run?', options: ['In or after the asynchronous completion path', 'Before the async work has completed', 'Only at file parse time'], correctAnswer: 'In or after the asynchronous completion path', explanation: 'Dependent work must wait until the future result is available.' },
    tags: ['javascript', 'callbacks', 'async', 'errors'], estimatedMinutes: 60
  }),
  makeLesson({
    key: 'promise-basics', topicKey: 'asynchronous-javascript', title: 'Promises: Pending, Fulfilled and Rejected', difficulty: 'intermediate',
    theory: [
      'A Promise is an object representing one eventual asynchronous result. It begins pending and later becomes fulfilled with a value or rejected with a reason. Once settled, its state does not change again. This standard representation makes async results easier to pass around and compose than custom callback conventions.',
      'then registers logic for fulfilled values, catch registers rejection handling, and finally registers cleanup that runs after settlement. These methods return new Promises, which is what makes chains possible. The handlers do not normally execute before the current synchronous code finishes.',
      'You usually consume Promises created by APIs rather than manually constructing them. new Promise is appropriate when adapting a callback-style operation into the Promise model, but ordinary Promise-returning functions can often simply return an existing Promise.',
      'A rejected Promise should eventually be handled or deliberately propagated to a caller that will handle it. Swallowing errors in a catch and returning undefined can turn an obvious failure into a confusing later bug.'
    ],
    codeExample: `const userPromise = Promise.resolve({ id: 1, name: 'Asha' });\n\nuserPromise\n  .then((user) => user.name.toUpperCase())\n  .then(console.log)\n  .catch(console.error);`,
    codeExplanation: 'The first then receives the fulfilled object and returns a transformed value. The next then receives that returned value. catch would handle a rejection from earlier in the chain.',
    commonMistakes: ['Thinking a Promise contains the final value synchronously before it settles.', 'Constructing new Promise unnecessarily around an existing Promise.', 'Catching an error and accidentally hiding it when the caller should know the operation failed.'],
    interviewDefinition: 'A Promise represents one future result that starts pending and settles once as fulfilled or rejected.',
    interviewQuestion: 'What are the three Promise states?', interviewAnswer: 'Pending, fulfilled, and rejected.',
    interviewChecklist: ['Names three states', 'Explains settlement', 'Mentions then/catch'],
    practiceTask: 'Create one resolved and one rejected Promise and handle both with then/catch.',
    knowledgeCheck: { type: 'short_answer', question: 'Can a fulfilled Promise later become rejected?', correctAnswer: 'no', explanation: 'Once a Promise settles, its state is fixed.' },
    tags: ['javascript', 'promises', 'async'], estimatedMinutes: 65
  }),
  makeLesson({
    key: 'promise-chaining', topicKey: 'asynchronous-javascript', title: 'Promise Chaining and Returning Async Work', difficulty: 'intermediate',
    theory: [
      'Promise chains work because each then returns a new Promise. If a handler returns a normal value, the next stage receives that value. If it returns another Promise, the chain waits for that Promise to settle before continuing. This flattening behavior prevents the need for deeply nested success callbacks.',
      'A very common bug is starting asynchronous work inside then but forgetting to return it. The outer chain then continues before the inner operation is complete. Whenever the next step depends on a Promise created in the current handler, return that Promise.',
      'Thrown errors inside a then handler automatically become Promise rejections and can be handled by a later catch. That creates one consistent failure path through a chain instead of manually checking errors after every asynchronous step.',
      'Keep each chain stage focused. Parse data, validate it, transform it, and save it as separate understandable steps. If a chain becomes difficult to read, async/await can express the same Promise behavior with more sequential-looking syntax.'
    ],
    codeExample: `loadUser()\n  .then((user) => loadOrders(user.id))\n  .then((orders) => orders.filter((order) => order.status === 'paid'))\n  .then(console.log)\n  .catch(console.error);`,
    codeExplanation: 'The first handler returns loadOrders, so the next then waits for that Promise and receives its orders result.',
    commonMistakes: ['Forgetting to return a Promise from a then handler.', 'Nesting then calls instead of returning and continuing the chain.', 'Adding catch too early and converting failures into undefined without intention.'],
    interviewDefinition: 'Promise chaining passes returned values or awaited Promise results from one then stage to the next and propagates thrown errors as rejections.',
    interviewQuestion: 'Why should a Promise created inside then usually be returned?', interviewAnswer: 'So the outer chain waits for that asynchronous work and the next stage receives its result.',
    interviewChecklist: ['Explains new Promise per then', 'Mentions returning inner Promise', 'Mentions rejection propagation'],
    practiceTask: 'Chain fake loadUser and loadProgress Promise functions without nesting then calls.',
    knowledgeCheck: { type: 'mcq', question: 'What happens when a then handler returns a Promise?', options: ['The chain waits for it to settle', 'The Promise is converted to a string', 'The next then always runs immediately'], correctAnswer: 'The chain waits for it to settle', explanation: 'Promise resolution adopts the returned Promise state before continuing.' },
    tags: ['javascript', 'promises', 'chaining'], estimatedMinutes: 65
  }),
  makeLesson({
    key: 'async-await', topicKey: 'asynchronous-javascript', title: 'async Functions and await', difficulty: 'intermediate',
    theory: [
      'async/await is syntax built on Promises. An async function always returns a Promise, even when you return a normal value. await can be used inside an async function to pause that function’s continuation until a Promise settles. It does not block the entire JavaScript runtime.',
      'The main benefit is readability for sequences of dependent asynchronous steps. Instead of several then handlers, you can assign awaited results to local variables and use ordinary try/catch for rejection handling. The underlying timing and Promise behavior remain the same.',
      'await should not automatically be placed before every Promise. If two requests are independent, awaiting the first before starting the second makes them unnecessarily sequential. Start independent work together and await their combined result with Promise.all when appropriate.',
      'Because async functions return Promises, callers still need to await them, return them, or attach Promise handlers. Calling an async function without observing its result can hide failures or create race conditions when later code assumes the work finished.'
    ],
    codeExample: `async function loadDashboard() {\n  const user = await loadUser();\n  const orders = await loadOrders(user.id);\n  return { user, orders };\n}`,
    codeExplanation: 'The second request depends on the user id, so awaiting the first result before starting loadOrders is appropriate. The async function returns a Promise for the final object.',
    commonMistakes: ['Thinking await blocks the entire JavaScript thread.', 'Calling an async function without awaiting or returning its Promise when completion matters.', 'Awaiting independent work one request at a time and creating unnecessary delay.'],
    interviewDefinition: 'async/await is Promise-based syntax where async functions return Promises and await pauses only the current async function until a Promise settles.',
    interviewQuestion: 'What does an async function always return?', interviewAnswer: 'A Promise, even when the return statement contains a normal value.',
    interviewChecklist: ['Explains async returns Promise', 'Explains await', 'Clarifies it does not block the whole runtime'],
    practiceTask: 'Rewrite a two-step Promise chain using async/await and return the final combined result.',
    knowledgeCheck: { type: 'short_answer', question: 'What does an async function return?', correctAnswer: 'Promise', explanation: 'The async keyword wraps normal returned values in a Promise.' },
    tags: ['javascript', 'async-await', 'promises'], estimatedMinutes: 65
  }),
  makeLesson({
    key: 'fetch-http-errors', topicKey: 'asynchronous-javascript', title: 'Fetch API, JSON Responses and HTTP Errors', difficulty: 'intermediate',
    theory: [
      'fetch is a browser API that starts an HTTP request and returns a Promise for a Response object. The Response contains status information, headers, and methods for reading the response body. Calling response.json() is itself asynchronous and returns another Promise for parsed JSON data.',
      'A crucial rule is that fetch normally does not reject just because the server returned an HTTP error status such as 404 or 500. The request reached a server and received a response, so fetch resolves. Application code must inspect response.ok or response.status and throw or return an appropriate error when the HTTP status represents failure.',
      'fetch can reject for network-level failures such as loss of connectivity or certain blocked requests. Therefore robust code needs both an HTTP status check and a catch/try-catch path for rejected requests.',
      'Separate transport concerns from UI concerns. A loadUser function can request and validate data, then the page decides how to display loading, success, or error state. This keeps network code reusable and makes error handling easier to test.'
    ],
    codeExample: `async function loadUser(id) {\n  const response = await fetch('/api/users/' + id);\n  if (!response.ok) {\n    throw new Error('Request failed with status ' + response.status);\n  }\n  return response.json();\n}`,
    codeExplanation: 'The function awaits the Response, explicitly checks HTTP success, then returns the Promise created by response.json().',
    commonMistakes: ['Assuming fetch rejects automatically for 404 or 500 responses.', 'Forgetting that response.json() is asynchronous.', 'Mixing network request logic and many unrelated DOM updates in one function.'],
    interviewDefinition: 'fetch returns a Promise for an HTTP Response; application code must normally check response.ok because HTTP error statuses do not automatically reject the Promise.',
    interviewQuestion: 'Does fetch reject for a normal HTTP 404 response?', interviewAnswer: 'Usually no. It resolves with a Response whose ok property is false, so application code must handle the status explicitly.',
    interviewChecklist: ['Mentions Response Promise', 'Mentions response.ok/status', 'Mentions json parsing or network rejection'],
    practiceTask: 'Write loadCourses() that fetches JSON, rejects non-success HTTP statuses, and returns the parsed data.',
    knowledgeCheck: { type: 'mcq', question: 'What should code check after a fetch resolves?', options: ['response.ok or response.status', 'Only whether response exists', 'The CSS class of the page'], correctAnswer: 'response.ok or response.status', explanation: 'HTTP error responses can still resolve the fetch Promise.' },
    tags: ['javascript', 'fetch', 'http', 'async'], estimatedMinutes: 70
  }),
  makeLesson({
    key: 'promise-concurrency', topicKey: 'asynchronous-javascript', title: 'Concurrent Promises with all, allSettled, race and any', difficulty: 'intermediate',
    theory: [
      'Independent asynchronous operations can often begin at the same time. If a dashboard needs user data and notifications and neither request depends on the other, starting both before waiting reduces total wait time compared with awaiting them sequentially.',
      'Promise.all waits for every input Promise to fulfill and produces an array of results in input order. If any input rejects, Promise.all rejects. It is a good fit when all results are required for the operation to succeed.',
      'Promise.allSettled waits for every Promise and returns an outcome object for each one, making it useful when partial success is acceptable. Promise.race settles with the first settled input, while Promise.any fulfills with the first successful input and rejects only if all inputs reject.',
      'Choose based on product requirements, not method popularity. Ask whether every result is required, whether partial results are useful, whether the first completion matters, or whether the first success is enough. Also remember that these methods coordinate Promises; they do not magically cancel the operations that lose a race.'
    ],
    codeExample: `async function loadDashboard() {\n  const userPromise = fetch('/api/user').then((res) => res.json());\n  const notificationsPromise = fetch('/api/notifications').then((res) => res.json());\n  const [user, notifications] = await Promise.all([userPromise, notificationsPromise]);\n  return { user, notifications };\n}`,
    codeExplanation: 'Both fetch operations start before Promise.all is awaited, so independent waiting time can overlap. The result array keeps the same input order.',
    commonMistakes: ['Awaiting independent requests sequentially without reason.', 'Using Promise.all when partial success should be preserved.', 'Assuming Promise.race cancels the other Promises automatically.'],
    interviewDefinition: 'Promise combinators coordinate multiple Promises: all requires every success, allSettled records every outcome, race uses the first settlement, and any uses the first fulfillment.',
    interviewQuestion: 'How do Promise.all and Promise.allSettled differ?', interviewAnswer: 'Promise.all rejects when any input rejects, while allSettled waits for every input and reports each fulfillment or rejection.',
    interviewChecklist: ['Explains all', 'Explains allSettled', 'Mentions concurrency or another combinator'],
    practiceTask: 'Load three independent fake resources in parallel and compare how Promise.all and allSettled behave when one fails.',
    knowledgeCheck: { type: 'short_answer', question: 'Which Promise combinator waits for every result even when some reject?', correctAnswer: 'Promise.allSettled', explanation: 'allSettled reports every fulfilled or rejected outcome.' },
    tags: ['javascript', 'promise-all', 'allsettled', 'concurrency'], estimatedMinutes: 70
  })
];
