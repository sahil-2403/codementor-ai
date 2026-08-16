import { makeLesson } from './lessonFactory.js';

export const javascriptErrorLessons = [
  makeLesson({
    key: 'reading-errors',
    topicKey: 'errors-debugging-modules',
    title: 'Reading JavaScript Errors and Stack Traces',
    difficulty: 'intermediate',
    theory: [
      "Errors are useful signals that JavaScript reached a state it could not handle normally. Common built-in error types include ReferenceError when an identifier is missing or unavailable, TypeError when an operation is invalid for the current value, and SyntaxError when source text cannot be parsed as valid JavaScript.",
      "A stack trace shows where the error became visible and the chain of function calls that led to that point. Start with the first useful line from your own application code, inspect the operation on that line, and then move outward through the call path when the bad state may have been introduced earlier.",
      "The line that throws is not always the line that created the bad data. A property-access TypeError may happen because an earlier API response had a different shape than expected. Good debugging therefore combines the error message with actual runtime values instead of treating the stack trace as the entire explanation.",
      "Do not immediately hide every error with try/catch. First decide whether the failure is a programming bug, invalid external input, or a recoverable operation failure. Different categories should be handled differently so useful bugs remain visible while expected failures receive clear user-facing behavior."
    ],
    codeExample: "function showName(user) {\n  return user.profile.name;\n}\n// showName(null); // TypeError because null has no profile property",
    codeExplanation: 'The function expects an object with a profile property. Passing null violates that assumption, so the property access throws a TypeError.',
    commonMistakes: [
      'Ignoring the actual error type and message and immediately guessing at a fix.',
      'Assuming the line that throws is always where invalid data was first created.',
      'Adding a catch block before deciding whether the failure can be meaningfully recovered.'
    ],
    interviewDefinition: 'A JavaScript error describes a failed operation, and a stack trace shows the chain of calls that led to the failure.',
    interviewQuestion: 'What is a useful first step when reading a stack trace?',
    interviewAnswer: 'Find the first relevant line in your own code and inspect the operation and runtime values there.',
    interviewChecklist: ['Mentions error type and message', 'Explains stack trace', 'Mentions runtime values or call path'],
    practiceTask: 'Trigger one ReferenceError and one TypeError intentionally, then record the message, the relevant stack line, and the real cause of each error.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'Which error commonly appears when code tries to read a property from null?',
      options: ['TypeError', 'RangeError only', 'No error'],
      correctAnswer: 'TypeError',
      explanation: 'Property access is invalid on null, so JavaScript throws a TypeError.'
    },
    tags: ['javascript', 'errors', 'stack-trace'],
    estimatedMinutes: 55
  }),
  makeLesson({
    key: 'try-catch-finally',
    topicKey: 'errors-debugging-modules',
    title: 'Recovering with try, catch and finally',
    difficulty: 'intermediate',
    theory: [
      "try/catch handles exceptions that may be thrown while a block of code is running. JavaScript executes the try block normally. If an exception is thrown before the block finishes, normal execution of that block stops and control moves to catch, where the error object can be inspected.",
      "A catch block should have a real responsibility. It can convert invalid JSON into a useful validation result, add operation-specific context before rethrowing, or choose a fallback when the failed operation is optional. An empty catch block hides information and can leave the program in an incorrect state.",
      "finally runs after the try/catch sequence whether the operation succeeds or throws. It is appropriate for cleanup that must always happen, such as resetting a loading flag or releasing a resource. It should not become a place for unrelated business logic because its purpose is completion cleanup.",
      "Catch errors at a layer that understands what recovery or message is appropriate. Wrapping a huge section of application code in one broad try/catch may prevent a visible crash while also hiding programming mistakes. Narrow, purposeful handling is easier to reason about and maintain."
    ],
    codeExample: "function parseSettings(text) {\n  try {\n    return { ok: true, value: JSON.parse(text) };\n  } catch (error) {\n    return { ok: false, message: 'Settings are not valid JSON' };\n  }\n}",
    codeExplanation: 'JSON.parse can throw for invalid JSON. This function knows how to translate that specific failure into a structured result the caller can handle.',
    commonMistakes: [
      'Using an empty catch block that silently discards the error.',
      'Catching at a layer that cannot recover or add useful context.',
      'Putting normal unrelated application logic inside finally.'
    ],
    interviewDefinition: 'try runs code that may throw, catch handles a thrown exception, and finally runs cleanup after either success or failure.',
    interviewQuestion: 'When is catching an error useful?',
    interviewAnswer: 'When the current layer can recover, translate the failure, add useful context, or perform required cleanup.',
    interviewChecklist: ['Explains try', 'Explains purposeful catch behavior', 'Explains finally'],
    practiceTask: 'Write parseJsonSafely(text) that returns a success object for valid JSON and a clear error object for invalid JSON without crashing the caller.',
    knowledgeCheck: {
      type: 'short_answer',
      question: 'Which block runs after try/catch whether an exception occurred or not?',
      correctAnswer: 'finally',
      explanation: 'finally is intended for logic that must run after either outcome.'
    },
    tags: ['javascript', 'try-catch', 'finally', 'errors'],
    estimatedMinutes: 60
  }),
  makeLesson({
    key: 'throw-custom-errors',
    topicKey: 'errors-debugging-modules',
    title: 'Throwing Errors and Creating Clear Failure Messages',
    difficulty: 'intermediate',
    theory: [
      "Your own functions can throw an Error when continuing would produce an invalid or misleading result. For example, a calculation can reject impossible input, or a configuration loader can reject a required missing value. throw immediately stops the current normal path and propagates the exception upward.",
      "Throw Error objects rather than plain strings because Error provides standard information such as name, message, and stack. A useful error message explains the violated rule. A message such as 'price must be a non-negative number' gives the caller much more information than a generic message such as 'bad input'.",
      "Custom Error subclasses can help when the application genuinely needs to distinguish categories such as validation and authorization. They should not be added only because they sound advanced. If callers handle all failures the same way, a normal Error with a clear message is usually the simpler choice.",
      "Errors should represent exceptional failure paths, not every ordinary no-result condition. A search function can return null when nothing matches if that is part of its normal contract. Throw when the function cannot meaningfully continue under the rules it promises to follow."
    ],
    codeExample: "function calculateAverage(values) {\n  if (!Array.isArray(values)) throw new TypeError('values must be an array');\n  if (values.length === 0) throw new Error('values must not be empty');\n  return values.reduce((sum, value) => sum + value, 0) / values.length;\n}",
    codeExplanation: 'The function validates its contract before calculating. Invalid input creates an explicit Error rather than allowing a confusing later result.',
    commonMistakes: [
      'Throwing plain strings instead of Error objects.',
      'Using exceptions for every normal no-result case.',
      'Writing vague messages that do not explain the actual violated requirement.'
    ],
    interviewDefinition: 'throw raises an exception and stops normal execution; Error objects provide standard failure information such as a message and stack.',
    interviewQuestion: 'Why is throwing an Error object usually better than throwing a plain string?',
    interviewAnswer: 'Error provides standard metadata such as name, message, and stack and works consistently with normal debugging tools.',
    interviewChecklist: ['Explains throw behavior', 'Mentions Error object metadata', 'Distinguishes exceptional failure from normal no-result flow'],
    practiceTask: 'Write parsePositiveNumber(input) that returns a number for valid positive input and throws clear errors for nonnumeric and non-positive values.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'What happens immediately after throw executes?',
      options: ['Normal execution of the current path stops', 'The next statement always runs', 'The thrown value is ignored'],
      correctAnswer: 'Normal execution of the current path stops',
      explanation: 'The exception propagates until it is caught or reaches the runtime boundary.'
    },
    tags: ['javascript', 'throw', 'error-objects'],
    estimatedMinutes: 60
  }),
  makeLesson({
    key: 'systematic-debugging',
    topicKey: 'errors-debugging-modules',
    title: 'Debugging Systematically with DevTools',
    difficulty: 'intermediate',
    theory: [
      "Debugging is a repeatable investigation process rather than random code editing. Start by reproducing the bug consistently. Write down what you expected, what actually happened, and the smallest input or user action that still produces the failure. A reproducible problem is much easier to reason about.",
      "Collect runtime evidence before changing code. Focused logs can show selected values, while breakpoints can pause execution so you can inspect local variables, the call stack, and expressions. The Network panel can reveal request status and payloads, and the Elements panel can show the real DOM state.",
      "Form one hypothesis at a time. For example, you may suspect a total becomes NaN because one API value is an invalid numeric string. Inspect the values that would prove or disprove that idea. Then make the smallest change that addresses the root cause instead of rewriting unrelated code.",
      "After fixing the issue, rerun the original failing case and nearby edge cases. A professional debugging note can summarize reproduction, root cause, fix, and verification. This habit improves real maintenance work and also demonstrates reasoning clearly during technical interviews."
    ],
    codeExample: "function average(values) {\n  let total = 0;\n  for (const value of values) {\n    console.log('value/type:', value, typeof value);\n    total += Number(value);\n  }\n  return values.length ? total / values.length : 0;\n}",
    codeExplanation: 'The focused log checks the exact value and type at the boundary where unexpected input can affect the calculation.',
    commonMistakes: [
      'Changing several lines at once without isolating the cause.',
      'Rereading source code repeatedly without inspecting actual runtime values.',
      'Fixing a visible symptom while leaving the invalid state that produced it.'
    ],
    interviewDefinition: 'Systematic debugging reproduces the problem, gathers evidence, tests a hypothesis, applies a focused root-cause fix, and verifies the result.',
    interviewQuestion: 'What should you do before changing code during debugging?',
    interviewAnswer: 'Reproduce the issue and gather evidence about actual runtime state so you can form a specific hypothesis.',
    interviewChecklist: ['Mentions reproduction', 'Mentions evidence', 'Mentions hypothesis and verification'],
    practiceTask: 'Debug a function that produces NaN for one input and document the reproduction steps, root cause, smallest fix, and verification cases.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'Which debugging process is strongest?',
      options: ['Reproduce, inspect, hypothesize, change, verify', 'Change many lines randomly', 'Ignore runtime values and guess'],
      correctAnswer: 'Reproduce, inspect, hypothesize, change, verify',
      explanation: 'An evidence-based process reduces guesswork and makes verification possible.'
    },
    tags: ['javascript', 'debugging', 'devtools', 'breakpoints'],
    estimatedMinutes: 65
  })
];
