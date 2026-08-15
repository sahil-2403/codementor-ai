import { makeLesson } from './lessonFactory.js';

export const javascriptFoundationLessons = [
  makeLesson({
    key: 'what-is-javascript', topicKey: 'getting-started-javascript', title: 'What JavaScript Is and Where It Is Used', difficulty: 'beginner',
    theory: [
      'JavaScript is a programming language used to describe behavior. On a web page, HTML gives the page structure and CSS controls presentation, while JavaScript can react to clicks, validate forms, update content, request data, and coordinate the logic behind an interactive application. This separation is useful because it lets you think about structure, appearance, and behavior as different responsibilities.',
      'JavaScript is not limited to browsers. The same language can run in environments such as Node.js, which means it can also power servers, command-line tools, automation scripts, tests, and build tools. The language rules stay mostly the same, but the environment decides which extra APIs are available. A browser gives you features such as the DOM, while Node.js gives you features such as file-system and process APIs.',
      'Almost everything you learn later grows from a small set of ideas: values, variables, decisions, repetition, functions, objects, and asynchronous work. Advanced topics such as closures, Promises, prototypes, and the event loop are not separate magic systems. They build on the same basic rules, so it is worth understanding the foundation instead of rushing to memorize syntax.',
      'For now, use this simple mental model: you write instructions in JavaScript, a JavaScript engine reads those instructions, and the engine executes them according to the rules of the language. As the course continues, we will gradually add more detail to that model without assuming knowledge that has not been taught yet.'
    ],
    codeExample: `console.log('Hello, JavaScript!');\n\nconst learnerName = 'Asha';\nconsole.log('Welcome, ' + learnerName);`,
    codeExplanation: 'The first statement prints text. The second stores a text value in a variable. The last statement combines text and the stored value. This tiny program already demonstrates values, variables, and statements running in order.',
    commonMistakes: ['Treating JavaScript as the same thing as HTML or CSS instead of a separate language for behavior.', 'Assuming JavaScript only runs in browsers and therefore misunderstanding Node.js later.', 'Trying to memorize advanced syntax before learning how basic values and instructions work.'],
    interviewDefinition: 'JavaScript is a programming language used to add behavior to web pages and to build applications in environments such as browsers and Node.js.',
    interviewQuestion: 'What role does JavaScript usually play in a web application?', interviewAnswer: 'JavaScript controls behavior and application logic, while HTML provides structure and CSS controls presentation.',
    interviewChecklist: ['Defines JavaScript as a programming language', 'Mentions browser behavior or application logic', 'Explains that JavaScript can also run outside the browser'],
    practiceTask: 'Open a browser console. Print your name, your learning goal, and one arithmetic result.',
    knowledgeCheck: { type: 'mcq', question: 'Which statement best describes JavaScript?', options: ['A language used to describe program behavior', 'A database used by browsers', 'A replacement for HTML'], correctAnswer: 'A language used to describe program behavior', explanation: 'JavaScript is a programming language. Browsers and Node.js are environments that can execute it.' },
    tags: ['javascript', 'introduction', 'language'], estimatedMinutes: 40
  }),
  makeLesson({
    key: 'javascript-runtime-environments', topicKey: 'getting-started-javascript', title: 'JavaScript Engines, Browsers and Node.js', difficulty: 'beginner',
    theory: [
      'JavaScript source code needs a program that understands the language and can execute its instructions. That program is called a JavaScript engine. Modern browsers contain an engine, and Node.js also uses a JavaScript engine. As a learner, you normally write normal JavaScript code and let the environment pass it to the engine.',
      'The engine understands the JavaScript language itself, but many useful objects come from the host environment around it. In a browser, window, document, localStorage, and browser events are supplied by browser APIs. In Node.js, other APIs are available for tasks such as working with files, running servers, and reading process information. That is why code using document works in a browser but not in a normal Node.js script.',
      'Separating the language from the environment prevents confusion. JavaScript defines things such as variables, functions, arrays, objects, and Promises. The browser adds the DOM and web APIs. Node.js adds server-side APIs. Some APIs, such as timers and fetch in modern environments, may exist in more than one environment even though they are still host-provided capabilities rather than basic language syntax.',
      'You do not need engine internals yet. The useful habit is to ask: is this feature part of JavaScript, or is it supplied by the environment where JavaScript is running? That question becomes important when we later move between browser lessons, Node.js projects, and interview questions about runtimes.'
    ],
    codeExample: `const environment = typeof window === 'undefined' ? 'Node.js-like' : 'Browser';\nconsole.log(environment);`,
    codeExplanation: 'typeof can safely check for a possibly missing global. Browsers normally expose window, while a normal Node.js process does not.',
    commonMistakes: ['Calling every browser API a built-in JavaScript language feature.', 'Expecting document or window to exist in a normal Node.js script.', 'Assuming browser JavaScript and Node.js expose exactly the same globals.'],
    interviewDefinition: 'A JavaScript engine executes the language, while the host environment supplies additional APIs such as the DOM in browsers or server APIs in Node.js.',
    interviewQuestion: 'What is the difference between JavaScript and the browser?', interviewAnswer: 'JavaScript is the language. The browser is one host environment that executes JavaScript and provides browser-specific APIs such as the DOM.',
    interviewChecklist: ['Separates language from environment', 'Mentions the engine executes JavaScript', 'Gives an example of a host-provided API'],
    practiceTask: 'Run a small script in the browser console and Node.js, then list two environment-specific globals.',
    knowledgeCheck: { type: 'mcq', question: 'Where does the document object normally come from?', options: ['The browser environment', 'The JavaScript syntax specification itself', 'A const declaration'], correctAnswer: 'The browser environment', explanation: 'document is part of the browser DOM API, not a basic JavaScript language primitive.' },
    tags: ['javascript', 'runtime', 'browser', 'node'], estimatedMinutes: 40
  }),
  makeLesson({
    key: 'first-program-syntax', topicKey: 'getting-started-javascript', title: 'Statements, Comments and Basic Syntax', difficulty: 'beginner',
    theory: [
      'A JavaScript program is a sequence of instructions. Many individual instructions are called statements. In a simple script, statements normally execute from top to bottom. Later, conditions, loops, functions, and asynchronous callbacks will change the path through the program, but reading simple code in order is the first skill to develop.',
      'JavaScript uses symbols to group and describe code. Parentheses are often used for function calls and conditions. Curly braces create blocks for functions, loops, and conditions. Quotes create string values. Semicolons can mark the end of statements; JavaScript can insert many of them automatically, but consistent formatting makes code easier to read and reduces confusing edge cases.',
      'Comments are notes for people reading the code. A line beginning with // is a single-line comment, and text inside /* and */ is a block comment. The engine ignores comments. Good comments explain intent, an unusual decision, or important context. A comment that simply repeats obvious code creates noise instead of helping.',
      'Do not try to memorize every punctuation rule at once. When you see a program, identify its values, variable names, function calls, and blocks. Then trace which statement runs first and what value changes next. This calm reading habit is more useful than trying to remember syntax as isolated symbols.'
    ],
    codeExample: `// Original price\nconst price = 500;\n\n// Apply a 10% discount\nconst finalPrice = price - price * 0.10;\nconsole.log(finalPrice);`,
    codeExplanation: 'The first statement stores a number. The next statement calculates a new number. The final statement prints it. The comments explain why the calculations exist.',
    commonMistakes: ['Treating comments as executable instructions.', 'Writing many statements on one line and making execution order difficult to read.', 'Removing braces or parentheses without understanding what structure they represent.'],
    interviewDefinition: 'A JavaScript program contains statements that describe actions; comments document code for people and are ignored during execution.',
    interviewQuestion: 'What is a statement in JavaScript?', interviewAnswer: 'A statement is an instruction that tells the JavaScript engine to perform an action.',
    interviewChecklist: ['Describes a statement as an instruction', 'Explains normal top-to-bottom execution', 'Separates comments from executable code'],
    practiceTask: 'Write a short program that stores a product price, adds delivery cost, prints the total, and includes one useful comment.',
    knowledgeCheck: { type: 'short_answer', question: 'Which token starts a single-line JavaScript comment?', correctAnswer: '//', explanation: '// begins a single-line comment.' },
    tags: ['javascript', 'syntax', 'statements', 'comments'], estimatedMinutes: 40
  }),
  makeLesson({
    key: 'console-devtools', topicKey: 'getting-started-javascript', title: 'Using the Console and Developer Tools', difficulty: 'beginner',
    theory: [
      'Learning JavaScript becomes easier when you can observe what a program is doing. Browser Developer Tools include a Console where you can run expressions and inspect values. They also provide tools for inspecting page elements, network requests, source files, and paused program state. You do not need every panel immediately, but you should become comfortable opening the tools and reading output.',
      'console.log is useful for showing values at a particular point. console.table can display arrays of objects in a readable table. console.error can make an error message stand out. A log is most useful when it answers a question, such as “What is total before this condition?” rather than printing random values everywhere.',
      'When an error appears, read it instead of immediately changing code. The message often tells you the error type, a useful description, and the file and line where the problem became visible. Later we will learn breakpoints and a full debugging workflow, but this habit of gathering evidence should begin from the first topic.',
      'Developer tools do not fix code automatically. They help you see what the runtime sees. That makes them one of the most important practical skills in the course because every later topic—from arrays to asynchronous requests—becomes easier to understand when you can inspect real values.'
    ],
    codeExample: `const learners = [\n  { name: 'Asha', score: 82 },\n  { name: 'Ravi', score: 74 }\n];\n\nconsole.table(learners);\nconsole.log('Count:', learners.length);`,
    codeExplanation: 'console.table makes object collections easy to scan. The second log answers one focused question: how many learners are in the array.',
    commonMistakes: ['Ignoring the exact error message and guessing at a fix.', 'Leaving dozens of unclear debug logs in finished code.', 'Changing several lines at once before confirming the current values.'],
    interviewDefinition: 'Developer Tools let you inspect running code, values, errors, network activity, and paused execution so debugging is based on evidence.',
    interviewQuestion: 'Why are browser Developer Tools important for JavaScript debugging?', interviewAnswer: 'They show actual runtime values, errors, call stacks, page state, and network activity so you can investigate instead of guessing.',
    interviewChecklist: ['Mentions runtime inspection', 'Mentions errors or breakpoints', 'Explains evidence-based debugging'],
    practiceTask: 'Create three objects in an array and inspect them using console.log and console.table. Compare the outputs.',
    knowledgeCheck: { type: 'mcq', question: 'What is the best purpose of a debug log?', options: ['Answer a specific question about runtime state', 'Replace understanding the code', 'Hide an error message'], correctAnswer: 'Answer a specific question about runtime state', explanation: 'Useful logs collect evidence about a particular value or execution point.' },
    tags: ['javascript', 'console', 'devtools', 'debugging'], estimatedMinutes: 40
  }),

  makeLesson({
    key: 'variables-mental-model', topicKey: 'variables-values', title: 'What a Variable Really Means', difficulty: 'beginner',
    theory: [
      'A variable gives a meaningful name to a value so the program can use that value later. Programs constantly need to remember things such as a user name, score, cart total, selected option, or login state. Naming those values is much clearer than repeating raw values throughout the code.',
      'It helps to separate the variable name from the value currently associated with it. In let score = 10, score is the identifier and 10 is the value. If the code later assigns score = 15, the identifier stays the same but the value connected to it changes. This idea is called a binding.',
      'Variable names should describe meaning. totalPrice tells a reader much more than x. isLoggedIn strongly suggests a true-or-false value. Good naming is not only style; it reduces the amount of information you need to keep in your head when reading a larger program.',
      'JavaScript provides let, const, and the older var keyword for declarations. We will study each one separately. The main decision is whether the binding itself should be allowed to point to a different value later.'
    ],
    codeExample: `let score = 10;\nconsole.log(score);\nscore = 15;\nconsole.log(score);`,
    codeExplanation: 'The same variable name is used twice, but reassignment changes the number currently associated with that name.',
    commonMistakes: ['Using vague names such as x or data for unrelated values.', 'Confusing a variable name with the value stored through that name.', 'Reusing one variable for several different meanings.'],
    interviewDefinition: 'A variable is a named binding that lets a program refer to a value.',
    interviewQuestion: 'What is the difference between a variable name and its value?', interviewAnswer: 'The name is the identifier used in code, while the value is the data currently associated with that identifier.',
    interviewChecklist: ['Defines a variable as a named binding', 'Separates identifier from value', 'Mentions that some bindings can be reassigned'],
    practiceTask: 'Create clearly named variables for learnerName, completedLessons, and isActive, then print them.',
    knowledgeCheck: { type: 'mcq', question: 'Which name most clearly represents a shopping cart total?', options: ['x', 'value', 'cartTotal'], correctAnswer: 'cartTotal', explanation: 'A meaningful name communicates what the value represents.' },
    tags: ['javascript', 'variables', 'bindings'], estimatedMinutes: 40
  }),
  makeLesson({
    key: 'let-reassignment', topicKey: 'variables-values', title: 'Using let When a Value Needs to Change', difficulty: 'beginner',
    theory: [
      'Use let when the variable itself needs to receive a different value later. Counters, running totals, the current page number, and a selected item are common examples. The important part is reassignment: the same name needs to point to a new value as the program runs.',
      'A let declaration is block-scoped. A block is usually code inside curly braces, such as an if statement or loop. We will study scope in depth later, but block scope helps temporary values stay in the part of the program where they belong instead of leaking into unrelated code.',
      'Being allowed to reassign a let variable does not mean constant mutation is good design. A variable should still have one clear meaning. If a value represents something completely different later, a new name is often clearer than reusing an old one.',
      'A practical modern habit is to begin with const and use let when reassignment is actually required. This makes changes easier to notice while reading the code and prevents accidental reassignment of values that should remain stable.'
    ],
    codeExample: `let completedLessons = 0;\ncompletedLessons += 1;\ncompletedLessons += 1;\nconsole.log(completedLessons);`,
    codeExplanation: 'The counter must receive a new number each time a lesson is completed, so let is appropriate.',
    commonMistakes: ['Using let for every declaration even when reassignment never happens.', 'Reusing one let variable for unrelated concepts.', 'Assuming let can safely be read before the declaration line.'],
    interviewDefinition: 'let creates a block-scoped binding that can be reassigned later.',
    interviewQuestion: 'When should you choose let instead of const?', interviewAnswer: 'Use let when the binding itself must be reassigned to a different value later.',
    interviewChecklist: ['Mentions reassignment', 'Mentions block scope', 'Distinguishes let from const'],
    practiceTask: 'Create a cartTotal with let and add three item prices to it one at a time.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `let count = 1;\ncount += 2;\nconsole.log(count);`, correctAnswer: '3', explanation: 'The += operator reassigns count to its old value plus 2.' },
    tags: ['javascript', 'let', 'reassignment'], estimatedMinutes: 40
  }),
  makeLesson({
    key: 'const-bindings', topicKey: 'variables-values', title: 'Using const and Understanding Fixed Bindings', difficulty: 'beginner',
    theory: [
      'Use const when a binding should not be reassigned after initialization. In modern JavaScript, const is a good default because it tells readers that the name will continue to refer to the same value or object identity throughout that scope.',
      'A common misunderstanding is that const makes objects and arrays completely immutable. It does not. If a const variable refers to an object, you cannot assign that variable to a different object, but the properties of the existing object can still change. const protects the binding, not every piece of data reachable through it.',
      'For primitive values such as numbers and strings, this is easy to see: const taxRate = 0.18 cannot later become 0.20 through reassignment. For an object, const settings = { theme: "dark" } can still have settings.theme changed unless the object itself is frozen or treated immutably by your code.',
      'Choosing const whenever reassignment is unnecessary reduces accidental changes and communicates intent. Later, when we study references and immutable updates, this distinction between a fixed binding and a mutable object will become especially important.'
    ],
    codeExample: `const user = { name: 'Riya', points: 10 };\nuser.points = 20;\nconsole.log(user.points);`,
    codeExplanation: 'The user variable still points to the same object, so changing a property is allowed even though the binding uses const.',
    commonMistakes: ['Believing const automatically freezes an object.', 'Trying to reassign a const binding.', 'Using let for values that never need reassignment.'],
    interviewDefinition: 'const creates a block-scoped binding that must be initialized and cannot later be reassigned.',
    interviewQuestion: 'Can properties of a const object change?', interviewAnswer: 'Yes. const prevents reassignment of the variable binding; it does not automatically make the object immutable.',
    interviewChecklist: ['Mentions no reassignment', 'Explains object properties may still change', 'Distinguishes binding from object contents'],
    practiceTask: 'Create a const settings object, update one property, and explain why the update is allowed.',
    knowledgeCheck: { type: 'mcq', question: 'What does const prevent?', options: ['Reassigning the binding', 'Changing every property inside an object', 'Calling methods on an object'], correctAnswer: 'Reassigning the binding', explanation: 'const protects the binding, not the full internal state of an object.' },
    tags: ['javascript', 'const', 'bindings'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'var-legacy', topicKey: 'variables-values', title: 'Understanding var and Why Modern Code Prefers let and const', difficulty: 'beginner',
    theory: [
      'Before let and const were added to JavaScript, var was the main declaration keyword. You still need to understand var because older codebases and interview questions may use it. New application code normally prefers let and const because their rules are easier to reason about.',
      'The most important difference is scope. var is function-scoped, not block-scoped. A var declared inside an if block remains available elsewhere in the same function. let and const stay inside their block. This makes temporary block values safer and reduces accidental name collisions.',
      'var declarations are also hoisted with an initial value of undefined. That means reading a var before its declaration line does not produce the same error as reading let or const before initialization. This older behavior can hide mistakes and make execution harder to follow.',
      'You do not need to avoid reading code that uses var. Learn its behavior, recognize why it exists, and prefer let or const when writing new code unless you have a specific reason to reproduce legacy behavior.'
    ],
    codeExample: `function demo() {\n  if (true) {\n    var oldStyle = 'visible';\n    let modernStyle = 'block only';\n  }\n  console.log(oldStyle);\n}\n\ndemo();`,
    codeExplanation: 'oldStyle is function-scoped, so it is still available after the if block. modernStyle would not be.',
    commonMistakes: ['Assuming var is block-scoped like let.', 'Using var because it appears in old tutorials without understanding its behavior.', 'Thinking hoisting means source code is physically moved.'],
    interviewDefinition: 'var creates a function-scoped binding with older hoisting and redeclaration behavior; modern code usually prefers let and const.',
    interviewQuestion: 'Why are let and const usually preferred over var?', interviewAnswer: 'They use block scope and stricter declaration rules, which reduce accidental leakage and confusing redeclarations.',
    interviewChecklist: ['Mentions function scope for var', 'Mentions block scope for let/const', 'Mentions older hoisting behavior'],
    practiceTask: 'Write one function that demonstrates how var and let behave differently inside an if block.',
    knowledgeCheck: { type: 'short_answer', question: 'Is var block-scoped or function-scoped?', correctAnswer: 'function-scoped', explanation: 'A var declaration belongs to its containing function rather than a normal block.' },
    tags: ['javascript', 'var', 'legacy', 'scope'], estimatedMinutes: 45
  }),

  makeLesson({
    key: 'strings', topicKey: 'data-types', title: 'Strings: Working with Text', difficulty: 'beginner',
    theory: [
      'A string represents text. User names, messages, URLs, product titles, and form inputs are commonly stored as strings. JavaScript lets you create strings with single quotes, double quotes, or backticks. The quote characters mark where the text begins and ends.',
      'Strings are primitive values and are immutable. You can create a new string based on an old one, but you do not change individual characters inside the existing string. Methods such as toUpperCase, trim, includes, and slice return values you can use in further calculations.',
      'Strings have a length property and zero-based character positions. The first character is at index 0. When data arrives from a form, it is usually text even if the user typed digits, so understanding strings is important before we later study explicit number conversion.',
      'Use string methods to express intent clearly. trim is useful for removing surrounding whitespace, includes checks whether text contains another piece of text, and template literals later make combining values with text easier to read.'
    ],
    codeExample: `const rawName = '  sahil  ';\nconst cleanName = rawName.trim();\nconsole.log(cleanName.toUpperCase());`,
    codeExplanation: 'trim returns a new string without surrounding spaces. toUpperCase returns another new string. rawName itself is unchanged.',
    commonMistakes: ['Forgetting that string indexes begin at 0.', 'Expecting string methods to mutate the original primitive string.', 'Treating numeric form input as a number without conversion.'],
    interviewDefinition: 'A string is an immutable primitive value used to represent text.',
    interviewQuestion: 'Are JavaScript strings mutable?', interviewAnswer: 'No. String operations create new string values rather than modifying the original primitive string.',
    interviewChecklist: ['Calls string a primitive', 'Mentions text', 'Explains immutability'],
    practiceTask: 'Normalize a name by trimming spaces and converting the first test output to uppercase.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `const text = ' hello ';\nconsole.log(text.trim().length);`, correctAnswer: '5', explanation: 'trim removes one leading and one trailing space, leaving five characters.' },
    tags: ['javascript', 'strings', 'text'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'numbers-nan', topicKey: 'data-types', title: 'Numbers, Arithmetic and NaN', difficulty: 'beginner',
    theory: [
      'JavaScript uses the number type for ordinary integer and decimal calculations. Prices, scores, coordinates, percentages, and counters are commonly represented as numbers. Basic arithmetic uses operators such as +, -, *, /, and %. JavaScript also provides the Math object for common calculations such as rounding, minimums, maximums, and random values.',
      'One unusual numeric value is NaN, which means “Not-a-Number.” The name sounds as if it should have a different type, but typeof NaN is still "number". NaN often appears when a calculation expected a valid number but received something that could not be converted correctly.',
      'Do not check for NaN using value === NaN because NaN is not equal to itself. Number.isNaN(value) is a clearer check when you specifically need to know whether a value is NaN. Later, input validation will help us prevent invalid numeric data before it reaches calculations.',
      'Floating-point numbers also have precision limits. Some decimal calculations, such as 0.1 + 0.2, cannot be represented exactly in binary floating-point format. For ordinary learning examples this is not a problem, but financial applications usually use careful rounding or store amounts in smaller integer units such as paise or cents.'
    ],
    codeExample: `const price = 499;\nconst tax = price * 0.18;\nconsole.log(Math.round(price + tax));\n\nconsole.log(Number.isNaN(Number('hello')));`,
    codeExplanation: 'The first calculation adds tax and rounds the result. Converting nonnumeric text with Number produces NaN, which Number.isNaN detects.',
    commonMistakes: ['Checking NaN with === NaN.', 'Assuming all decimal arithmetic is perfectly exact.', 'Performing arithmetic on numeric-looking strings without deciding whether to convert them.'],
    interviewDefinition: 'JavaScript number represents ordinary numeric values; NaN is a special number value that represents an invalid numeric result.',
    interviewQuestion: 'Why should Number.isNaN be used instead of comparing with NaN?', interviewAnswer: 'Because NaN is not equal to itself, so direct equality checks do not work as expected.',
    interviewChecklist: ['Explains number type', 'Explains NaN', 'Mentions Number.isNaN'],
    practiceTask: 'Calculate an 18% tax amount, round the final price, and test one invalid numeric conversion with Number.isNaN.',
    knowledgeCheck: { type: 'short_answer', question: 'What does typeof NaN return?', correctAnswer: 'number', explanation: 'NaN is a special numeric value, so typeof NaN is "number".' },
    tags: ['javascript', 'number', 'nan', 'math'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'booleans-null-undefined', topicKey: 'data-types', title: 'Booleans, undefined and null', difficulty: 'beginner',
    theory: [
      'A boolean has only two values: true and false. Booleans represent yes-or-no conditions such as whether a user is logged in, whether a form is valid, or whether a product is in stock. Conditions later use boolean-like results to decide which code path should run.',
      'undefined usually means a value has not been provided or assigned. A declared variable without an initial value is undefined, and reading a missing object property also gives undefined. It often represents absence that happened naturally because something has not been set.',
      'null is also used to represent absence, but it is normally assigned deliberately. For example, an application might use null to mean “there is currently no selected course.” JavaScript does not force one universal meaning, so teams should use null and undefined consistently.',
      'The two values are different even though both mean “no useful value” in many situations. null === undefined is false. Later, optional chaining and the nullish coalescing operator will help us work safely with either null or undefined.'
    ],
    codeExample: `let selectedCourse;\nconst currentMentor = null;\nconst isLoggedIn = true;\n\nconsole.log(selectedCourse, currentMentor, isLoggedIn);`,
    codeExplanation: 'selectedCourse is undefined because no value was assigned. currentMentor is intentionally null. isLoggedIn is a boolean.',
    commonMistakes: ['Treating null and undefined as exactly the same value.', 'Using strings such as "true" when a real boolean is needed.', 'Assuming every undefined value is automatically an error.'],
    interviewDefinition: 'Boolean represents true or false; undefined commonly represents a missing or uninitialized value, while null is often used for intentional absence.',
    interviewQuestion: 'How are null and undefined usually different in application code?', interviewAnswer: 'undefined often means no value has been provided, while null is commonly assigned intentionally to represent an empty or missing value.',
    interviewChecklist: ['Defines booleans', 'Explains undefined', 'Explains null as intentional absence'],
    practiceTask: 'Create an object with an intentionally null field, read one missing field, and compare the two results.',
    knowledgeCheck: { type: 'mcq', question: 'Which value is commonly used to represent intentional absence?', options: ['null', 'true', 'NaN only'], correctAnswer: 'null', explanation: 'Applications often assign null deliberately when no current value exists.' },
    tags: ['javascript', 'boolean', 'null', 'undefined'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'typeof-primitives-references', topicKey: 'data-types', title: 'typeof, Primitive Values and Reference Values', difficulty: 'beginner',
    theory: [
      'JavaScript values are often discussed as primitives or objects. Primitive types include string, number, bigint, boolean, undefined, symbol, and null. Objects include normal objects, arrays, and functions with object-like behavior. This distinction becomes important when values are copied or changed.',
      'The typeof operator reports a simple type label for most values. typeof "hello" is "string", typeof 42 is "number", and typeof true is "boolean". Functions report "function". Arrays report "object", so Array.isArray is the normal way to check specifically for an array.',
      'There is also a historical JavaScript quirk: typeof null returns "object" even though null is a primitive value. This behavior cannot be changed without breaking old code, so developers learn to check null directly when needed.',
      'For now, remember that primitives behave like independent values when copied, while objects are accessed through references. We will explore the practical consequences in a dedicated References and Copying topic later instead of trying to learn everything at once.'
    ],
    codeExample: `const values = ['hello', 42, true, undefined, null, [1, 2]];\nfor (const value of values) {\n  console.log(value, typeof value, Array.isArray(value));\n}`,
    codeExplanation: 'The loop shows the normal typeof results, the typeof null quirk, and why Array.isArray is needed for arrays.',
    commonMistakes: ['Using typeof value === "array" even though arrays report "object".', 'Forgetting the historical typeof null result.', 'Assuming primitive and object copying behave the same way.'],
    interviewDefinition: 'Primitive values are basic immutable values, while objects are reference values; typeof identifies many types but has known cases such as null and arrays.',
    interviewQuestion: 'How do you reliably check whether a value is an array?', interviewAnswer: 'Use Array.isArray(value) because typeof an array returns "object".',
    interviewChecklist: ['Mentions primitives and objects', 'Mentions typeof null quirk', 'Uses Array.isArray for arrays'],
    practiceTask: 'Write describeValue(value) that returns "null", "array", or the normal typeof result.',
    knowledgeCheck: { type: 'short_answer', question: 'What does typeof null return?', correctAnswer: 'object', explanation: 'It returns "object" because of a historical JavaScript behavior.' },
    tags: ['javascript', 'typeof', 'primitives', 'references'], estimatedMinutes: 50
  }),

  makeLesson({
    key: 'arithmetic-assignment', topicKey: 'operators-conversion', title: 'Arithmetic and Assignment Operators', difficulty: 'beginner',
    theory: [
      'Operators combine or transform values. Arithmetic operators include + for addition, - for subtraction, * for multiplication, / for division, and % for remainder. The exponentiation operator ** raises a value to a power. Parentheses can make calculation order explicit and easier to read.',
      'Assignment gives a value to a variable. The simple = operator assigns the value on the right to the binding on the left. Compound operators such as +=, -=, *=, and /= combine a calculation with reassignment. They are useful for counters and running totals, but only when the variable was declared with a binding that can change.',
      'JavaScript follows operator precedence rules, but code should not depend on a reader remembering a long precedence table. Parentheses are cheap and can make the intended grouping obvious, especially when multiplication, addition, and comparisons appear in one expression.',
      'Keep calculations readable. A long expression can usually be broken into named intermediate values such as subtotal, tax, and finalTotal. Those names document the business meaning and make debugging easier than one dense line of arithmetic.'
    ],
    codeExample: `const subtotal = 800;\nconst tax = subtotal * 0.18;\nconst delivery = 50;\nconst total = subtotal + tax + delivery;\nconsole.log(total);`,
    codeExplanation: 'Each calculation is named separately, so the final total is easy to understand and inspect.',
    commonMistakes: ['Using = when you intended a comparison.', 'Writing one long expression that hides the meaning of each number.', 'Forgetting that += reassigns the variable.'],
    interviewDefinition: 'Arithmetic operators perform numeric calculations, while assignment operators store or update values in bindings.',
    interviewQuestion: 'What does += do?', interviewAnswer: 'It adds the right-hand value to the current left-hand value and assigns the result back to the left-hand variable.',
    interviewChecklist: ['Explains arithmetic operators', 'Explains assignment', 'Explains compound assignment'],
    practiceTask: 'Calculate subtotal, discount, tax, and final total as separate named values.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `let total = 10;\ntotal *= 3;\nconsole.log(total);`, correctAnswer: '30', explanation: '*= multiplies the existing value and reassigns the result.' },
    tags: ['javascript', 'operators', 'arithmetic', 'assignment'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'comparison-equality', topicKey: 'operators-conversion', title: 'Comparison Operators and Strict Equality', difficulty: 'beginner',
    theory: [
      'Comparisons answer questions such as whether two values are equal, whether one number is larger, or whether a score reached a required limit. Operators such as >, <, >=, and <= produce boolean results that later drive conditions.',
      'JavaScript has both loose equality (==) and strict equality (===). Loose equality can convert values before comparing them, which creates rules that are easy to misunderstand. Strict equality compares both type and value without that coercion. For ordinary application code, === and !== are the clearest defaults.',
      'For example, the string "10" and number 10 are loosely equal but not strictly equal. If the program really intends to compare numbers, it is usually clearer to convert the input explicitly first and then use strict equality. That makes the data rule visible in the code.',
      'Objects are different: equality compares object identity, not whether two separate objects contain the same properties. We will revisit that when we learn references. For now, focus on strict equality for primitive values and explicit conversion at input boundaries.'
    ],
    codeExample: `const input = '10';\nconsole.log(input == 10);\nconsole.log(input === 10);\nconsole.log(Number(input) === 10);`,
    codeExplanation: 'Loose equality converts the string. Strict equality does not. Explicit Number conversion makes the numeric intention clear before the strict comparison.',
    commonMistakes: ['Using == by habit when strict equality expresses the rule more clearly.', 'Comparing numeric strings to numbers without deciding whether conversion is intended.', 'Expecting two separate object literals with identical properties to be strictly equal.'],
    interviewDefinition: 'Strict equality compares both type and value without coercion, while loose equality may convert operands before comparison.',
    interviewQuestion: 'Why is === usually preferred to ==?', interviewAnswer: 'Because it avoids hidden coercion and makes comparisons more predictable.',
    interviewChecklist: ['Defines strict equality', 'Mentions coercion in loose equality', 'Recommends explicit conversion when needed'],
    practiceTask: 'Normalize an age input with Number and compare it to a required minimum using strict comparison.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `console.log('5' === 5);`, correctAnswer: 'false', explanation: 'The values have different types, so strict equality is false.' },
    tags: ['javascript', 'comparison', 'equality', 'strict-equality'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'logical-truthy-falsy', topicKey: 'operators-conversion', title: 'Logical Operators, Truthy and Falsy Values', difficulty: 'beginner',
    theory: [
      'Logical operators combine conditions. && means both sides must be truthy, || means at least one side should be truthy, and ! converts a value to a boolean and reverses it. These operators are common in validation, permissions, and conditional rendering.',
      'JavaScript conditions do not require literal true or false. Values are interpreted as truthy or falsy. false, 0, -0, 0n, an empty string, null, undefined, and NaN are falsy. Most other values—including empty arrays and empty objects—are truthy.',
      'The || and && operators return one of their operands rather than always returning a boolean. This enables useful patterns but can also surprise beginners. For example, value || defaultValue uses the default for every falsy value, including 0 and an empty string, even if those values are valid.',
      'Use Boolean(value) or !!value when you specifically need a boolean conversion. Later we will learn ??, which is safer than || when only null or undefined should trigger a fallback.'
    ],
    codeExample: `const age = 22;\nconst hasId = true;\nconst canEnter = age >= 18 && hasId;\nconsole.log(canEnter);`,
    codeExplanation: 'Both conditions are true, so && produces a truthy result and canEnter becomes true.',
    commonMistakes: ['Assuming empty arrays or objects are falsy.', 'Using || for defaults when 0 or an empty string is a valid value.', 'Forgetting that logical operators can return operands rather than boolean literals.'],
    interviewDefinition: 'Truthy and falsy describe how values behave in boolean contexts; logical operators combine or choose between those values.',
    interviewQuestion: 'Name three falsy JavaScript values.', interviewAnswer: 'Examples include false, 0, an empty string, null, undefined, and NaN.',
    interviewChecklist: ['Defines truthy/falsy behavior', 'Gives valid falsy examples', 'Explains && or ||'],
    practiceTask: 'Write canCheckout(age, hasPaymentMethod) using comparison and logical operators.',
    knowledgeCheck: { type: 'mcq', question: 'Which value is truthy?', options: ['[]', '0', 'undefined'], correctAnswer: '[]', explanation: 'Arrays are objects, and even an empty array is truthy.' },
    tags: ['javascript', 'logical-operators', 'truthy', 'falsy'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'explicit-conversion-coercion', topicKey: 'operators-conversion', title: 'Explicit Type Conversion and Coercion', difficulty: 'beginner',
    theory: [
      'Type conversion changes a value from one type to another. JavaScript can perform conversion automatically in some expressions, which is called coercion. Automatic coercion is convenient, but hidden conversions can make code difficult to predict when the input type is not obvious.',
      'The Number, String, and Boolean functions make conversion explicit. Number("42") creates the number 42, String(42) creates "42", and Boolean(value) applies normal truthy/falsy rules. Explicit conversion is especially useful at boundaries such as form input, URL parameters, and data received from external systems.',
      'The + operator deserves special attention because it performs numeric addition when both operands are numbers but string concatenation when a string is involved. "10" + 5 becomes "105". Converting with Number before arithmetic avoids this common beginner bug.',
      'Conversion can fail. Number("hello") produces NaN. Good code checks whether converted values are valid before relying on them. The goal is not to avoid every automatic conversion, but to make important data assumptions visible and intentional.'
    ],
    codeExample: `const input = '25';\nconst age = Number(input);\n\nif (!Number.isNaN(age)) {\n  console.log(age + 5);\n}`, 
    codeExplanation: 'The string input is converted explicitly to a number, checked for NaN, and then used in arithmetic.',
    commonMistakes: ['Assuming numeric-looking text is already a number.', 'Ignoring NaN after a failed Number conversion.', 'Using + without noticing that one operand is a string.'],
    interviewDefinition: 'Type coercion is automatic conversion performed by JavaScript, while explicit conversion uses functions such as Number, String, or Boolean to make the intended type clear.',
    interviewQuestion: 'What does Number("hello") produce?', interviewAnswer: 'It produces NaN because the text cannot be converted into a valid number.',
    interviewChecklist: ['Defines conversion', 'Distinguishes explicit conversion from coercion', 'Mentions validation of failed numeric conversion'],
    practiceTask: 'Write normalizeAge(input) that converts a value to a number and returns null when the conversion is invalid.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `console.log('10' + 5);`, correctAnswer: '105', explanation: 'Because one operand is a string, + performs string concatenation.' },
    tags: ['javascript', 'conversion', 'coercion'], estimatedMinutes: 50
  }),

  makeLesson({
    key: 'if-else', topicKey: 'conditions-decisions', title: 'Making Decisions with if and else', difficulty: 'beginner',
    theory: [
      'Programs often need to choose what to do based on current data. An if statement evaluates a condition. When the condition is truthy, the if block runs. An optional else block runs when the condition is falsy. This creates two possible paths through the program.',
      'Conditions should express a clear question. score >= 60 asks whether the score reaches the passing threshold. isLoggedIn asks whether the login state is truthy. Clear condition names make the code read almost like a sentence.',
      'Curly braces group the statements that belong to each branch. Even when a language feature allows a one-line branch without braces, keeping braces is a useful habit for beginners because future edits are less likely to change behavior accidentally.',
      'Avoid deeply nesting conditions too early. Start with the simplest rule, test it, and add another branch only when the requirement really needs it. Later we will use guard clauses to handle invalid or exceptional cases before the main logic.'
    ],
    codeExample: `const score = 72;\n\nif (score >= 60) {\n  console.log('Pass');\n} else {\n  console.log('Try again');\n}`, 
    codeExplanation: 'The comparison produces true, so the if block runs and the else block is skipped.',
    commonMistakes: ['Using = instead of a comparison in a condition.', 'Writing unclear conditions with several unrelated responsibilities.', 'Adding unnecessary nested if statements when one condition is enough.'],
    interviewDefinition: 'An if statement executes a block when its condition is truthy; else provides an alternative block when the condition is falsy.',
    interviewQuestion: 'What determines whether an if block runs?', interviewAnswer: 'JavaScript evaluates the condition and runs the block when that result is truthy.',
    interviewChecklist: ['Explains condition evaluation', 'Mentions truthy/falsy', 'Explains else as the alternative path'],
    practiceTask: 'Write a simple pass/fail check for a score and print a different message for each branch.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `const value = 0;\nif (value) console.log('A'); else console.log('B');`, correctAnswer: 'B', explanation: '0 is falsy, so the else branch runs.' },
    tags: ['javascript', 'if', 'else', 'conditions'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'else-if-ranges', topicKey: 'conditions-decisions', title: 'Handling Multiple Rules with else if', difficulty: 'beginner',
    theory: [
      'When more than two outcomes are possible, an if/else if/else chain can test rules in order. JavaScript stops at the first truthy branch, so the order of conditions matters. This is useful for grade ranges, pricing tiers, validation states, and permission levels.',
      'Think from the most specific or highest-priority rule to the more general rules. For a grade calculator, checking score >= 90 before score >= 75 prevents a score of 95 from matching the lower range first. The final else can handle everything not matched earlier.',
      'Conditions can overlap, so read them as an ordered decision process rather than independent questions. If the rules are complicated, calculate named booleans or break the logic into a function instead of creating one unreadable expression.',
      'Testing boundary values is important. If the rule changes at 60, test 59, 60, and 61. Off-by-one comparison mistakes often appear only at these boundaries even when the main cases work correctly.'
    ],
    codeExample: `const score = 83;\nlet grade;\n\nif (score >= 90) grade = 'A';\nelse if (score >= 75) grade = 'B';\nelse if (score >= 60) grade = 'C';\nelse grade = 'D';\n\nconsole.log(grade);`,
    codeExplanation: '83 fails the first condition, matches the second, and stops there. Later branches are not evaluated.',
    commonMistakes: ['Putting a broad condition before a more specific one.', 'Forgetting to test exact boundary values.', 'Creating long chains when a data lookup would be clearer for fixed mappings.'],
    interviewDefinition: 'else if adds ordered conditions after an initial if; only the first matching branch in the chain executes.',
    interviewQuestion: 'Why does condition order matter in an else-if chain?', interviewAnswer: 'Because JavaScript stops after the first truthy branch, so a broad earlier condition can prevent a later specific rule from running.',
    interviewChecklist: ['Mentions first matching branch', 'Explains ordering', 'Gives a range or priority example'],
    practiceTask: 'Create a ticket-price rule for child, adult, and senior age ranges and test the boundary ages.',
    knowledgeCheck: { type: 'short_answer', question: 'How many branches of one if/else-if/else chain execute?', correctAnswer: 'one', explanation: 'At most one branch runs because evaluation stops after the first match.' },
    tags: ['javascript', 'else-if', 'ranges'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'switch-statements', topicKey: 'conditions-decisions', title: 'Using switch for Known Cases', difficulty: 'beginner',
    theory: [
      'A switch statement is useful when one expression is compared with several known values. It can make a list of fixed cases easier to scan than a long chain of equality checks. Common examples include status values, menu commands, user roles, and known action types.',
      'Each case compares against the switch expression using strict matching. break normally stops execution after that case. Without break, execution can continue into the next case, which is called fall-through. Fall-through can be intentional, but accidental fall-through is a common bug.',
      'The default case handles values that did not match any listed case. It plays a role similar to the final else in an if chain. A switch is not automatically better than if; use it when the problem is naturally “one value, many fixed cases.”',
      'If several cases need exactly the same outcome, you can stack cases before one shared block. If the logic depends on ranges or complex boolean expressions instead of fixed equality cases, if/else is usually clearer.'
    ],
    codeExample: `const status = 'reviewing';\n\nswitch (status) {\n  case 'submitted':\n    console.log('Waiting for review');\n    break;\n  case 'reviewing':\n    console.log('Review in progress');\n    break;\n  default:\n    console.log('Unknown status');\n}`, 
    codeExplanation: 'The value matches the reviewing case, its message prints, and break exits the switch.',
    commonMistakes: ['Forgetting break and causing accidental fall-through.', 'Using switch for numeric ranges that are clearer with comparisons.', 'Forgetting a default case when unexpected data should be handled.'],
    interviewDefinition: 'switch selects a branch by comparing one expression against fixed case values.',
    interviewQuestion: 'What happens if break is omitted from a matching switch case?', interviewAnswer: 'Execution can continue into following cases until a break, return, or the end of the switch is reached.',
    interviewChecklist: ['Explains fixed case matching', 'Mentions break', 'Mentions default or fall-through'],
    practiceTask: 'Use switch to map a user role of learner, mentor, or admin to a readable label.',
    knowledgeCheck: { type: 'mcq', question: 'When is switch usually clearer?', options: ['One value maps to several fixed cases', 'Every branch uses unrelated numeric ranges', 'There is no condition at all'], correctAnswer: 'One value maps to several fixed cases', explanation: 'switch is designed around matching one expression against known case values.' },
    tags: ['javascript', 'switch', 'conditions'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'ternary-nullish-guards', topicKey: 'conditions-decisions', title: 'Ternary Expressions, Nullish Defaults and Guard Clauses', difficulty: 'beginner',
    theory: [
      'JavaScript provides shorter tools for common decision patterns. The ternary operator condition ? valueA : valueB chooses between two expression results. It is useful for short assignments or returned values, but nested ternaries quickly become difficult to read and should usually become normal if statements.',
      'The nullish coalescing operator ?? provides a fallback only when the left side is null or undefined. This differs from ||, which falls back for every falsy value including 0, false, and an empty string. If those values are valid application data, ?? preserves them correctly.',
      'A guard clause handles an invalid or exceptional case early, often by returning from a function. This keeps the normal path less nested. For example, a price-calculation function can immediately reject a negative amount before doing any business calculation.',
      'These tools are not shortcuts for avoiding thought. Choose the form that makes the rule easiest to understand. Simple two-value expression: ternary. Missing null/undefined fallback: ??. Exceptional case that should stop a function: guard clause.'
    ],
    codeExample: `function shippingCost(total, savedPreference) {\n  if (total < 0) return null;\n  const method = savedPreference ?? 'standard';\n  return total >= 1000 ? 0 : method === 'express' ? 120 : 60;\n}`, 
    codeExplanation: 'The guard rejects invalid totals. ?? preserves valid non-null preferences. The outer ternary handles a compact two-path cost decision, though a deeply nested ternary should be avoided.',
    commonMistakes: ['Using || when 0, false, or an empty string should be preserved.', 'Nesting multiple ternaries until the logic is difficult to read.', 'Using guard clauses without returning or otherwise stopping the invalid path.'],
    interviewDefinition: 'A ternary chooses between two expression values, ?? falls back only for null or undefined, and a guard clause exits early for an exceptional case.',
    interviewQuestion: 'How does ?? differ from ||?', interviewAnswer: '?? uses the fallback only for null or undefined, while || uses it for any falsy value.',
    interviewChecklist: ['Explains ternary purpose', 'Distinguishes ?? from ||', 'Explains early-return guard clauses'],
    practiceTask: 'Write formatDisplayName(name) that returns "Guest" only for null or undefined, while preserving an intentionally empty string.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `console.log(0 ?? 10);`, correctAnswer: '0', explanation: '0 is not null or undefined, so ?? keeps it.' },
    tags: ['javascript', 'ternary', 'nullish', 'guard-clauses'], estimatedMinutes: 50
  }),

  makeLesson({
    key: 'for-loop', topicKey: 'loops-repetition', title: 'The for Loop and Counting Repetition', difficulty: 'beginner',
    theory: [
      'A loop repeats a block of code. A for loop is especially useful when you know how a counter should start, when repetition should stop, and how the counter should change after each iteration. All three parts are visible in the loop header.',
      'The common form for (let i = 0; i < limit; i += 1) begins with i at 0, checks i < limit before every iteration, and increases i after each completed iteration. Because arrays use zero-based indexes, this structure often works naturally with array positions.',
      'The stopping condition is critical. If the condition never becomes false, the loop can run forever. If the condition stops one step too early or too late, you get an off-by-one bug. Before running a loop, trace the first value, last expected value, and the point where the condition becomes false.',
      'Use a for loop when the counter itself matters. Later, for...of and array methods will be clearer when you only need each value rather than its numeric index.'
    ],
    codeExample: `for (let i = 1; i <= 3; i += 1) {\n  console.log('Lesson', i);\n}`, 
    codeExplanation: 'The loop starts at 1, runs while i is at most 3, and increments after each iteration, so it prints three lines.',
    commonMistakes: ['Using <= when < is required for an array length and reading past the last index.', 'Changing the loop counter incorrectly.', 'Writing a stopping condition that never becomes false.'],
    interviewDefinition: 'A for loop repeats a block while managing initialization, a stopping condition, and an update step in one structure.',
    interviewQuestion: 'What are the three common parts of a for-loop header?', interviewAnswer: 'Initialization, the continuation condition, and the update expression.',
    interviewChecklist: ['Names initialization', 'Names condition', 'Names update step'],
    practiceTask: 'Use a for loop to print the numbers 1 through 10 and then the even numbers from 2 through 20.',
    knowledgeCheck: { type: 'code_output', question: 'How many times does the loop run?', codeSnippet: `for (let i = 0; i < 4; i += 1) { console.log(i); }`, correctAnswer: '4', explanation: 'The valid values are 0, 1, 2, and 3.' },
    tags: ['javascript', 'loops', 'for'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'while-do-while', topicKey: 'loops-repetition', title: 'while and do...while Loops', difficulty: 'beginner',
    theory: [
      'A while loop is useful when repetition depends on a changing condition and you do not naturally know the number of iterations in advance. JavaScript checks the condition before each iteration. If the condition is false at the beginning, the body may never run.',
      'A do...while loop checks its condition after the body, so the body always runs at least once. This can fit interactions where one attempt must happen before deciding whether to repeat, although ordinary while loops are more common in application code.',
      'Because the loop header does not automatically update a counter, the body must eventually change something that affects the condition. Forgetting that update is a common cause of infinite loops. Trace what value is supposed to move the program toward termination.',
      'Choose while when the stopping rule is easier to describe as “keep going while this condition remains true.” Use for when initialization and a regular counter update are central to the problem.'
    ],
    codeExample: `let retries = 0;\nwhile (retries < 3) {\n  console.log('Attempt', retries + 1);\n  retries += 1;\n}`, 
    codeExplanation: 'retries starts below 3 and increases every iteration, so the condition eventually becomes false.',
    commonMistakes: ['Forgetting to update the value used by the while condition.', 'Using do...while without realizing the body always executes once.', 'Choosing while when a simple counted for loop would be clearer.'],
    interviewDefinition: 'while checks a condition before each iteration; do...while checks after the body and therefore executes at least once.',
    interviewQuestion: 'What is the main difference between while and do...while?', interviewAnswer: 'while may execute zero times, while do...while executes the body at least once before checking the condition.',
    interviewChecklist: ['Explains condition timing', 'Mentions at-least-once behavior', 'Mentions termination/update'],
    practiceTask: 'Use a while loop to simulate up to three login attempts, increasing an attempt counter each time.',
    knowledgeCheck: { type: 'mcq', question: 'Which loop guarantees its body runs at least once?', options: ['do...while', 'while', 'for...of'], correctAnswer: 'do...while', explanation: 'do...while evaluates the condition after the first body execution.' },
    tags: ['javascript', 'while', 'do-while'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'for-of-break-continue', topicKey: 'loops-repetition', title: 'for...of, break and continue', difficulty: 'beginner',
    theory: [
      'for...of iterates directly over values from an iterable such as an array or string. When you only need each value, it is often clearer than managing a numeric index manually. The loop variable receives the next value on every iteration.',
      'break stops the loop completely. It is useful when you have found the needed value or reached a condition where further work is unnecessary. continue skips the rest of the current iteration and moves to the next value.',
      'These control statements should make the stopping or skipping rule clearer. Too many breaks and continues can make a loop hard to trace. A simple guard with continue is often useful for ignoring invalid values before the main work of the iteration.',
      'Do not confuse for...of with for...in. for...of gives iterable values. for...in iterates enumerable property keys and is usually not the right choice for ordinary array values.'
    ],
    codeExample: `const scores = [72, 45, 91, 66];\nfor (const score of scores) {\n  if (score < 60) continue;\n  console.log('Passed:', score);\n  if (score >= 90) break;\n}`, 
    codeExplanation: 'Failing scores are skipped. When a score of at least 90 is reached, the loop stops completely.',
    commonMistakes: ['Using for...in when array values are wanted.', 'Using continue when break is needed, or the reverse.', 'Adding several control statements that make the loop difficult to follow.'],
    interviewDefinition: 'for...of iterates values; continue skips the current iteration and break exits the loop.',
    interviewQuestion: 'How do break and continue differ?', interviewAnswer: 'break exits the loop entirely, while continue skips only the rest of the current iteration.',
    interviewChecklist: ['Explains for...of values', 'Defines break', 'Defines continue'],
    practiceTask: 'Loop through transaction amounts, skip zero values, and stop if a negative amount is found.',
    knowledgeCheck: { type: 'short_answer', question: 'Which keyword exits a loop completely?', correctAnswer: 'break', explanation: 'break stops the nearest loop immediately.' },
    tags: ['javascript', 'for-of', 'break', 'continue'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'choosing-loops', topicKey: 'loops-repetition', title: 'Choosing the Right Loop and Avoiding Infinite Loops', difficulty: 'beginner',
    theory: [
      'Different loop forms solve different shapes of repetition. Use for when an index or counted number of iterations matters. Use for...of when you mainly need each value from an iterable. Use while when the repetition depends on a condition whose update does not fit a simple counter pattern.',
      'An infinite loop happens when the program never reaches a state where the continuation condition becomes false. In a browser, this can freeze the page because the JavaScript thread remains busy. The safest habit is to identify the changing value and the termination condition before writing the loop body.',
      'Loops can also be technically finite but inefficient. Repeating expensive work unnecessarily makes applications slower. Later, array methods can express common transformations more clearly, but they still perform iteration under the hood, so understanding loops helps you reason about the cost.',
      'Before finalizing a loop, test an empty input, one-item input, the normal case, and the stopping boundary. Those simple tests catch many mistakes in counters and conditions.'
    ],
    codeExample: `function findFirstNegative(values) {\n  for (const value of values) {\n    if (value < 0) return value;\n  }\n  return null;\n}\n\nconsole.log(findFirstNegative([3, 8, -2, 5]));`,
    codeExplanation: 'for...of is chosen because only the values matter. Returning immediately stops the function as soon as the first negative value is found.',
    commonMistakes: ['Writing a loop before identifying how it will terminate.', 'Using a numeric index when only values are needed.', 'Ignoring empty collections and boundary cases during testing.'],
    interviewDefinition: 'Choose a loop based on whether you need a counter, iterable values, or a condition-driven repetition rule, and always ensure the loop can reach termination.',
    interviewQuestion: 'What commonly causes an infinite loop?', interviewAnswer: 'The loop condition never becomes false, often because the value controlling that condition is never updated correctly.',
    interviewChecklist: ['Mentions loop-selection criteria', 'Explains termination', 'Gives an infinite-loop cause'],
    practiceTask: 'Rewrite one index-based array loop using for...of and explain why the new version is clearer.',
    knowledgeCheck: { type: 'mcq', question: 'Which loop is often clearest when you only need each array value?', options: ['for...of', 'for...in', 'do...while in every case'], correctAnswer: 'for...of', explanation: 'for...of directly provides array values without manual index management.' },
    tags: ['javascript', 'loops', 'infinite-loop'], estimatedMinutes: 50
  })
];
