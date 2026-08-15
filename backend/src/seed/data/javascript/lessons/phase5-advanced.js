import { makeLesson } from './lessonFactory.js';

export const javascriptAdvancedLessons = [
  makeLesson({
    key: 'execution-context-call-stack', topicKey: 'javascript-internals', title: 'Execution Context and the Call Stack', difficulty: 'advanced',
    theory: [
      'When JavaScript starts running code, it needs a place to keep track of the current variables, function arguments, this value, and where execution should continue. A useful formal term for that running state is an execution context. You do not manipulate execution contexts directly, but the model explains many language behaviors.',
      'Each normal function call creates its own execution context. Active calls are tracked by the call stack. Think of the stack as a pile of function frames: when one function calls another, the new call goes on top. When the inner function returns, its frame is removed and the caller continues from where it paused.',
      'Because the stack is last-in, first-out, deeply nested synchronous calls keep adding frames. Recursive functions are a common example. If recursion never reaches a base case, the stack eventually grows beyond the runtime limit and JavaScript throws a maximum call stack error.',
      'The call stack explains synchronous order, but it does not contain a timer or network request while that operation is waiting. The host environment coordinates those asynchronous operations and schedules callbacks later. We will connect the stack to the event loop in the final topic.'
    ],
    codeExample: `function first() {\n  second();\n  console.log('first done');\n}\n\nfunction second() {\n  console.log('second');\n}\n\nfirst();`,
    codeExplanation: 'first is pushed onto the stack, then second is pushed above it. second finishes and is removed before first continues to its final log.',
    commonMistakes: ['Thinking an asynchronous timer callback stays on the call stack while it waits.', 'Confusing lexical variable lookup with the order of call-stack frames.', 'Writing recursion without a reachable base case.'],
    interviewDefinition: 'An execution context represents the running state for code, and the call stack tracks active function contexts in last-in, first-out order.',
    interviewQuestion: 'What commonly causes a maximum call stack error?', interviewAnswer: 'Too many nested synchronous calls, often recursion that never reaches a base case.',
    interviewChecklist: ['Defines execution context at a useful level', 'Explains LIFO call stack', 'Connects stack overflow to excessive nested calls'],
    practiceTask: 'Trace four nested function calls on paper and write the stack contents after each call and return.',
    knowledgeCheck: { type: 'mcq', question: 'What order does the call stack use?', options: ['Last in, first out', 'First in, first out only', 'Random order'], correctAnswer: 'Last in, first out', explanation: 'The most recently called active function returns before the function beneath it continues.' },
    tags: ['javascript', 'execution-context', 'call-stack'], estimatedMinutes: 65
  }),
  makeLesson({
    key: 'lexical-environments', topicKey: 'javascript-internals', title: 'Lexical Environments and Scope Behind the Scenes', difficulty: 'advanced',
    theory: [
      'Earlier we learned that a nested function can read variables from its surrounding scopes. A lexical environment is a formal way to describe the bindings available in one scope together with a reference to its outer environment. That outer link is what lets JavaScript continue searching when a name is not found locally.',
      'The important word is lexical: the relationship comes from where code is written. When a function is created, its surrounding lexical environment is associated with that function. Calling the function somewhere else does not rewrite where its free variables are looked up.',
      'This model explains why two functions created by separate calls to the same factory can remember different values. Each factory call creates a different environment with different bindings. The returned functions remain connected to the environment created during their own call.',
      'You do not need to draw formal specification records in everyday development. Use the concept to explain scope chains, closures, and why moving a function definition can change which outer binding it sees even when the call site stays the same.'
    ],
    codeExample: `function createMessage(prefix) {\n  return function (name) {\n    return prefix + ', ' + name;\n  };\n}\n\nconst welcome = createMessage('Welcome');\nconst goodbye = createMessage('Goodbye');`,
    codeExplanation: 'Each call creates a separate environment containing a different prefix. The returned functions keep access to the environment from the call that created them.',
    commonMistakes: ['Thinking outer variable lookup is determined by the caller instead of the function definition.', 'Treating lexical environment as a separate runtime feature unrelated to ordinary scope.', 'Assuming all calls to a factory share one set of local variables.'],
    interviewDefinition: 'A lexical environment contains bindings for a scope and a link to its outer environment, allowing JavaScript to resolve identifiers through the scope chain.',
    interviewQuestion: 'Why can two closures created by separate factory calls remember different values?', interviewAnswer: 'Each factory call creates its own lexical environment, and each returned function remains linked to the environment that created it.',
    interviewChecklist: ['Defines environment with bindings', 'Mentions outer link', 'Connects to lexical source location'],
    practiceTask: 'Create two formatter functions from the same factory with different prefixes and explain why they do not share the prefix value.',
    knowledgeCheck: { type: 'short_answer', question: 'Is lexical scope primarily determined by where a function is defined or called?', correctAnswer: 'defined', explanation: 'Lexical relationships come from the source-code structure where the function is created.' },
    tags: ['javascript', 'lexical-environment', 'scope-chain'], estimatedMinutes: 70
  }),
  makeLesson({
    key: 'closures-intuition', topicKey: 'javascript-internals', title: 'Closures: A Function Remembering Its Surrounding Variables', difficulty: 'advanced',
    theory: [
      'A closure becomes easier to understand if you start with the practical idea instead of the formal definition: a function can keep using variables from the place where it was created even after the outer function has finished running. That continued access makes factories, private state, callbacks, and memoization possible.',
      'When an outer function returns an inner function, the outer call’s ordinary stack frame is gone, but bindings that are still needed by the inner function remain reachable through the function’s lexical environment. JavaScript keeps the required environment alive as long as something can still reach the closure.',
      'The inner function does not receive a frozen copy of the original primitive value. It continues to access the binding. That is why a closure can update a counter over several calls. Two separate factory calls create separate bindings and therefore independent counters.',
      'Closures are not rare advanced tricks. Event handlers, Promise callbacks, module patterns, and React hooks all depend on lexical access patterns. The advanced skill is recognizing what data a long-lived closure retains and whether that retained data is still necessary.'
    ],
    codeExample: `function createCounter(start = 0) {\n  let count = start;\n  return function () {\n    count += 1;\n    return count;\n  };\n}\n\nconst counter = createCounter(5);\nconsole.log(counter());\nconsole.log(counter());`,
    codeExplanation: 'The returned function continues to access and update count after createCounter has returned, producing 6 and then 7.',
    commonMistakes: ['Saying a closure only stores a copied snapshot of every outer value.', 'Assuming one closure environment is shared by every factory call.', 'Keeping large unnecessary data reachable from long-lived closures.'],
    interviewDefinition: 'A closure is a function together with continued access to the lexical environment where that function was created.',
    interviewQuestion: 'What does a closure let a returned inner function do?', interviewAnswer: 'It lets the function continue accessing bindings from its defining outer scope even after the outer function has returned.',
    interviewChecklist: ['Mentions continued lexical access', 'Mentions outer function can finish', 'Explains bindings/private state'],
    practiceTask: 'Build createScoreTracker(start) that returns increment, decrement, and current functions sharing one private score.',
    knowledgeCheck: { type: 'mcq', question: 'What does a closure preserve access to?', options: ['Its defining lexical environment', 'Only global variables', 'Only the most recent function caller'], correctAnswer: 'Its defining lexical environment', explanation: 'Closure behavior follows lexical scope, not the later call site.' },
    tags: ['javascript', 'closures', 'lexical-scope'], estimatedMinutes: 70
  }),
  makeLesson({
    key: 'closure-patterns-memory', topicKey: 'javascript-internals', title: 'Closure Patterns, Private State and Memory', difficulty: 'advanced',
    theory: [
      'Closures are useful for creating private state. A factory can keep a variable inside its lexical environment and return functions that are the only public way to read or update that value. External code cannot directly access the local binding by name.',
      'Closures also appear in configuration factories. A function can receive a tax rate and return a calculator already configured with that rate. This avoids passing the same configuration into every later call while still keeping the dependency explicit at creation time.',
      'The memory consequence is important: data referenced by a reachable closure cannot be garbage-collected yet. This is usually exactly what you want for small state, but accidentally capturing a huge object in a long-lived callback can retain more memory than expected.',
      'Do not avoid closures because of memory concerns. Use them deliberately. Capture only the data the function actually needs, remove long-lived event listeners when appropriate, and understand the lifetime of callbacks stored in application structures.'
    ],
    codeExample: `function createTaxCalculator(rate) {\n  return (amount) => amount * (1 + rate);\n}\n\nconst indiaGst = createTaxCalculator(0.18);\nconsole.log(indiaGst(1000));`,
    codeExplanation: 'The returned calculator retains access to rate, so callers only need to provide the amount.',
    commonMistakes: ['Capturing large objects when only one small property is needed.', 'Calling closure state private while exposing a direct mutable object reference to it.', 'Keeping listeners or callbacks forever when their closure data is no longer needed.'],
    interviewDefinition: 'Closures can encapsulate private state and configuration, but any captured data stays reachable while the closure itself remains reachable.',
    interviewQuestion: 'How can a closure contribute to unnecessary memory retention?', interviewAnswer: 'A long-lived closure can keep captured objects reachable, preventing garbage collection even when the program no longer needs that data.',
    interviewChecklist: ['Explains private state use', 'Mentions captured data lifetime', 'Mentions garbage collection reachability'],
    practiceTask: 'Create a configurable formatter factory that captures only the needed prefix and suffix instead of an entire large settings object.',
    knowledgeCheck: { type: 'short_answer', question: 'Can data captured by a reachable closure be garbage-collected while the closure still needs it?', correctAnswer: 'no', explanation: 'Reachable captured data remains reachable through the closure environment.' },
    tags: ['javascript', 'closures', 'private-state', 'memory'], estimatedMinutes: 70
  }),
  makeLesson({
    key: 'recursion-stack', topicKey: 'javascript-internals', title: 'Recursion, Base Cases and Stack Depth', difficulty: 'advanced',
    theory: [
      'Recursion happens when a function calls itself directly or indirectly. It can express naturally recursive structures such as trees, nested comments, or divide-and-conquer problems. Every recursive call still creates a normal function context and adds another frame to the call stack.',
      'A recursive function needs a base case: a condition that returns without making another recursive call. It also needs progress toward that base case. A base condition that can never be reached is not enough and will eventually cause a stack overflow.',
      'Recursion is not automatically better than iteration. A loop can be simpler and use less stack space for straightforward counted repetition. Choose recursion when the data or problem structure is naturally recursive and the expected depth is safe for the runtime.',
      'When debugging recursion, write down the input for each call and the expected returned value. That turns a confusing chain into a sequence of smaller problems and makes missing progress or incorrect base cases easier to spot.'
    ],
    codeExample: `function factorial(n) {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}\n\nconsole.log(factorial(5));`,
    codeExplanation: 'Each call reduces n by one, so the recursion progresses toward the base case. Returns then unwind back through the stack.',
    commonMistakes: ['Writing recursion without a reachable base case.', 'Using recursion for simple repetition when a loop is clearer.', 'Ignoring worst-case recursion depth for large inputs.'],
    interviewDefinition: 'Recursion is a function solving a problem by calling itself on smaller input until a base case stops further calls.',
    interviewQuestion: 'What two things does safe recursion need?', interviewAnswer: 'A reachable base case and progress toward that base case on each recursive step.',
    interviewChecklist: ['Defines recursive self-call', 'Mentions base case', 'Mentions progress/stack depth'],
    practiceTask: 'Write a recursive countdown and then write the equivalent loop. Compare the execution model.',
    knowledgeCheck: { type: 'mcq', question: 'What happens if recursion never reaches a base case?', options: ['The call stack can overflow', 'JavaScript automatically converts it to a loop', 'It always returns undefined immediately'], correctAnswer: 'The call stack can overflow', explanation: 'Each recursive call adds another stack frame until the runtime limit is reached.' },
    tags: ['javascript', 'recursion', 'call-stack'], estimatedMinutes: 65
  }),

  makeLesson({
    key: 'this-call-site', topicKey: 'javascript-internals', title: 'Understanding this Through the Call Site', difficulty: 'advanced',
    theory: [
      'The this keyword is often confusing because normal functions do not decide their this value only from where they are written. A useful rule is to examine how the function is called. In a normal method call such as user.greet(), the object before the dot is the receiver and is usually used as this inside greet.',
      'If the same method function is detached into a variable and called as a plain function, the original object is no longer part of the call site. In strict modern code, this may be undefined. The function itself did not change; the calling form changed.',
      'Constructors called with new and explicit calls through call, apply, or bind use other this rules. Arrow functions are different because they do not create their own dynamic this; they capture this lexically from the surrounding scope.',
      'Instead of memorizing “this means the object,” ask: what kind of function is this, and how was it called? That question explains most real application cases and prevents incorrect assumptions when methods are passed as callbacks.'
    ],
    codeExample: `const user = {\n  name: 'Asha',\n  greet() { return 'Hello ' + this.name; }\n};\n\nconsole.log(user.greet());`,
    codeExplanation: 'greet is called with user as the receiver, so this refers to user during that method call.',
    commonMistakes: ['Assuming this always means the object where a function was originally written.', 'Ignoring the call site when a method is passed around.', 'Applying normal-function this rules to arrow functions.'],
    interviewDefinition: 'For normal functions, this is mainly determined by how the function is called; method calls use the receiver object, while arrows capture this lexically.',
    interviewQuestion: 'What should you inspect first when reasoning about this in a normal function?', interviewAnswer: 'Inspect the call site—how the function is being invoked.',
    interviewChecklist: ['Mentions call site', 'Explains method receiver', 'Distinguishes arrow functions'],
    practiceTask: 'Create one object method and call it normally, then assign it to another variable and observe what changes.',
    knowledgeCheck: { type: 'mcq', question: 'In user.greet(), what is normally the receiver for greet?', options: ['user', 'greet itself', 'The global scope in every environment'], correctAnswer: 'user', explanation: 'The object before the dot is the receiver in a normal method call.' },
    tags: ['javascript', 'this', 'call-site'], estimatedMinutes: 70
  }),
  makeLesson({
    key: 'this-method-loss-arrows', topicKey: 'javascript-internals', title: 'Lost Method Context and Arrow Function Behavior', difficulty: 'advanced',
    theory: [
      'A method can lose its original receiver when it is passed as a callback. const greet = user.greet creates another reference to the same function, but greet() is now a plain call rather than user.greet(). Code that expects this.name may therefore fail or read an unintended value.',
      'One common solution is an arrow wrapper: () => user.greet(). The arrow does not need its own dynamic this; it simply calls the original method through the correct receiver. Another solution is bind, which creates a new function with a fixed this value and is covered next.',
      'Arrow functions themselves capture this from the surrounding lexical scope. That makes them useful inside a method when a nested callback should keep the outer method’s this. It also means an arrow is usually a poor choice for an object method that expects the caller object to become this.',
      'Choose arrows for lexical-this callback behavior and normal methods/functions when dynamic receiver behavior is part of the API. The difference is semantic, not merely shorter syntax.'
    ],
    codeExample: `const user = {\n  name: 'Ravi',\n  greet() { return 'Hi ' + this.name; }\n};\n\nconst safe = () => user.greet();\nconsole.log(safe());`,
    codeExplanation: 'The arrow wrapper calls user.greet() with the intended receiver instead of invoking the detached method as a plain function.',
    commonMistakes: ['Passing a method directly as a callback when it depends on this.', 'Using an arrow as an object method and expecting a dynamic receiver.', 'Thinking arrow functions can have their this changed with call or bind.'],
    interviewDefinition: 'Detached methods can lose their receiver; arrow functions capture this lexically and are useful wrappers when a callback should preserve surrounding context.',
    interviewQuestion: 'Why can passing object.method directly as a callback break code that uses this?', interviewAnswer: 'Because the later callback invocation may be a plain function call without the original object receiver.',
    interviewChecklist: ['Explains detached method', 'Explains arrow lexical this', 'Gives wrapper or bind solution'],
    practiceTask: 'Pass a method that uses this into setTimeout, observe the problem, then fix it with an arrow wrapper.',
    knowledgeCheck: { type: 'short_answer', question: 'Do arrow functions create their own dynamic this value?', correctAnswer: 'no', explanation: 'Arrow functions capture this lexically from the surrounding scope.' },
    tags: ['javascript', 'this', 'arrow-functions', 'callbacks'], estimatedMinutes: 70
  }),
  makeLesson({
    key: 'call-apply-bind', topicKey: 'javascript-internals', title: 'call, apply and bind', difficulty: 'advanced',
    theory: [
      'JavaScript provides explicit tools for controlling this for normal functions. call invokes a function immediately with a chosen this value followed by arguments. apply also invokes immediately but receives the function arguments as an array-like collection.',
      'bind is different because it does not invoke the function immediately. It returns a new function whose this value is fixed to the supplied receiver. Optional starting arguments can also be pre-filled. The new function can be stored and called later as a safe callback.',
      'These methods are most useful when working with existing functions that expect a receiver. Do not use them when a normal parameter would make the dependency clearer. Explicit parameters are often easier to test and reason about than heavy this manipulation.',
      'Arrow functions do not gain a new dynamic this from call, apply, or bind. Binding an arrow may create another callable function, but it does not replace the lexical this captured by the arrow.'
    ],
    codeExample: `function greet(prefix, punctuation) {\n  return prefix + ' ' + this.name + punctuation;\n}\n\nconst user = { name: 'Neha' };\nconsole.log(greet.call(user, 'Hello', '!'));\nconsole.log(greet.apply(user, ['Hi', '.']));\nconst bound = greet.bind(user, 'Welcome');\nconsole.log(bound('!'));`,
    codeExplanation: 'call and apply invoke immediately with user as this. bind creates a new configured function for later use.',
    commonMistakes: ['Thinking bind invokes the function immediately.', 'Forgetting call takes individual arguments while apply accepts an argument array.', 'Trying to change an arrow function’s lexical this with bind.'],
    interviewDefinition: 'call and apply invoke a normal function with an explicit this value; bind returns a new function with a fixed this value.',
    interviewQuestion: 'How does bind differ from call?', interviewAnswer: 'call invokes immediately, while bind returns a new function that can be invoked later with the chosen this value.',
    interviewChecklist: ['Explains call', 'Explains apply argument form', 'Explains bind returns new function'],
    practiceTask: 'Use call, apply, and bind with one reusable formatter function and two different user objects.',
    knowledgeCheck: { type: 'mcq', question: 'Which method returns a new function instead of invoking immediately?', options: ['bind', 'call', 'apply'], correctAnswer: 'bind', explanation: 'bind creates a bound function for later calls.' },
    tags: ['javascript', 'call', 'apply', 'bind', 'this'], estimatedMinutes: 70
  }),

  makeLesson({
    key: 'prototype-chain', topicKey: 'prototypes-object-model', title: 'Prototype Chain and Property Lookup', difficulty: 'advanced',
    theory: [
      'JavaScript objects can delegate property lookup to another object called their prototype. When you read a property that is not an own property of the object, JavaScript checks the prototype, then that prototype’s prototype, continuing until it finds the property or reaches null. This sequence is the prototype chain.',
      'Prototype delegation lets many objects share methods without storing a separate copy on every instance. Arrays can use methods such as map because array instances delegate to Array.prototype, which itself continues through the normal object prototype chain.',
      'Object.hasOwn can check whether a property belongs directly to an object rather than being found through its prototype chain. The in operator checks both own and inherited properties. Understanding the difference matters when iterating or validating object shape.',
      'Avoid changing built-in prototypes in ordinary application code. Adding methods to Array.prototype or Object.prototype can create conflicts with libraries and future language features. Learn the mechanism so you can understand JavaScript’s object model, not so every application creates global prototype modifications.'
    ],
    codeExample: `const base = { describe() { return 'shared'; } };\nconst child = Object.create(base);\nchild.name = 'item';\n\nconsole.log(child.describe());\nconsole.log(Object.hasOwn(child, 'describe'));`,
    codeExplanation: 'describe is not an own property of child. JavaScript finds it by following child’s prototype to base.',
    commonMistakes: ['Saying inherited methods are copied into every object.', 'Confusing own properties with properties found through prototypes.', 'Modifying built-in prototypes in application code without a strong reason.'],
    interviewDefinition: 'The prototype chain is JavaScript’s delegation system where missing properties are searched on linked prototype objects until found or null is reached.',
    interviewQuestion: 'How can an array use map when map is not stored as an own property on each array instance?', interviewAnswer: 'The array delegates property lookup to Array.prototype, where map is defined.',
    interviewChecklist: ['Explains delegation', 'Mentions chain lookup', 'Distinguishes own and inherited properties'],
    practiceTask: 'Create an object with Object.create(base), add one own property, and demonstrate one inherited method.',
    knowledgeCheck: { type: 'short_answer', question: 'Where does prototype lookup stop if no property is found?', correctAnswer: 'null', explanation: 'The end of the prototype chain is null.' },
    tags: ['javascript', 'prototype', 'prototype-chain'], estimatedMinutes: 70
  }),
  makeLesson({
    key: 'constructors-new', topicKey: 'prototypes-object-model', title: 'Constructor Functions and the new Operator', difficulty: 'advanced',
    theory: [
      'Before class syntax was added, constructor functions were a common way to create many similar objects. A constructor is an ordinary function used with new. By convention its name begins with a capital letter to show that callers are expected to use new.',
      'When new Constructor(...) runs, JavaScript creates a new object, links that object to Constructor.prototype, calls the constructor with this referring to the new object, and normally returns that object. This behavior explains the connection between constructor functions and prototypes.',
      'Shared methods should usually be placed on the constructor prototype rather than recreated inside the constructor for every instance. Instance-specific data such as name or id is assigned to this inside the constructor.',
      'Modern code often uses class syntax because it is easier to read, but classes still use prototypes underneath. Learning constructor functions once makes class behavior less mysterious and helps when reading older libraries or interview examples.'
    ],
    codeExample: `function User(name) {\n  this.name = name;\n}\n\nUser.prototype.greet = function () {\n  return 'Hello ' + this.name;\n};\n\nconst user = new User('Asha');\nconsole.log(user.greet());`,
    codeExplanation: 'new creates the instance and links it to User.prototype. greet is shared through the prototype rather than created as a separate function for each user.',
    commonMistakes: ['Calling a constructor intended for new as a plain function.', 'Creating the same method inside every constructor call when it can be shared.', 'Thinking class syntax uses a completely different inheritance system.'],
    interviewDefinition: 'new creates an object, links it to the constructor prototype, calls the constructor with that object as this, and returns the instance unless the constructor explicitly returns another object.',
    interviewQuestion: 'What relationship does new create between an instance and Constructor.prototype?', interviewAnswer: 'The new instance’s prototype is linked to Constructor.prototype.',
    interviewChecklist: ['Explains object creation', 'Explains prototype link', 'Explains constructor this'],
    practiceTask: 'Create a Course constructor with title as instance data and a shared describe method on its prototype.',
    knowledgeCheck: { type: 'mcq', question: 'Where should a shared constructor method normally live?', options: ['On Constructor.prototype', 'Inside every instance as a duplicate function', 'Only in a global string'], correctAnswer: 'On Constructor.prototype', explanation: 'Prototype methods can be shared by every instance.' },
    tags: ['javascript', 'constructor', 'new', 'prototype'], estimatedMinutes: 70
  }),
  makeLesson({
    key: 'classes-inheritance', topicKey: 'prototypes-object-model', title: 'Classes, extends and super', difficulty: 'advanced',
    theory: [
      'class syntax provides a clearer way to define constructor behavior and shared prototype methods. A class declaration can contain a constructor method for instance initialization and other methods that become shared prototype methods. The syntax looks different from constructor functions, but the underlying object system still uses prototypes.',
      'extends links a subclass to a parent class so instances can reuse inherited behavior. In a subclass constructor, super(...) must run before using this because the parent initialization is responsible for creating and preparing the instance context.',
      'Inheritance can be appropriate for a real “is-a” relationship where the subtype genuinely follows the parent contract. Deep inheritance trees become difficult to change because subclasses depend on parent behavior and may override methods in surprising ways.',
      'Use classes when they make object creation and shared behavior clearer, not because every object needs a class. Plain objects, functions, and composition are often simpler for small application behavior.'
    ],
    codeExample: `class User {\n  constructor(name) { this.name = name; }\n  greet() { return 'Hello ' + this.name; }\n}\n\nclass Admin extends User {\n  constructor(name) {\n    super(name);\n    this.role = 'admin';\n  }\n}\n\nconsole.log(new Admin('Neha').greet());`,
    codeExplanation: 'Admin inherits greet through the prototype relationship created by extends and initializes the parent portion through super(name).',
    commonMistakes: ['Thinking class methods are copied into every instance.', 'Using this before super in a derived constructor.', 'Creating deep inheritance hierarchies when simple composition would be clearer.'],
    interviewDefinition: 'JavaScript class syntax defines constructors and prototype methods; extends creates prototype-based inheritance and super calls parent behavior.',
    interviewQuestion: 'Are JavaScript classes separate from the prototype system?', interviewAnswer: 'No. Class syntax is built on JavaScript’s prototype-based object model.',
    interviewChecklist: ['Mentions class/prototype relationship', 'Explains extends', 'Explains super'],
    practiceTask: 'Create a base Account class and a PremiumAccount subclass with one additional property while reusing a base method.',
    knowledgeCheck: { type: 'short_answer', question: 'Which keyword calls the parent constructor from a derived class?', correctAnswer: 'super', explanation: 'super(...) invokes the parent constructor in a subclass.' },
    tags: ['javascript', 'classes', 'inheritance', 'super'], estimatedMinutes: 75
  }),
  makeLesson({
    key: 'composition-vs-inheritance', topicKey: 'prototypes-object-model', title: 'Composition vs Inheritance', difficulty: 'advanced',
    theory: [
      'Inheritance reuses behavior through an “is-a” relationship: an Admin may be a specialized User. Composition builds behavior by combining smaller capabilities: an object can have logging, validation, and persistence functions without becoming a subclass of a large parent type.',
      'Composition is often easier to change because capabilities can be combined without creating a deep hierarchy. A function can receive dependencies explicitly, or an object can be assembled from smaller method groups. This reduces tight coupling between parent and child implementations.',
      'Inheritance is not wrong. It is useful when there is a stable subtype relationship and consumers can safely treat the subtype as the parent contract. The problem is using inheritance only to reuse code when the conceptual relationship is weak.',
      'A practical decision is to ask whether one type truly is another type or merely needs some of its behavior. If it only needs behavior, composition is often clearer. Keep the design simple enough that another developer can understand where each capability comes from.'
    ],
    codeExample: `const canLog = { log(message) { console.log(message); } };\nconst canValidate = { validate(value) { return Boolean(value); } };\n\nconst formService = { ...canLog, ...canValidate };\nformService.log(formService.validate('hello'));`,
    codeExplanation: 'The service receives two independent capabilities by composition instead of inheriting from a parent class containing both.',
    commonMistakes: ['Using inheritance only because two types share one helper method.', 'Creating large mixed capability objects that are composition in name but still tightly coupled.', 'Claiming composition is always better without considering the domain relationship.'],
    interviewDefinition: 'Inheritance reuses behavior through subtype relationships, while composition builds an object or service from smaller independent capabilities.',
    interviewQuestion: 'When is composition often preferable to inheritance?', interviewAnswer: 'When an object needs reusable behavior but does not represent a true subtype of the source of that behavior.',
    interviewChecklist: ['Defines inheritance', 'Defines composition', 'Explains is-a vs has/uses behavior'],
    practiceTask: 'Refactor a two-level class hierarchy whose only purpose is shared logging into a small composed logger dependency.',
    knowledgeCheck: { type: 'mcq', question: 'Which question helps decide whether inheritance fits?', options: ['Is the child genuinely a subtype of the parent?', 'Can I make the class name longer?', 'Can I avoid functions completely?'], correctAnswer: 'Is the child genuinely a subtype of the parent?', explanation: 'Inheritance should model a meaningful subtype relationship, not merely code reuse.' },
    tags: ['javascript', 'composition', 'inheritance', 'design'], estimatedMinutes: 75
  }),

  makeLesson({
    key: 'event-loop-tasks-microtasks', topicKey: 'event-loop-performance', title: 'Event Loop, Task Queue and Microtask Queue', difficulty: 'advanced',
    theory: [
      'JavaScript executes synchronous code on the call stack. Browser and runtime APIs can complete work later and schedule JavaScript callbacks. The event loop coordinates when queued callbacks may run by checking whether the call stack is free and processing the appropriate queues according to runtime rules.',
      'Many callbacks such as timers are scheduled as tasks, sometimes called macrotasks. Promise reaction handlers such as then/catch/finally and code continuing after await are normally queued as microtasks. After a task finishes and the stack is empty, the runtime drains available microtasks before moving to the next normal task.',
      'This priority explains why a resolved Promise handler often runs before a zero-delay timer even when the timer was registered first. The timer and Promise do not compete only by registration time; they enter different scheduling queues.',
      'The event loop model is about ordering, not just speed. Understanding it helps diagnose UI timing bugs, Promise ordering, testing behavior, and situations where a long synchronous task prevents queued work and rendering from happening.'
    ],
    codeExample: `console.log('start');\nsetTimeout(() => console.log('timer'), 0);\nPromise.resolve().then(() => console.log('promise'));\nconsole.log('end');`,
    codeExplanation: 'Synchronous logs run first. The Promise callback is a microtask and runs before the timer task, producing start, end, promise, timer.',
    commonMistakes: ['Assuming zero-delay timers always run before Promise callbacks.', 'Thinking the event loop executes two JavaScript callbacks on the same stack simultaneously.', 'Ignoring long synchronous work that blocks queued callbacks and browser rendering.'],
    interviewDefinition: 'The event loop schedules queued JavaScript work when the call stack is available; Promise reactions use the microtask queue, which is normally drained before the next task such as a timer.',
    interviewQuestion: 'Why does Promise.resolve().then(...) usually run before setTimeout(..., 0)?', interviewAnswer: 'The Promise handler is queued as a microtask, and microtasks are drained before the runtime moves to the next normal task.',
    interviewChecklist: ['Mentions call stack', 'Distinguishes tasks and microtasks', 'Explains microtask priority'],
    practiceTask: 'Predict the exact output of four mixed timer/Promise scripts and explain each ordering before running them.',
    knowledgeCheck: { type: 'code_output', question: 'What is the output order?', codeSnippet: `setTimeout(() => console.log('T'), 0);\nPromise.resolve().then(() => console.log('P'));\nconsole.log('S');`, correctAnswer: 'S, P, T', explanation: 'S is synchronous, P is a microtask, and T is a later task.' },
    tags: ['javascript', 'event-loop', 'microtasks', 'tasks'], estimatedMinutes: 80
  }),
  makeLesson({
    key: 'event-loop-ordering', topicKey: 'event-loop-performance', title: 'Reasoning About Complex Async Execution Order', difficulty: 'advanced',
    theory: [
      'Advanced async questions become manageable when you classify each piece of work instead of guessing. First run all synchronous statements in the current task. Whenever a Promise reaction is scheduled, place it conceptually in the microtask queue. Whenever a timer becomes eligible, treat its callback as a future task.',
      'When the synchronous stack becomes empty, process microtasks until the microtask queue is empty. A microtask can schedule another microtask, and that new microtask is normally processed before moving to the next task. This is why an endless stream of microtasks can delay timers and rendering.',
      'After microtasks are drained, the runtime can move to another task such as a timer callback. When that task finishes, microtasks created during it are drained before the next task. Repeat the same reasoning cycle instead of trying to memorize example outputs.',
      'Browser rendering opportunities are coordinated around event-loop turns and are affected by long tasks. The exact rendering specification contains more detail, but for application reasoning the key lesson is that long synchronous work or excessive microtasks can make the interface feel blocked.'
    ],
    codeExample: `console.log('A');\nPromise.resolve().then(() => {\n  console.log('B');\n  Promise.resolve().then(() => console.log('C'));\n});\nsetTimeout(() => console.log('D'), 0);\nconsole.log('E');`,
    codeExplanation: 'A and E are synchronous. B is the first microtask and schedules C, which is also drained before the timer task D. The order is A, E, B, C, D.',
    commonMistakes: ['Predicting order only from source-line position.', 'Forgetting that a microtask can enqueue more microtasks before the next task.', 'Treating browser rendering as guaranteed to happen between every line or callback.'],
    interviewDefinition: 'Async ordering can be reasoned about by completing the current stack, draining microtasks, then processing the next task and repeating the cycle.',
    interviewQuestion: 'What happens if a Promise microtask schedules another Promise microtask?', interviewAnswer: 'The newly queued microtask is normally processed during the same microtask-draining phase before the next normal task.',
    interviewChecklist: ['Explains synchronous first', 'Explains microtask draining', 'Explains next-task cycle'],
    practiceTask: 'Write a five-line mixed timer/Promise example, predict its output with queue notes, then verify in the console.',
    knowledgeCheck: { type: 'short_answer', question: 'What is normally processed before the next timer task: pending microtasks or the timer?', correctAnswer: 'pending microtasks', explanation: 'The runtime drains the microtask queue before advancing to the next normal task.' },
    tags: ['javascript', 'event-loop', 'async-order'], estimatedMinutes: 80
  }),
  makeLesson({
    key: 'garbage-collection-memory', topicKey: 'event-loop-performance', title: 'Garbage Collection, Reachability and Memory Leaks', difficulty: 'advanced',
    theory: [
      'JavaScript manages memory automatically. You create strings, arrays, objects, functions, and closures without manually freeing their memory. A garbage collector identifies values that are no longer reachable from the running program and can reclaim the memory they occupied.',
      'Reachability is more useful than thinking about whether a variable went out of one block. If a global object, event listener, active timer, cache, DOM reference, or closure still points to another object, that object remains reachable and cannot be collected yet.',
      'A memory leak in JavaScript usually means the program keeps references longer than intended. Examples include a cache that grows forever, event listeners attached to objects that should be released, or a closure that captures a large structure even though it only needs one small value.',
      'Do not manually optimize every allocation. Start with clear ownership and cleanup. Remove listeners and timers when their lifetime ends, bound long-lived caches, avoid unnecessary global references, and use browser memory tools when a real problem exists instead of guessing.'
    ],
    codeExample: `function createLabel(largeRecord) {\n  const name = largeRecord.name;\n  return () => 'User: ' + name;\n}\n\n// Capture only the needed small value rather than using largeRecord in the closure.`,
    codeExplanation: 'The returned function only needs name. By not referencing the whole largeRecord object, the larger structure can become collectible when no other references remain.',
    commonMistakes: ['Believing JavaScript cannot have memory leaks because garbage collection is automatic.', 'Keeping unbounded caches or listeners forever.', 'Optimizing tiny allocations without measuring a real memory problem.'],
    interviewDefinition: 'JavaScript garbage collection reclaims unreachable values; memory leaks occur when references keep data reachable longer than the application actually needs it.',
    interviewQuestion: 'How can an event listener contribute to a memory leak?', interviewAnswer: 'A long-lived listener can keep its callback and any captured objects reachable even after that data is no longer useful.',
    interviewChecklist: ['Explains automatic GC', 'Explains reachability', 'Gives a retained-reference leak example'],
    practiceTask: 'Review a mock cache and event-listener example and identify which references should be removed or bounded.',
    knowledgeCheck: { type: 'mcq', question: 'When can an object normally become eligible for garbage collection?', options: ['When it is no longer reachable', 'Immediately after any function returns even if global state references it', 'Only when the user manually frees it'], correctAnswer: 'When it is no longer reachable', explanation: 'Reachability from live roots determines whether data is still needed by the program.' },
    tags: ['javascript', 'memory', 'garbage-collection', 'leaks'], estimatedMinutes: 75
  }),
  makeLesson({
    key: 'debounce-throttle-performance', topicKey: 'event-loop-performance', title: 'Debounce, Throttle and Practical Performance Habits', difficulty: 'advanced',
    theory: [
      'Some browser events can fire many times in a short period. Search input, scrolling, resizing, and pointer movement can trigger expensive work repeatedly. Debounce and throttle are two patterns for controlling how often that work runs.',
      'Debounce waits until calls stop for a specified delay, resetting the timer after each new call. It is useful for search suggestions where the application should wait until the user pauses typing. Throttle allows execution at a limited rate during continuous activity, which is often useful for scroll or pointer tracking.',
      'Both patterns use closures to retain timing state and timers to schedule work, so they combine earlier course concepts. A robust utility may also preserve this and arguments, but start by understanding the behavioral requirement before adding every edge-case feature.',
      'Performance work should be measured. Avoid optimizing normal code just because a micro-benchmark sounds faster. Focus first on large unnecessary loops, repeated DOM work, sequential network requests that could run together, unbounded memory, and expensive handlers attached to high-frequency events.'
    ],
    codeExample: `function debounce(fn, delay) {\n  let timerId;\n  return function (...args) {\n    clearTimeout(timerId);\n    timerId = setTimeout(() => fn.apply(this, args), delay);\n  };\n}`,
    codeExplanation: 'The returned closure remembers timerId. Every call cancels the previous timer and schedules a new one, so fn runs only after calls stop for the delay.',
    commonMistakes: ['Confusing debounce with throttle.', 'Creating a new debounced wrapper on every event instead of reusing one wrapper.', 'Optimizing without measuring whether the code is actually a bottleneck.'],
    interviewDefinition: 'Debounce delays work until calls stop for a period; throttle limits how frequently work can run during repeated calls.',
    interviewQuestion: 'When would debounce be a good fit?', interviewAnswer: 'For work such as search suggestions that should run after the user pauses typing rather than on every keystroke.',
    interviewChecklist: ['Defines debounce', 'Defines throttle', 'Gives a practical use case'],
    practiceTask: 'Implement debounce(fn, delay), test it with rapid calls, and explain why only the final call executes after the delay.',
    knowledgeCheck: { type: 'short_answer', question: 'Which pattern resets its timer on each rapid call and waits for a quiet period?', correctAnswer: 'debounce', explanation: 'Debouncing delays execution until calls stop for the configured delay.' },
    tags: ['javascript', 'debounce', 'throttle', 'performance'], estimatedMinutes: 80
  })
];
