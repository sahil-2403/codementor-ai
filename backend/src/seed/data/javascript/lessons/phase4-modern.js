import { makeLesson } from './lessonFactory.js';

export const javascriptModernLessons = [
  makeLesson({
    key: 'template-literals',
    topicKey: 'modern-javascript-syntax',
    title: 'Template Literals and Readable Dynamic Strings',
    difficulty: 'intermediate',
    theory: [
      "Template literals are strings written with backticks instead of single or double quotes. Their main benefit is interpolation: an expression inside ${...} is evaluated and placed into the resulting string. This usually makes dynamic messages easier to read than several pieces joined with the + operator.",
      "Template literals can also span multiple lines. This is useful for readable messages and small generated text blocks because the source can follow the shape of the final string. They do not change normal JavaScript evaluation rules, so values still need to be valid and expressions should remain simple enough to understand.",
      "Interpolation can contain variables, calculations, function calls, or conditional expressions. That flexibility is useful, but large pieces of business logic inside a string become difficult to debug. A good habit is to calculate a meaningful value first and then interpolate the named result into the final message.",
      "Template literals do not automatically sanitize user input. If a template string is later inserted into HTML through an unsafe API, untrusted content can still be dangerous. Treat template literals as a readability feature for strings, not as a security feature."
    ],
    codeExample: "const learner = 'Asha';\nconst completed = 12;\nconst total = 20;\nconst message = `${learner} completed ${completed} of ${total} lessons.`;\nconsole.log(message);",
    codeExplanation: 'The backtick string contains three interpolated expressions. JavaScript evaluates each expression and produces one final string without repeated concatenation.',
    commonMistakes: [
      'Using normal single or double quotes and expecting ${value} interpolation to work.',
      'Putting a long calculation directly inside interpolation instead of naming the result first.',
      'Assuming a template literal automatically makes untrusted HTML content safe.'
    ],
    interviewDefinition: 'Template literals are backtick strings that support ${expression} interpolation and multiline text.',
    interviewQuestion: 'What advantage do template literals have over repeated string concatenation?',
    interviewAnswer: 'They let expressions appear directly inside a readable string and support multiline text.',
    interviewChecklist: ['Mentions backticks', 'Explains interpolation', 'Mentions readability or multiline strings'],
    practiceTask: 'Create a progress message containing learner name, completed lesson count, total lesson count, and calculated percentage.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'Which delimiter enables ${...} interpolation in JavaScript?',
      options: ['Backticks', 'Single quotes only', 'Double quotes only'],
      correctAnswer: 'Backticks',
      explanation: 'Template literals use backticks.'
    },
    tags: ['javascript', 'template-literals', 'strings'],
    estimatedMinutes: 45
  }),
  makeLesson({
    key: 'destructuring',
    topicKey: 'modern-javascript-syntax',
    title: 'Array and Object Destructuring',
    difficulty: 'intermediate',
    theory: [
      "Destructuring extracts values from arrays or properties from objects into local bindings. It is useful when a function receives structured data and only a few parts are needed. Instead of repeatedly writing a long property path, destructuring gives the important values short and meaningful local names.",
      "Object destructuring matches property names. Array destructuring reads values by position. Object properties can be renamed during extraction, and both forms can use default values when the matched value is undefined. A default does not replace null because null is an explicit value rather than a missing one.",
      "Destructuring can also be used in function parameters. This can make expected object inputs clear, but deeply nested parameter patterns can become harder to read than a normal parameter followed by a few local declarations. Use the feature when it makes the data requirements easier to see.",
      "Destructuring does not deep-clone objects. If an extracted property contains another object or array, the new local binding still refers to that same nested value. Understanding this connection prevents accidental mutation bugs when destructuring is combined with object updates."
    ],
    codeExample: "const user = { name: 'Ravi', role: 'learner', profile: { city: 'Pune' } };\nconst { name, role, profile: { city } } = user;\nconst [first, second] = ['JavaScript', 'React'];\nconsole.log(name, role, city, first, second);",
    codeExplanation: 'The object pattern extracts named properties, including a nested city value. The array pattern extracts values by their positions.',
    commonMistakes: [
      'Assuming array destructuring matches values by variable name rather than position.',
      'Believing destructuring creates deep independent copies of nested objects.',
      'Creating a very deeply nested pattern that is harder to understand than normal property access.'
    ],
    interviewDefinition: 'Destructuring extracts object properties or array positions into local bindings using a concise pattern.',
    interviewQuestion: 'How does object destructuring differ from array destructuring?',
    interviewAnswer: 'Object destructuring matches property names, while array destructuring reads values by position.',
    interviewChecklist: ['Explains object matching', 'Explains array positions', 'Mentions defaults or renaming'],
    practiceTask: 'Destructure name and email from a user object and the first two technologies from an array, then print the extracted values.',
    knowledgeCheck: {
      type: 'code_output',
      question: 'What is printed?',
      codeSnippet: "const { name = 'Guest' } = {};\nconsole.log(name);",
      correctAnswer: 'Guest',
      explanation: 'The property is undefined, so the destructuring default is used.'
    },
    tags: ['javascript', 'destructuring', 'objects', 'arrays'],
    estimatedMinutes: 55
  }),
  makeLesson({
    key: 'spread-rest-modern',
    topicKey: 'modern-javascript-syntax',
    title: 'Spread, Rest and Concise Object Syntax',
    difficulty: 'intermediate',
    theory: [
      "The ... syntax has two opposite roles depending on where it appears. Spread expands values from an iterable or properties from an object into another expression. Rest appears in a binding pattern or function parameter list and collects the remaining values into one array or object.",
      "Array spread can combine arrays and create shallow copies. Object spread can merge top-level properties and is frequently used for immutable-style updates. When the same object key appears more than once, the later value overwrites the earlier one. Nested objects are still shared unless they are copied separately.",
      "Rest parameters collect extra function arguments into a real array, which makes array methods available immediately. Rest can also collect remaining properties during object destructuring. In both cases the rest element must appear in the final position because JavaScript needs to know which values remain.",
      "Modern object syntax also includes property shorthand and method shorthand. These features reduce repeated words, but concise syntax should still make the data structure obvious. The goal is clearer code, not using the shortest possible form everywhere."
    ],
    codeExample: "const defaults = { theme: 'light', pageSize: 10 };\nconst saved = { theme: 'dark' };\nconst settings = { ...defaults, ...saved };\nfunction sum(...values) {\n  return values.reduce((total, value) => total + value, 0);\n}\nconsole.log(settings, sum(10, 20, 30));",
    codeExplanation: 'Object spread builds a new settings object and the later saved theme wins. Rest collects all numeric arguments into the values array.',
    commonMistakes: [
      'Confusing spread expansion with rest collection because both use the same three dots.',
      'Forgetting that object spread only creates a shallow copy.',
      'Placing a rest parameter before another parameter instead of in the final position.'
    ],
    interviewDefinition: 'Spread expands iterable values or object properties, while rest collects remaining values into one binding.',
    interviewQuestion: 'How can you tell whether ... is acting as spread or rest?',
    interviewAnswer: 'Spread appears in an expression and expands values; rest appears in a binding or parameter pattern and collects values.',
    interviewChecklist: ['Explains spread', 'Explains rest', 'Mentions shallow object copying'],
    practiceTask: 'Merge default settings with user settings using spread and write a sum function that accepts any number of arguments using rest.',
    knowledgeCheck: {
      type: 'mcq',
      question: 'When two object spreads contain the same property key, which value is kept?',
      options: ['The later value', 'The earlier value is always protected', 'Both values automatically become an array'],
      correctAnswer: 'The later value',
      explanation: 'Later object properties overwrite earlier properties with the same key.'
    },
    tags: ['javascript', 'spread', 'rest', 'objects'],
    estimatedMinutes: 55
  }),
  makeLesson({
    key: 'optional-nullish-modern',
    topicKey: 'modern-javascript-syntax',
    title: 'Optional Chaining and Nullish Coalescing',
    difficulty: 'intermediate',
    theory: [
      "Optional chaining, written ?., safely continues a property or method access only when the value before the operator is not null or undefined. If that value is nullish, the chain stops and produces undefined instead of throwing a property-access error at that point.",
      "Nullish coalescing, written ??, provides a fallback only when the value on the left is null or undefined. This is different from ||, which treats every falsy value as a reason to fall back. The distinction matters when 0, false, or an empty string is valid application data.",
      "The two operators often work together. A program can safely read an optional nested setting and then provide a default only when the final value is truly missing. This usually expresses the intent more directly than a long chain of manual null checks.",
      "Optional chaining should be used for genuinely optional data. If a property is required by the application contract, hiding every missing value behind ?. can make bugs harder to notice. Required data still deserves validation and clear failure handling."
    ],
    codeExample: "const user = { profile: { displayName: '' } };\nconst displayName = user.profile?.displayName ?? 'Guest';\nconsole.log(displayName);",
    codeExplanation: 'The profile exists and displayName is an empty string. Because ?? only falls back for null or undefined, the empty string is preserved.',
    commonMistakes: [
      'Using || when 0, false, or an empty string should remain valid data.',
      'Using optional chaining for required fields and hiding a real data-contract bug.',
      'Assuming ?. catches unrelated errors that occur inside a called function.'
    ],
    interviewDefinition: 'Optional chaining stops property access on null or undefined, while nullish coalescing supplies a fallback only for nullish values.',
    interviewQuestion: 'Why can ?? be more appropriate than || for default values?',
    interviewAnswer: 'It preserves valid falsy values such as 0, false, and an empty string and only falls back for null or undefined.',
    interviewChecklist: ['Explains optional chaining', 'Explains nullish coalescing', 'Distinguishes nullish from all falsy values'],
    practiceTask: 'Read an optional settings.theme value and provide dark only when the property is null or undefined, while preserving an empty string if it is intentionally stored.',
    knowledgeCheck: {
      type: 'code_output',
      question: 'What is printed?',
      codeSnippet: 'console.log(false ?? true);',
      correctAnswer: 'false',
      explanation: 'false is not null or undefined, so ?? preserves it.'
    },
    tags: ['javascript', 'optional-chaining', 'nullish-coalescing'],
    estimatedMinutes: 55
  })
];
