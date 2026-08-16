import { makeLesson } from './lessonFactory.js';

export const javascriptProgrammingLessons = [
  makeLesson({
    key: 'function-purpose-declarations', topicKey: 'functions', title: 'Why Functions Matter and Function Declarations', difficulty: 'beginner',
    theory: [
      'A function groups a set of instructions under a name so that the same behavior can be used again. Without functions, a program often repeats the same steps in several places. Repetition makes changes risky because every copy must be updated consistently. A well-named function creates one place for that behavior and gives the rest of the program a simple way to ask for it.',
      'A function declaration begins with the function keyword, followed by a name, parentheses, and a block. The code inside the block does not run when the function is declared. It runs when the function is called. This separation between defining behavior and using behavior is one of the most important ideas in programming.',
      'Functions should usually have one clear responsibility. calculateTax is easier to understand and test than a large function that calculates tax, updates the DOM, saves data, sends a request, and prints a report. Small responsibilities also make later reuse easier.',
      'Function declarations have a useful hoisting behavior: the function can be called before its declaration appears in the source file. We will explain hoisting carefully in the Scope and Hoisting topic. For now, focus on the basic pattern of defining a named behavior and calling it when needed.'
    ],
    codeExample: `function greetLearner(name) {\n  console.log('Welcome, ' + name);\n}\n\ngreetLearner('Asha');\ngreetLearner('Ravi');`,
    codeExplanation: 'The function is defined once and called twice with different values. Each call runs the body using the provided name.',
    commonMistakes: ['Writing repeated blocks instead of extracting one reusable function.', 'Expecting a function body to run just because the function was declared.', 'Giving a function a vague name that does not describe its responsibility.'],
    interviewDefinition: 'A function is a reusable block of behavior that can be called by name and can receive inputs and produce outputs.',
    interviewQuestion: 'Why are functions useful in application code?', interviewAnswer: 'They group reusable behavior, reduce duplication, and give a clear name to one responsibility.',
    interviewChecklist: ['Defines reusable behavior', 'Mentions reducing duplication', 'Mentions clear responsibility'],
    practiceTask: 'Create greetLearner(name) and call it for three different names.',
    knowledgeCheck: { type: 'mcq', question: 'When does the body of a normal function declaration run?', options: ['When the function is called', 'Immediately when the file is parsed', 'Only when a variable is declared'], correctAnswer: 'When the function is called', explanation: 'Declaring a function defines the behavior; calling it executes that behavior.' },
    tags: ['javascript', 'functions', 'declarations'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'parameters-arguments-return', topicKey: 'functions', title: 'Parameters, Arguments and Return Values', difficulty: 'beginner',
    theory: [
      'Functions become more useful when they can work with different inputs. Parameters are names listed in the function definition. Arguments are the actual values supplied when the function is called. Inside the function, the parameters behave like local variables containing those argument values.',
      'A function can send a result back to its caller with return. As soon as return runs, the function stops and the returned value becomes the result of the function call. Returning a value is different from printing it. console.log shows information, while return makes a value available to other code for further calculation.',
      'Try to make inputs and outputs clear. A function such as calculateTotal(subtotal, taxRate) communicates what information it needs. The caller can store the returned result, pass it to another function, or display it later. This separation is much easier to reuse than a function that always prints directly.',
      'If no return statement runs, the function result is undefined. That is normal for functions whose job is a side effect, such as logging or updating a page, but calculation functions usually become easier to compose when they return their result explicitly.'
    ],
    codeExample: `function calculateTax(amount, rate) {\n  return amount * rate;\n}\n\nconst tax = calculateTax(1000, 0.18);\nconsole.log(tax);`,
    codeExplanation: 'amount and rate are parameters. 1000 and 0.18 are arguments. return sends the calculated value back to the caller, which stores it in tax.',
    commonMistakes: ['Confusing parameter names with argument values.', 'Using console.log when the caller actually needs a returned value.', 'Writing code after an unconditional return and expecting it to run.'],
    interviewDefinition: 'Parameters describe function inputs, arguments are the supplied values, and return sends a result back to the caller.',
    interviewQuestion: 'How is return different from console.log?', interviewAnswer: 'return produces the function result for other code to use; console.log only displays a value.',
    interviewChecklist: ['Defines parameter', 'Defines argument', 'Explains return value'],
    practiceTask: 'Write calculateFinalPrice(price, discountRate) that returns the discounted price and print the returned result outside the function.',
    knowledgeCheck: { type: 'short_answer', question: 'What does a JavaScript function return when no return statement runs?', correctAnswer: 'undefined', explanation: 'Functions without an executed return statement produce undefined.' },
    tags: ['javascript', 'parameters', 'arguments', 'return'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'function-expressions-first-class', topicKey: 'functions', title: 'Function Expressions and Functions as Values', difficulty: 'beginner',
    theory: [
      'JavaScript treats functions as values. A function can be stored in a variable, placed in an object, passed to another function, or returned from a function. This property is often described by saying functions are first-class values. It is the foundation for callbacks and higher-order functions later in the course.',
      'A function expression creates a function as part of an expression and usually stores it in a variable. Unlike a normal function declaration, the variable holding the expression follows normal variable initialization rules. If the variable uses const, the function cannot be called through that variable before the declaration has been initialized.',
      'Function expressions are useful when behavior should be assigned to a variable, passed around, or created conditionally. A named declaration is often clearer for a main reusable function, while expressions are common for callbacks and smaller local behavior. Neither style is universally better; choose the one that communicates intent.',
      'The important learning step is to stop thinking of functions only as special blocks. In JavaScript, a function is also a value. Once that becomes comfortable, later patterns such as event handlers, array callbacks, and Promise handlers make much more sense.'
    ],
    codeExample: `const formatName = function (name) {\n  return name.trim().toUpperCase();\n};\n\nconst formatter = formatName;\nconsole.log(formatter('  asha '));`,
    codeExplanation: 'The function value is stored in formatName, then the same function reference is copied into formatter and called through that new variable.',
    commonMistakes: ['Calling a const function expression before its declaration is initialized.', 'Thinking a function stops being callable when stored in another variable.', 'Using an anonymous expression everywhere when a meaningful function name would improve debugging.'],
    interviewDefinition: 'JavaScript functions are first-class values, so they can be stored, passed, and returned like other values.',
    interviewQuestion: 'What does it mean that functions are first-class values?', interviewAnswer: 'It means functions can be assigned to variables, passed as arguments, returned from functions, and stored in data structures.',
    interviewChecklist: ['Mentions assignment', 'Mentions passing as arguments', 'Mentions returning or storing functions'],
    practiceTask: 'Store a function in one variable, copy it to another variable, and call it through both names.',
    knowledgeCheck: { type: 'mcq', question: 'Which statement is true about JavaScript functions?', options: ['They can be stored in variables', 'They cannot be passed to other functions', 'They only exist as declarations'], correctAnswer: 'They can be stored in variables', explanation: 'Functions are first-class values in JavaScript.' },
    tags: ['javascript', 'function-expression', 'first-class-functions'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'defaults-rest-arrow', topicKey: 'functions', title: 'Default Parameters, Rest Parameters and Arrow Functions', difficulty: 'beginner',
    theory: [
      'Default parameters provide a value when an argument is omitted or explicitly undefined. They make common defaults visible directly in the function signature. For example, calculateTax(amount, rate = 0.18) clearly communicates the normal tax rate while still allowing callers to provide another rate.',
      'A rest parameter uses ... before the final parameter name and collects remaining arguments into a real array. This is useful when a function accepts a variable number of values. Rest syntax gathers many arguments into one array; later, spread syntax will do the opposite by expanding values from an iterable or object.',
      'Arrow functions provide a shorter function syntax. A small expression can be returned implicitly, while a block body uses an explicit return. Arrow functions are especially common for callbacks. They also handle this differently from normal functions by capturing it from the surrounding lexical scope, which becomes important in the advanced this topic.',
      'Do not choose arrow functions only because they are shorter. Use the syntax that makes the behavior easiest to understand. Normal functions remain useful for declarations and methods that need their own dynamic this, while arrows are excellent for compact callback behavior.'
    ],
    codeExample: `const totalWithTax = (amount, rate = 0.18) => amount * (1 + rate);\n\nfunction sum(...values) {\n  return values.reduce((total, value) => total + value, 0);\n}\n\nconsole.log(totalWithTax(500));\nconsole.log(sum(10, 20, 30));`,
    codeExplanation: 'The arrow function uses a default rate and implicit return. The regular function gathers any number of arguments into the values array with rest syntax.',
    commonMistakes: ['Confusing rest syntax, which collects values, with spread syntax, which expands them.', 'Forgetting return when an arrow uses a block body.', 'Using an arrow as an object method before understanding its lexical this behavior.'],
    interviewDefinition: 'Default parameters provide fallback inputs, rest parameters collect remaining arguments into an array, and arrow functions provide concise lexical-this function syntax.',
    interviewQuestion: 'What is the difference between rest and spread syntax?', interviewAnswer: 'Rest collects multiple values into one array-like parameter, while spread expands values into another expression.',
    interviewChecklist: ['Explains defaults', 'Explains rest collection', 'Explains arrow function purpose or lexical this'],
    practiceTask: 'Create average(...scores) using a rest parameter and an arrow helper that rounds the result.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `const add = (a, b = 2) => a + b;\nconsole.log(add(3));`, correctAnswer: '5', explanation: 'b uses its default value of 2 because no second argument was supplied.' },
    tags: ['javascript', 'default-parameters', 'rest', 'arrow-functions'], estimatedMinutes: 55
  }),

  makeLesson({
    key: 'global-function-block-scope', topicKey: 'scope-hoisting', title: 'Global, Function and Block Scope', difficulty: 'beginner',
    theory: [
      'Scope answers one question: where can a name be accessed? A variable declared outside functions and blocks may be in a broad or global scope. A variable declared inside a function is normally available only inside that function. let and const declared inside a block are available only inside that block.',
      'Keeping values in the smallest useful scope reduces accidental interference. A temporary loop value should not become global. A calculation used by one function usually belongs inside that function. Smaller scopes make it easier to understand which code can change or depend on a value.',
      'Functions create their own scope, and blocks created by if statements, loops, or standalone braces create block scope for let and const. var behaves differently because it is function-scoped, which is one reason modern code usually prefers let and const.',
      'When JavaScript cannot find a name in the current scope, it can look outward through surrounding lexical scopes. That lookup rule is the subject of the next lesson. For now, practice identifying where each variable begins and where it stops being available.'
    ],
    codeExample: `const appName = 'CodeMentor';\n\nfunction showMessage() {\n  const message = 'Learning JavaScript';\n  if (true) {\n    const icon = '✓';\n    console.log(appName, message, icon);\n  }\n}`, 
    codeExplanation: 'The block can see names from the function and outer scope. Code outside the block cannot see icon, and code outside the function cannot see message.',
    commonMistakes: ['Creating globals for values that only one function needs.', 'Expecting block-scoped let or const values outside their braces.', 'Assuming var follows the same block-scope rule as let.'],
    interviewDefinition: 'Scope determines where an identifier is visible; JavaScript has global, function, and block scopes.',
    interviewQuestion: 'What is block scope?', interviewAnswer: 'A block-scoped binding declared with let or const is available only within the block where it was declared and its nested scopes.',
    interviewChecklist: ['Defines scope', 'Mentions function scope', 'Mentions block scope for let/const'],
    practiceTask: 'Write nested blocks and predict which of three variables are available on each line before running the code.',
    knowledgeCheck: { type: 'short_answer', question: 'Which modern declaration keywords are block-scoped?', correctAnswer: 'let and const', explanation: 'let and const belong to their nearest block scope.' },
    tags: ['javascript', 'scope', 'block-scope', 'function-scope'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'lexical-scope-lookup', topicKey: 'scope-hoisting', title: 'Lexical Scope and How JavaScript Finds Variables', difficulty: 'beginner',
    theory: [
      'Lexical scope means that variable access is determined by where code is written in the source structure. When a function uses a name that is not local, JavaScript looks in the surrounding scope where that function was defined, then continues outward until it finds the name or reaches the outermost scope.',
      'This is easier to understand by picturing nested boxes. The inner box can look outward to its parent boxes, but an outer box cannot automatically reach into a child box. A nested function can use variables from its containing function, while the containing function cannot access variables declared only inside the nested function.',
      'Lexical lookup is different from asking which function called which function. The location where a function is defined determines its surrounding lexical environment. This becomes the foundation of closures later, where a function continues to access outer variables even after the outer function has returned.',
      'Avoid relying on too many distant outer variables because hidden dependencies make functions harder to test. Lexical access is powerful, but explicit parameters are often clearer when a function should receive information from its caller.'
    ],
    codeExample: `const app = 'CodeMentor';\nfunction buildGreeting(user) {\n  const prefix = 'Welcome';\n  function format() {\n    return prefix + ', ' + user + ' to ' + app;\n  }\n  return format();\n}`, 
    codeExplanation: 'format finds prefix and user in its containing function and app in the outer scope. Those names are available because of lexical nesting.',
    commonMistakes: ['Thinking variable lookup is based on which function called another function.', 'Trying to access an inner function local variable from an outer scope.', 'Depending on many globals when parameters would make dependencies clearer.'],
    interviewDefinition: 'Lexical scope means identifier lookup follows the nested structure where functions and blocks are defined.',
    interviewQuestion: 'How does a nested function find a variable that is not local?', interviewAnswer: 'JavaScript searches the surrounding lexical scopes from the function definition outward until it finds the binding or reaches the outermost scope.',
    interviewChecklist: ['Defines lexical scope', 'Explains outward lookup', 'Separates lexical structure from call order'],
    practiceTask: 'Create three nested scopes and write down the lookup path for one variable used in the innermost function.',
    knowledgeCheck: { type: 'mcq', question: 'What primarily determines a function’s lexical scope?', options: ['Where the function is defined', 'Where the function is called', 'The value returned by the function'], correctAnswer: 'Where the function is defined', explanation: 'Lexical scope follows the source-code nesting structure.' },
    tags: ['javascript', 'lexical-scope', 'scope-chain'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'hoisting-rules', topicKey: 'scope-hoisting', title: 'Hoisting: Declarations, Functions and Variables', difficulty: 'beginner',
    theory: [
      'Hoisting is a common name for how JavaScript prepares declarations before executing the statements in a scope. It does not mean the source code is physically moved. Instead, different declarations become known to the scope during its setup phase according to different rules.',
      'Function declarations are available before the line where they appear, so calling a declared function earlier in the same scope can work. var declarations are also registered early and initialized to undefined, which means reading them before the declaration line produces undefined rather than a ReferenceError.',
      'let and const bindings are also known to their scope before the declaration line, but they are not initialized for normal access until execution reaches the declaration. That period is called the temporal dead zone and is covered separately in the next lesson.',
      'The safest coding style is not to rely on surprising hoisting behavior. Declare variables before using them and place important function definitions where readers can easily find them. Understanding hoisting helps you explain existing behavior; clear source order helps you avoid needing that explanation.'
    ],
    codeExample: `greet();\nfunction greet() {\n  console.log('Hello');\n}\n\nconsole.log(oldValue);\nvar oldValue = 10;`,
    codeExplanation: 'The function declaration is callable before its source line. The var binding exists earlier with the value undefined, so the log prints undefined before assignment.',
    commonMistakes: ['Saying JavaScript physically moves declarations to the top of the file.', 'Assuming all declaration forms behave identically before their source line.', 'Using hoisting as a reason to write variables far from where they are initialized.'],
    interviewDefinition: 'Hoisting describes how declarations are registered during scope setup before normal statement execution, with different initialization rules for functions, var, let, and const.',
    interviewQuestion: 'What value does a var binding have before its assignment line runs?', interviewAnswer: 'It is initialized to undefined during scope setup.',
    interviewChecklist: ['Explains preparation rather than physical movement', 'Mentions function declaration behavior', 'Mentions var initialized to undefined'],
    practiceTask: 'Predict a small script using a function declaration, var, and let before running it, then explain each result.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed by the first line?', codeSnippet: `console.log(value);\nvar value = 5;`, correctAnswer: 'undefined', explanation: 'The var binding is created and initialized to undefined before the assignment executes.' },
    tags: ['javascript', 'hoisting', 'var', 'functions'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'tdz-shadowing', topicKey: 'scope-hoisting', title: 'Temporal Dead Zone, Shadowing and Safe Scope Habits', difficulty: 'beginner',
    theory: [
      'A let or const binding exists in its scope from the beginning of the block, but it cannot be accessed before execution reaches its declaration. The interval before initialization is called the temporal dead zone, or TDZ. Accessing the binding during this period throws a ReferenceError instead of returning undefined.',
      'Shadowing happens when an inner scope declares a new binding with the same name as an outer binding. Inside the inner scope, the nearer binding is used. Shadowing is legal in many cases, but repeated use of the same name can make code difficult to read because a reader must keep track of which binding each line refers to.',
      'The TDZ helps catch accidental early access, while block scope helps contain temporary values. These rules are stricter than older var behavior, and that strictness is useful because mistakes become visible earlier instead of silently producing undefined.',
      'Safe scope habits are simple: declare values before using them, keep declarations near the code that needs them, avoid unnecessary shadowing, and prefer meaningful names when two scopes represent different concepts.'
    ],
    codeExample: `const status = 'outer';\nif (true) {\n  const status = 'inner';\n  console.log(status);\n}\nconsole.log(status);`,
    codeExplanation: 'The inner const shadows the outer one only inside the block. After the block, the outer status is visible again.',
    commonMistakes: ['Accessing let or const before initialization.', 'Using the same variable name in many nested scopes and confusing readers.', 'Assuming shadowing changes the outer variable.'],
    interviewDefinition: 'The TDZ is the period before a let or const binding is initialized; shadowing occurs when an inner binding uses the same name as an outer one.',
    interviewQuestion: 'What happens when let is accessed during its temporal dead zone?', interviewAnswer: 'JavaScript throws a ReferenceError because the binding has not been initialized for access yet.',
    interviewChecklist: ['Defines TDZ', 'Mentions ReferenceError', 'Explains shadowing'],
    practiceTask: 'Create one safe shadowing example, then rename the inner variable to show how naming can improve clarity.',
    knowledgeCheck: { type: 'short_answer', question: 'What error type is thrown when a let binding is accessed in the TDZ?', correctAnswer: 'ReferenceError', explanation: 'The binding exists but is not initialized for access yet.' },
    tags: ['javascript', 'tdz', 'shadowing', 'scope'], estimatedMinutes: 55
  }),

  makeLesson({
    key: 'array-basics', topicKey: 'arrays', title: 'Creating Arrays and Accessing Items', difficulty: 'beginner',
    theory: [
      'An array stores an ordered collection of values. Lists of scores, products, messages, or user records are common examples. Arrays can contain any JavaScript values, although application code is usually easier to understand when one array represents one consistent kind of data.',
      'Array positions are called indexes and start at 0. The first item is array[0], the second is array[1], and the last valid index is array.length - 1. Reading an index that does not exist returns undefined rather than automatically throwing an error.',
      'The length property tells you how many positions the array currently contains. Because length is one greater than the final index in a normal dense array, loops often use i < array.length as their stopping condition.',
      'Arrays are objects under the hood, but they provide specialized methods for ordered collections. Use Array.isArray(value) when you need to check whether a value is specifically an array.'
    ],
    codeExample: `const topics = ['Variables', 'Functions', 'Arrays'];\nconsole.log(topics[0]);\nconsole.log(topics[topics.length - 1]);\nconsole.log(topics.length);`,
    codeExplanation: 'Index 0 reads the first item, length - 1 reads the final valid item, and length reports the number of items.',
    commonMistakes: ['Using index 1 for the first item.', 'Using array.length as if it were the final valid index.', 'Checking arrays with typeof value === "array".'],
    interviewDefinition: 'An array is an ordered, zero-indexed JavaScript collection with a length property and array-specific methods.',
    interviewQuestion: 'What is the index of the last item in a normal non-empty array?', interviewAnswer: 'array.length - 1.',
    interviewChecklist: ['Mentions ordered collection', 'Mentions zero-based indexing', 'Explains length'],
    practiceTask: 'Create a five-item array and print the first, third, and last values without hard-coding the last index.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `const values = ['a', 'b', 'c'];\nconsole.log(values[2]);`, correctAnswer: 'c', explanation: 'Index 2 is the third item because indexes start at zero.' },
    tags: ['javascript', 'arrays', 'indexing'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'array-add-remove', topicKey: 'arrays', title: 'Adding and Removing Array Items', difficulty: 'beginner',
    theory: [
      'Arrays can change after creation. push adds one or more items to the end, and pop removes and returns the final item. unshift adds to the beginning, while shift removes and returns the first item. These methods mutate the original array.',
      'Mutation means the same array object is changed rather than a separate array being returned. Mutation is not automatically wrong. A local array used by one small piece of code may be safely mutated. Problems appear when several parts of an application share the same array and one part changes it unexpectedly.',
      'push and pop are often easier to reason about than repeatedly adding or removing from the beginning because beginning operations may require existing items to be reindexed. Performance differences are not usually important in small learning examples, but the data-structure behavior is useful to know.',
      'Always pay attention to the return value. push returns the new length, while pop returns the removed item. If you need the changed array itself, you already have it through the original variable.'
    ],
    codeExample: `const queue = ['Asha', 'Ravi'];\nqueue.push('Neha');\nconst last = queue.pop();\nconsole.log(queue, last);`,
    codeExplanation: 'push mutates queue by adding Neha. pop removes that same final value and returns it in last.',
    commonMistakes: ['Expecting push to return the array instead of the new length.', 'Forgetting that shift/unshift/push/pop mutate the original array.', 'Calling pop on an empty array and assuming a value will exist.'],
    interviewDefinition: 'push/pop modify the end of an array, while unshift/shift modify the beginning; these methods mutate the original array.',
    interviewQuestion: 'What does Array.prototype.push return?', interviewAnswer: 'It returns the new length of the array.',
    interviewChecklist: ['Explains end methods', 'Explains beginning methods', 'Mentions mutation'],
    practiceTask: 'Model a small waiting list using push and shift, then print the person who was served.',
    knowledgeCheck: { type: 'short_answer', question: 'Which method removes the last array item and returns it?', correctAnswer: 'pop', explanation: 'pop mutates the array by removing its final item and returns that item.' },
    tags: ['javascript', 'arrays', 'push', 'pop', 'shift', 'unshift'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'slice-splice', topicKey: 'arrays', title: 'slice, splice and Copying Array Sections', difficulty: 'beginner',
    theory: [
      'slice and splice have similar names but very different behavior. slice returns a shallow copy of a selected portion of an array and does not change the source array. It is useful when you need a range of items or a shallow array copy.',
      'splice changes the original array. It can remove items, insert items, or do both at a chosen index. Because it mutates the source, it is powerful but should be used intentionally. The return value is an array containing the removed items.',
      'A useful memory rule is that slice is non-mutating while splice changes the source. Still, do not rely only on a memory trick—check which result your problem needs. If shared application state should remain unchanged, a non-mutating approach is often safer.',
      'Both methods use index positions and an end/count rule that should be read carefully. slice(start, end) stops before end. splice(start, deleteCount, ...items) uses a count rather than an ending index.'
    ],
    codeExample: `const values = ['a', 'b', 'c', 'd'];\nconst middle = values.slice(1, 3);\nconsole.log(middle, values);\n\nconst removed = values.splice(1, 1, 'B');\nconsole.log(removed, values);`,
    codeExplanation: 'slice returns b and c without changing values. splice removes one item at index 1, inserts B, and mutates values.',
    commonMistakes: ['Confusing slice and splice because of their names.', 'Expecting slice end index to be included.', 'Using splice on shared state without realizing it mutates the original array.'],
    interviewDefinition: 'slice returns a shallow copied section without mutation; splice mutates an array by removing or inserting items.',
    interviewQuestion: 'How do slice and splice differ?', interviewAnswer: 'slice is non-mutating and returns a selected copy, while splice changes the original array and returns removed items.',
    interviewChecklist: ['Defines slice', 'Defines splice', 'Mentions mutation difference'],
    practiceTask: 'Copy the middle three values from a five-item array using slice, then replace one original item using splice.',
    knowledgeCheck: { type: 'mcq', question: 'Which method does not mutate the source array?', options: ['slice', 'splice', 'push'], correctAnswer: 'slice', explanation: 'slice returns a shallow copied section and leaves the source unchanged.' },
    tags: ['javascript', 'arrays', 'slice', 'splice'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'array-search-loops', topicKey: 'arrays', title: 'Looping Through Arrays and Basic Searching', difficulty: 'beginner',
    theory: [
      'Before using higher-level array methods, it is valuable to solve array problems with loops. A loop lets you inspect each item, update a running result, stop when a match is found, or skip invalid entries. Understanding this process makes later methods such as find, filter, and reduce easier to understand rather than memorize.',
      'for...of is convenient when you only need each item. A classic for loop is useful when the index matters. The includes method performs a simple value membership check, while indexOf returns the first matching index for primitive equality cases.',
      'Searching should stop when further work is unnecessary. A function looking for the first match can return immediately when it finds one. This is both clear and efficient because the remaining items do not need to be checked.',
      'Arrays may be empty, so code should not assume an item always exists. Decide what your function should return when no match is found—often null, undefined, -1, or false depending on the API you are designing.'
    ],
    codeExample: `function findFirstPassing(scores) {\n  for (const score of scores) {\n    if (score >= 60) return score;\n  }\n  return null;\n}\n\nconsole.log(findFirstPassing([40, 55, 72, 90]));`,
    codeExplanation: 'The loop examines scores in order and returns 72 immediately when the first passing score is found.',
    commonMistakes: ['Continuing a search after the desired first result is already known.', 'Assuming an array is non-empty.', 'Using an index loop when the index has no purpose.'],
    interviewDefinition: 'Arrays can be processed with loops by visiting items in order, maintaining state, and stopping early when the result is known.',
    interviewQuestion: 'When is for...of clearer than a classic indexed for loop?', interviewAnswer: 'When you need the array values but do not need their numeric indexes.',
    interviewChecklist: ['Explains iterative processing', 'Mentions early exit', 'Distinguishes indexed loop from for...of'],
    practiceTask: 'Find the first negative number in an array with a loop and return null when none exists.',
    knowledgeCheck: { type: 'short_answer', question: 'What does indexOf return when no matching value is found?', correctAnswer: '-1', explanation: 'indexOf uses -1 to indicate no matching index exists.' },
    tags: ['javascript', 'arrays', 'loops', 'search'], estimatedMinutes: 50
  }),

  makeLesson({
    key: 'object-basics-properties', topicKey: 'objects', title: 'Creating Objects and Reading Properties', difficulty: 'beginner',
    theory: [
      'Objects group related values under property names. A user might have a name, email, role, and active status. Instead of keeping those values in unrelated variables, an object gives them one meaningful container. Object literals use curly braces with key-value pairs.',
      'Dot notation, such as user.name, is the clearest way to access a property when the property name is known in advance and is a normal identifier. Bracket notation, such as user[propertyName], is useful when the key is stored in a variable, contains special characters, or is calculated at runtime.',
      'Reading a missing property returns undefined. Adding a new property or assigning a new value to an existing property mutates the object. Whether that mutation is appropriate depends on how the object is shared, which we will study in the References and Copying topic.',
      'Property names should describe the data clearly. An object is not simply a bag for unrelated values; it should usually represent one concept, record, configuration, or entity so that its shape is understandable to other parts of the program.'
    ],
    codeExample: `const learner = {\n  name: 'Asha',\n  completedLessons: 12,\n  active: true\n};\n\nconsole.log(learner.name);\nconsole.log(learner['completedLessons']);`,
    codeExplanation: 'Both dot and bracket notation read properties from the same object. Bracket notation uses a string key.',
    commonMistakes: ['Using bracket notation with an unquoted literal name that is not a variable.', 'Assuming a missing property throws an error instead of returning undefined.', 'Grouping unrelated values into one object without a clear concept.'],
    interviewDefinition: 'An object is a collection of named properties used to group related data and behavior.',
    interviewQuestion: 'When is bracket notation useful for object properties?', interviewAnswer: 'When the property name is dynamic, stored in a variable, or cannot be written conveniently as a normal dot-notation identifier.',
    interviewChecklist: ['Defines object properties', 'Explains dot notation', 'Explains dynamic bracket access'],
    practiceTask: 'Create a course object and read one property with dot notation and another with a key stored in a variable.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `const user = { name: 'Ravi' };\nconst key = 'name';\nconsole.log(user[key]);`, correctAnswer: 'Ravi', explanation: 'Bracket notation evaluates key and uses its value as the property name.' },
    tags: ['javascript', 'objects', 'properties'], estimatedMinutes: 45
  }),
  makeLesson({
    key: 'object-methods', topicKey: 'objects', title: 'Object Methods and Behavior', difficulty: 'beginner',
    theory: [
      'An object can store functions as property values. A function associated with an object is commonly called a method. Methods let data and related behavior live together. For example, a cart object may store items and also provide a method that calculates how many items are present.',
      'When a normal method is called with object.method(), JavaScript can make the object available through this inside the method. At beginner level, use this only as a simple way to refer to another property on the same object. The exact rules for this are more subtle and are taught in a dedicated advanced topic.',
      'Methods should still have focused responsibilities. A user object method named displayName should not secretly change unrelated global data. Keeping behavior predictable makes objects easier to use and test.',
      'Arrow functions behave differently for this and are usually not a good default for methods that need the owning object as the receiver. You do not need to memorize that rule yet; simply use normal method syntax when the method needs this.'
    ],
    codeExample: `const course = {\n  title: 'Complete JavaScript',\n  completed: 8,\n  summary() {\n    return this.title + ': ' + this.completed + ' lessons completed';\n  }\n};\n\nconsole.log(course.summary());`,
    codeExplanation: 'summary is a method. Because it is called as course.summary(), this refers to course for this call.',
    commonMistakes: ['Using an arrow method when dynamic this is required.', 'Creating methods that unexpectedly mutate unrelated global state.', 'Forgetting to call a method with parentheses when its result is needed.'],
    interviewDefinition: 'An object method is a function stored on an object, usually representing behavior related to that object.',
    interviewQuestion: 'What is an object method?', interviewAnswer: 'It is a function stored as an object property and used to represent behavior related to that object.',
    interviewChecklist: ['Defines method as function property', 'Connects method to object behavior', 'Mentions this only if relevant'],
    practiceTask: 'Create a learner object with a describe() method that returns a sentence using two of its own properties.',
    knowledgeCheck: { type: 'mcq', question: 'Which value is an object method?', options: ['A function stored in an object property', 'Any string property', 'Only a global function'], correctAnswer: 'A function stored in an object property', explanation: 'Methods are functions associated with objects through properties.' },
    tags: ['javascript', 'objects', 'methods', 'this'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'nested-objects-safe-access', topicKey: 'objects', title: 'Nested Objects and Safe Access', difficulty: 'beginner',
    theory: [
      'Objects can contain other objects and arrays, allowing one value to represent structured application data. A user may contain a profile object, which contains an address object. This mirrors the shape of data returned by APIs and stored in databases.',
      'To reach a nested property, access each level in order. The challenge is that an intermediate value may be null or undefined. Trying to read a property from null or undefined throws an error. Before modern optional chaining, code often used repeated checks to guard every level.',
      'Optional chaining, written ?., stops the access and returns undefined when the value before it is null or undefined. We will study modern syntax later, but it is useful to see how nested object safety connects to the shape of your data.',
      'Do not make objects deeply nested without reason. Deep structures make updates and access more complicated. Use nesting when it represents a real relationship, and keep the shape consistent so callers know what properties may or may not exist.'
    ],
    codeExample: `const user = { profile: { address: { city: 'Pune' } } };\nconsole.log(user.profile.address.city);\nconsole.log(user.account?.settings?.theme);`,
    codeExplanation: 'The first chain exists completely. The second uses optional chaining, so a missing account returns undefined instead of throwing.',
    commonMistakes: ['Reading a property from null or undefined without a guard.', 'Creating unnecessarily deep structures.', 'Assuming optional chaining provides a default value instead of undefined.'],
    interviewDefinition: 'Nested objects represent structured relationships; optional chaining can safely stop property access when an intermediate value is null or undefined.',
    interviewQuestion: 'What problem does optional chaining solve when reading nested objects?', interviewAnswer: 'It prevents an error when an intermediate object is null or undefined and returns undefined instead.',
    interviewChecklist: ['Explains nested structure', 'Mentions missing intermediate values', 'Explains optional chaining behavior'],
    practiceTask: 'Create a nested learner.profile.address object and safely read an optional social profile that may not exist.',
    knowledgeCheck: { type: 'short_answer', question: 'What does optional chaining normally return when it encounters null or undefined?', correctAnswer: 'undefined', explanation: 'The chain short-circuits and produces undefined.' },
    tags: ['javascript', 'objects', 'nested-objects', 'optional-chaining'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'object-keys-values-entries', topicKey: 'objects', title: 'Object.keys, Object.values and Object.entries', difficulty: 'beginner',
    theory: [
      'Objects are not ordered lists in the same way arrays are, but applications often need to inspect their properties. Object.keys returns an array of own enumerable property names. Object.values returns the corresponding values. Object.entries returns an array of [key, value] pairs.',
      'Once the result is an array, normal loops and array methods can process it. Object.entries is especially useful when both the property name and value matter, such as rendering a configuration table or building a summary from category totals.',
      'These helpers do not mutate the source object. They create arrays representing the current enumerable own properties. Properties inherited through the prototype chain are not included, which becomes more meaningful when we study prototypes later.',
      'Choose the helper that matches the information you need. If only names matter, use keys. If only values matter, use values. If both matter, entries avoids repeatedly looking up the value from the key.'
    ],
    codeExample: `const scores = { javascript: 80, react: 72 };\nfor (const [topic, score] of Object.entries(scores)) {\n  console.log(topic, score);\n}`,
    codeExplanation: 'Object.entries produces key-value pairs, and array destructuring gives each pair readable local names in the loop.',
    commonMistakes: ['Expecting Object.keys to return values.', 'Assuming inherited prototype properties are included.', 'Using keys and then repeatedly performing lookups when entries already provides both pieces.'],
    interviewDefinition: 'Object.keys, Object.values, and Object.entries convert an object’s own enumerable properties into arrays of names, values, or key-value pairs.',
    interviewQuestion: 'What does Object.entries return?', interviewAnswer: 'An array of two-item arrays where each pair contains a property key and its value.',
    interviewChecklist: ['Explains keys', 'Explains values', 'Explains entries pairs'],
    practiceTask: 'Use Object.entries to print all keys and values from a settings object.',
    knowledgeCheck: { type: 'mcq', question: 'Which helper returns key-value pairs?', options: ['Object.entries', 'Object.keys', 'Object.values'], correctAnswer: 'Object.entries', explanation: 'Object.entries returns [key, value] pairs.' },
    tags: ['javascript', 'objects', 'object-entries'], estimatedMinutes: 45
  }),

  makeLesson({
    key: 'primitive-vs-reference-copy', topicKey: 'references-copying', title: 'Primitive Copies and Object References', difficulty: 'beginner',
    theory: [
      'When you assign one primitive value to another variable, the new binding receives that primitive value independently. Changing one binding later does not change the other. This is easy to observe with numbers, strings, and booleans.',
      'Objects and arrays behave differently. Variables hold references to those objects. Assigning one object variable to another copies the reference, so both variables can point to the same underlying object. A mutation through either reference becomes visible through the other.',
      'This does not mean the entire object is copied every time it is passed around. The shared reference is what allows several parts of a program to work with the same object. That can be useful, but it also means accidental mutation can affect code far away from the change.',
      'Understanding reference sharing is essential before using spread syntax, state-management patterns, or nested updates. When a bug seems to show an object changing “by itself,” check whether two variables actually refer to the same object.'
    ],
    codeExample: `let a = 10;\nlet b = a;\nb = 20;\n\nconst userA = { score: 10 };\nconst userB = userA;\nuserB.score = 20;\n\nconsole.log(a, userA.score);`,
    codeExplanation: 'The number copy is independent, so a stays 10. Both user variables reference the same object, so changing userB.score also changes what userA observes.',
    commonMistakes: ['Assuming object assignment creates a new object copy.', 'Explaining reference behavior as if variables literally contain full object copies.', 'Mutating a shared object without considering other references.'],
    interviewDefinition: 'Primitive assignments copy primitive values, while object assignments copy references to the same underlying object.',
    interviewQuestion: 'Why can changing objectB also appear to change objectA after objectB = objectA?', interviewAnswer: 'Because both variables hold references to the same object rather than independent object copies.',
    interviewChecklist: ['Distinguishes primitive copying', 'Explains shared object references', 'Connects mutation to shared visibility'],
    practiceTask: 'Demonstrate one primitive copy and one object reference copy, then explain the different results.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `const a = { n: 1 };\nconst b = a;\nb.n = 5;\nconsole.log(a.n);`, correctAnswer: '5', explanation: 'a and b reference the same object.' },
    tags: ['javascript', 'references', 'primitives', 'objects'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'mutation-shared-state', topicKey: 'references-copying', title: 'Mutation and Shared State', difficulty: 'beginner',
    theory: [
      'Mutation means changing an existing object or array rather than creating a replacement value. Setting user.name, pushing into an array, or sorting an array in place are all mutations. Mutation is a normal JavaScript capability and can be perfectly reasonable in small local code.',
      'The risk appears when the same object is shared by several parts of an application. One function may mutate it while another function assumes the old state still exists. The bug can be difficult to trace because the change and the unexpected result may happen in different files or times.',
      'A useful design question is ownership: which part of the program is responsible for changing this object? Local temporary data can often be mutated safely. Shared state benefits from clearer update rules and often from immutable update patterns where a new object is created.',
      'Do not label every mutation as bad. The goal is predictable behavior. Understand whether the value is shared, whether callers expect it to stay unchanged, and whether creating a new value would make the update easier to reason about.'
    ],
    codeExample: `function addItemMutating(cart, item) {\n  cart.items.push(item);\n}\n\nconst cart = { items: ['book'] };\naddItemMutating(cart, 'pen');\nconsole.log(cart.items);`,
    codeExplanation: 'The function mutates the existing items array, so the caller observes the changed cart object.',
    commonMistakes: ['Calling a function “pure” while it mutates an input object.', 'Mutating shared state without documenting that behavior.', 'Assuming all mutation is bad instead of reasoning about ownership and expectations.'],
    interviewDefinition: 'Mutation changes an existing object or array; shared mutation can create hidden dependencies when multiple references observe the same state.',
    interviewQuestion: 'Why can shared mutation make bugs difficult to trace?', interviewAnswer: 'Because a change through one reference affects every other part of the program that points to the same object.',
    interviewChecklist: ['Defines mutation', 'Explains shared references', 'Discusses predictable ownership'],
    practiceTask: 'Write one function that mutates an input array and document that behavior clearly, then compare it with a non-mutating version later.',
    knowledgeCheck: { type: 'mcq', question: 'Which operation mutates an array?', options: ['push', 'slice', 'map'], correctAnswer: 'push', explanation: 'push changes the existing array by adding items.' },
    tags: ['javascript', 'mutation', 'shared-state'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'shallow-copy-spread', topicKey: 'references-copying', title: 'Shallow Copies with Spread and Object.assign', difficulty: 'beginner',
    theory: [
      'Spread syntax can create a new outer array or object from existing values. [...items] creates a new array, and { ...user } creates a new object. Object.assign({}, user) can also copy enumerable properties into a new object. These techniques are common in modern application updates.',
      'The copy is shallow. Primitive properties are copied as independent primitive values, but nested objects and arrays are still references to the same nested values. Therefore changing a top-level property on the copy does not affect the source, while mutating a shared nested object can still affect both.',
      'Shallow copying is enough when the values you plan to change exist only at the copied level. If you are changing a nested object, copy that nested level too. This pattern appears frequently in React state updates and reducer logic.',
      'The word “shallow” describes the depth of copying, not the quality of the copy. It is the correct and efficient tool for many updates as long as you understand which nested references remain shared.'
    ],
    codeExample: `const original = { name: 'Asha', settings: { theme: 'dark' } };\nconst copy = { ...original };\ncopy.name = 'Ravi';\ncopy.settings.theme = 'light';\n\nconsole.log(original.name);\nconsole.log(original.settings.theme);`,
    codeExplanation: 'name is copied as a primitive, so changing copy.name does not affect original. settings remains a shared nested object reference, so changing its theme affects both views.',
    commonMistakes: ['Calling object spread a deep clone.', 'Copying only the outer object before mutating a nested object.', 'Assuming Object.assign recursively clones nested values.'],
    interviewDefinition: 'A shallow copy creates a new outer object or array while nested reference values may still be shared.',
    interviewQuestion: 'Why can a nested object still change in both values after using object spread?', interviewAnswer: 'Because spread creates a shallow copy, so nested objects are copied as references rather than recursively cloned.',
    interviewChecklist: ['Defines shallow copy', 'Explains top-level independence', 'Explains nested reference sharing'],
    practiceTask: 'Copy a user object with spread, change one top-level property, then demonstrate one nested property that is still shared.',
    knowledgeCheck: { type: 'short_answer', question: 'Is object spread a shallow or deep copy?', correctAnswer: 'shallow', explanation: 'Spread creates a new outer object but keeps nested object references unless they are copied separately.' },
    tags: ['javascript', 'spread', 'shallow-copy'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'nested-copy-structured-clone', topicKey: 'references-copying', title: 'Updating Nested Data and When Deep Copies Are Needed', difficulty: 'beginner',
    theory: [
      'When you need to update a nested property without changing the source object, copy every level along the path that should be independent. If user.settings.theme changes, create a new user object and a new settings object. Other nested values that are not changed may safely keep their existing references when your update model allows it.',
      'This pattern is more precise than deep-cloning everything. A full deep clone duplicates a complete object graph, which can be unnecessary and can have limitations depending on the cloning method. Modern structuredClone can deeply clone many built-in data types, but it is not a replacement for understanding your data model.',
      'JSON.parse(JSON.stringify(value)) is sometimes shown as a deep-clone trick, but it loses or changes unsupported values such as undefined, functions, Date behavior, Map, Set, and other types. Do not use it blindly as a general cloning solution.',
      'In most application state updates, copy the outer object and the nested branches you are changing. That makes the update explicit and avoids copying unrelated data. Use structuredClone when you truly need an independent deep copy of supported data and the cost is acceptable.'
    ],
    codeExample: `const user = { name: 'Asha', settings: { theme: 'dark', language: 'en' } };\nconst nextUser = {\n  ...user,\n  settings: { ...user.settings, theme: 'light' }\n};\n\nconsole.log(user.settings.theme, nextUser.settings.theme);`,
    codeExplanation: 'Both the outer user and nested settings objects are copied, so changing the new theme does not mutate the original nested object.',
    commonMistakes: ['Copying the outer object and then mutating a shared nested object.', 'Using JSON serialization as a universal deep-clone method.', 'Deep-cloning an entire large structure when only one path needs a new object.'],
    interviewDefinition: 'For a non-mutating nested update, copy each object or array along the changed path; structuredClone can create deeper copies for supported data when truly needed.',
    interviewQuestion: 'Why is JSON.parse(JSON.stringify(value)) not a universal deep-clone solution?', interviewAnswer: 'Serialization can lose or alter unsupported values and types, so it does not preserve every JavaScript object correctly.',
    interviewChecklist: ['Explains copying changed path', 'Mentions nested levels', 'Explains limitation of JSON clone or role of structuredClone'],
    practiceTask: 'Update a nested profile.address.city without mutating the original profile or address objects.',
    knowledgeCheck: { type: 'mcq', question: 'Which approach best updates a nested property immutably?', options: ['Copy the outer object and every changed nested level', 'Copy only the outer object then mutate the shared child', 'Always serialize to JSON'], correctAnswer: 'Copy the outer object and every changed nested level', explanation: 'Each changed reference level needs its own new object or array.' },
    tags: ['javascript', 'nested-copy', 'structured-clone', 'immutability'], estimatedMinutes: 60
  }),

  makeLesson({
    key: 'foreach-map', topicKey: 'array-methods', title: 'forEach and map: Side Effects vs Transformation', difficulty: 'beginner',
    theory: [
      'Array methods package common iteration patterns into readable operations. forEach calls a callback once for each item and is mainly useful for side effects such as logging, updating external UI, or calling another operation. Its return value is undefined and it does not build a result array for you.',
      'map also calls a callback once for each item, but it collects each callback return value into a new array of the same length. Use map when the question is “What should each input item become?” such as converting prices to formatted strings or extracting names from user objects.',
      'Choosing between these methods is about intent. If you want a new transformed array, map says that directly. Using forEach to push values into a separate result array works, but it hides the transformation pattern behind manual mutation.',
      'Neither method automatically changes the source array. However, a callback can still mutate object items if you write it that way. A clean transformation usually returns new values instead of changing the original items unexpectedly.'
    ],
    codeExample: `const prices = [100, 200, 300];\nconst withTax = prices.map((price) => price * 1.18);\nprices.forEach((price) => console.log('Original:', price));\nconsole.log(withTax);`,
    codeExplanation: 'map creates a new array of transformed prices. forEach is used only for the side effect of logging each original value.',
    commonMistakes: ['Using map when no returned array is needed.', 'Using forEach with push to manually recreate map.', 'Forgetting to return a value from a map callback.'],
    interviewDefinition: 'forEach performs an operation for each item and returns undefined; map returns a new array containing one transformed result per input item.',
    interviewQuestion: 'When should you prefer map over forEach?', interviewAnswer: 'Use map when you want a new array created by transforming each input item.',
    interviewChecklist: ['Explains forEach side-effect use', 'Explains map result array', 'Mentions callback return values'],
    practiceTask: 'Convert an array of rupee amounts into formatted strings using map, then print them with forEach.',
    knowledgeCheck: { type: 'short_answer', question: 'What does forEach return?', correctAnswer: 'undefined', explanation: 'forEach is intended for per-item side effects and does not return a transformed array.' },
    tags: ['javascript', 'foreach', 'map', 'arrays'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'filter-find', topicKey: 'array-methods', title: 'filter and find: Selecting Items', difficulty: 'beginner',
    theory: [
      'filter and find both test array items with a callback, but they answer different questions. filter returns a new array containing every item whose callback result is truthy. find stops after the first matching item and returns that item directly.',
      'Use filter when multiple results are meaningful, such as all active users or all scores above a threshold. Use find when one result is enough, such as the user with a specific id. If find has no match, it returns undefined. If filter has no matches, it returns an empty array.',
      'The callback should describe the matching rule and normally avoid side effects. A readable predicate such as user => user.active communicates the selection clearly. Complex predicates can be moved into a named function when the condition deserves explanation or reuse.',
      'Do not call filter and then take [0] when find expresses the actual intention. find can stop early, while filter must examine the full array to build every matching result.'
    ],
    codeExample: `const users = [\n  { id: 1, active: true },\n  { id: 2, active: false },\n  { id: 3, active: true }\n];\n\nconst active = users.filter((user) => user.active);\nconst user2 = users.find((user) => user.id === 2);`,
    codeExplanation: 'filter returns both active users in a new array. find returns only the first user whose id equals 2.',
    commonMistakes: ['Using filter when only one result is wanted.', 'Assuming find returns an array.', 'Forgetting that a failed find returns undefined.'],
    interviewDefinition: 'filter returns all matching items in a new array; find returns the first matching item or undefined.',
    interviewQuestion: 'How do filter and find differ?', interviewAnswer: 'filter collects every match into an array, while find stops at and returns the first match.',
    interviewChecklist: ['Explains filter result', 'Explains find result', 'Mentions no-match behavior'],
    practiceTask: 'From an array of courses, filter all published courses and find one course by slug.',
    knowledgeCheck: { type: 'mcq', question: 'What does find return when nothing matches?', options: ['undefined', '[]', '-1 in every case'], correctAnswer: 'undefined', explanation: 'Array.prototype.find returns undefined when no item satisfies the predicate.' },
    tags: ['javascript', 'filter', 'find', 'arrays'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'some-every-includes', topicKey: 'array-methods', title: 'some, every and includes: Asking Boolean Questions', difficulty: 'beginner',
    theory: [
      'Some array problems do not need the matching items themselves. They only need a yes-or-no answer. some returns true when at least one item passes the predicate. every returns true only when all items pass. These methods can stop early as soon as the final boolean result is known.',
      'includes performs a simpler membership check for a value using SameValueZero comparison rules. It is useful for primitive allowed-value lists such as roles.includes(role) or completedIds.includes(id). For object matching by a property, some or find is usually more appropriate.',
      'These methods make intent clearer than manually maintaining a boolean variable in a loop. hasFailed = scores.some(score => score < 60) reads close to the business question being asked.',
      'An interesting edge case is every on an empty array, which returns true because there is no item that violates the rule. some on an empty array returns false because there is no matching item. Understand this when validation arrays may be empty.'
    ],
    codeExample: `const scores = [82, 74, 91];\nconsole.log(scores.some((score) => score >= 90));\nconsole.log(scores.every((score) => score >= 60));\nconsole.log(['admin', 'learner'].includes('learner'));`,
    codeExplanation: 'some confirms at least one high score, every confirms all scores pass, and includes checks direct membership in the role list.',
    commonMistakes: ['Using filter(...).length > 0 when some expresses the boolean question directly.', 'Using includes to compare object contents.', 'Forgetting empty-array behavior for every.'],
    interviewDefinition: 'some checks whether at least one item matches, every checks whether all items match, and includes checks direct value membership.',
    interviewQuestion: 'What does every return for an empty array?', interviewAnswer: 'It returns true because no element violates the condition.',
    interviewChecklist: ['Defines some', 'Defines every', 'Explains includes or empty-array behavior'],
    practiceTask: 'Check whether any cart item is out of stock and whether every selected item has a valid price.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `console.log([].every((value) => value > 0));`, correctAnswer: 'true', explanation: 'There is no element that fails the predicate, so every returns true for an empty array.' },
    tags: ['javascript', 'some', 'every', 'includes'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'reduce-sort-method-selection', topicKey: 'array-methods', title: 'reduce, sort and Choosing the Right Array Method', difficulty: 'beginner',
    theory: [
      'reduce combines an array into one accumulated result. That result can be a number, object, array, Map, or other value. The callback receives the current accumulator and item, and its return value becomes the accumulator for the next iteration. Providing an explicit initial value makes the accumulator type clear and handles empty arrays safely.',
      'Common reduce use cases include totals, grouped counts, lookup objects, and summaries that need several values at once. Do not use reduce just because it looks advanced. If map, filter, some, or find directly describes the desired result, the simpler method is usually easier to read.',
      'sort changes the original array. By default it compares values as strings, so numeric sorting usually needs a comparator such as (a, b) => a - b. If the original order should be preserved, copy the array before sorting, for example [...scores].sort(...).',
      'A good method-selection question is: what result shape do I need? One transformed value per item: map. Some items: filter. One item: find. Boolean: some/every. One combined result: reduce. Reordered values: sort, remembering its mutation behavior.'
    ],
    codeExample: `const orders = [\n  { status: 'paid', total: 400 },\n  { status: 'cancelled', total: 300 },\n  { status: 'paid', total: 250 }\n];\n\nconst revenue = orders\n  .filter((order) => order.status === 'paid')\n  .reduce((sum, order) => sum + order.total, 0);\n\nconsole.log(revenue);`,
    codeExplanation: 'filter first selects paid orders. reduce then combines their totals into one numeric accumulator that starts at 0.',
    commonMistakes: ['Omitting an initial reduce value when empty arrays are possible.', 'Using reduce for a simple map or filter operation.', 'Forgetting that sort mutates the source array and sorts strings by default.'],
    interviewDefinition: 'reduce accumulates an array into one result; sort reorders an array in place and often needs a comparator for numeric or custom ordering.',
    interviewQuestion: 'Why is an explicit initial value useful with reduce?', interviewAnswer: 'It defines the accumulator type, handles empty arrays safely, and makes the intended result clearer.',
    interviewChecklist: ['Explains accumulator', 'Mentions initial value', 'Mentions sort mutation or comparator'],
    practiceTask: 'Calculate paid-order revenue with reduce and create a separately sorted copy of the order totals without mutating the original list.',
    knowledgeCheck: { type: 'code_output', question: 'What is printed?', codeSnippet: `console.log([1, 2, 3].reduce((sum, n) => sum + n, 0));`, correctAnswer: '6', explanation: 'The accumulator starts at 0 and adds each number.' },
    tags: ['javascript', 'reduce', 'sort', 'array-methods'], estimatedMinutes: 65
  })
];
