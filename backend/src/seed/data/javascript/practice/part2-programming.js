import { task } from './taskFactory.js';

export const javascriptPracticePart2 = [
  task({
    topicKey: 'functions', title: 'Build a Reusable Price Calculator', difficulty: 'beginner', relatedLessonKeys: ['parameters-arguments-return'],
    description: 'Create focused functions for tax and final-price calculations instead of repeating arithmetic.',
    requirements: ['Create calculateTax(amount, rate).', 'Create calculateFinalTotal(subtotal, taxRate).', 'Return values instead of only logging.', 'Call the functions with one example.'],
    starterHints: ['The final function can call calculateTax.'], expectedOutput: 'A numeric final total is returned.',
    solution: "function calculateTax(amount, rate) {\n  return amount * rate;\n}\nfunction calculateFinalTotal(subtotal, taxRate) {\n  return subtotal + calculateTax(subtotal, taxRate);\n}\nconsole.log(calculateFinalTotal(1000, 0.18));",
    evaluationChecklist: ['Uses two focused functions', 'Uses parameters correctly', 'Returns results', 'Composes the functions'], tags: ['functions', 'return'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'functions', title: 'Create a Flexible Average Function', difficulty: 'beginner', relatedLessonKeys: ['defaults-rest-arrow'],
    description: 'Write average(...scores) so the caller can provide any number of numeric scores.',
    requirements: ['Use a rest parameter.', 'Return 0 for no scores.', 'Calculate the total.', 'Return the numeric average.'],
    starterHints: ['A rest parameter gives you a real array.'], expectedOutput: 'average(60, 80, 100) returns 80.',
    solution: "function average(...scores) {\n  if (!scores.length) return 0;\n  const total = scores.reduce((sum, score) => sum + score, 0);\n  return total / scores.length;\n}",
    evaluationChecklist: ['Uses rest', 'Handles empty input', 'Calculates total', 'Returns the average'], tags: ['functions', 'rest'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'scope-hoisting', title: 'Fix an Accidental Global Dependency', difficulty: 'beginner', relatedLessonKeys: ['lexical-scope-lookup'],
    description: 'Refactor a calculation so its tax rate is an explicit function input instead of a hidden global dependency.',
    requirements: ['Accept subtotal and taxRate as parameters.', 'Do not read a global taxRate.', 'Return the calculated total.', 'Explain why the dependency is clearer.'],
    starterHints: ['A function contract is clearer when required values are parameters.'], expectedOutput: 'The function works without reading a global variable.',
    solution: "function calculateTotal(subtotal, taxRate) {\n  return subtotal * (1 + taxRate);\n}\nconsole.log(calculateTotal(1000, 0.18));",
    evaluationChecklist: ['Removes global dependency', 'Uses a parameter', 'Returns correct result', 'Explains the improvement'], tags: ['scope', 'parameters'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'scope-hoisting', title: 'Predict and Repair Hoisting Code', difficulty: 'beginner', relatedLessonKeys: ['hoisting-rules', 'tdz-shadowing'],
    description: 'Rewrite confusing code that reads declarations too early into clear source order.',
    requirements: ['Explain var-before-assignment behavior.', 'Explain the let temporal dead zone.', 'Move declarations before use.', 'Use let or const appropriately.'],
    starterHints: ['var is initialized to undefined; let cannot be read in its TDZ.'], expectedOutput: 'The rewritten program does not depend on early variable access.',
    solution: "const modernValue = 20;\nlet changingValue = 10;\nconsole.log(changingValue, modernValue);\nchangingValue = 15;\nconsole.log(changingValue);",
    evaluationChecklist: ['Explains var behavior', 'Explains TDZ', 'Moves declarations before use', 'Uses modern declarations'], tags: ['hoisting', 'tdz'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'arrays', title: 'Manage a Waiting List', difficulty: 'beginner', relatedLessonKeys: ['array-add-remove'],
    description: 'Use array operations to model one person joining and one person being served from a queue.',
    requirements: ['Accept a queue and new person.', 'Add the new person to the end.', 'Remove the first person.', 'Return served person and remaining queue.'],
    starterHints: ['push adds at the end and shift removes from the front.'], expectedOutput: 'The first person is served and the remaining queue is returned.',
    solution: "function processQueue(queue, newPerson) {\n  queue.push(newPerson);\n  const served = queue.shift();\n  return { served, remaining: queue };\n}",
    evaluationChecklist: ['Uses push', 'Uses shift', 'Returns served value', 'Returns remaining queue'], tags: ['arrays', 'queue'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'arrays', title: 'Compare slice and splice', difficulty: 'beginner', relatedLessonKeys: ['slice-splice'],
    description: 'Demonstrate the difference between copying with slice and changing an array with splice.',
    requirements: ['Create a four-item array.', 'Use slice to copy the middle values.', 'Use splice to replace one original value.', 'Print both results.'],
    starterHints: ['slice excludes the end index.', 'splice receives a delete count.'], expectedOutput: 'The copied section stays separate while splice changes the source array.',
    solution: "const values = ['a', 'b', 'c', 'd'];\nconst middle = values.slice(1, 3);\nvalues.splice(1, 1, 'B');\nconsole.log(middle);\nconsole.log(values);",
    evaluationChecklist: ['Uses slice correctly', 'Uses splice correctly', 'Shows non-mutating versus mutating behavior', 'Prints both results'], tags: ['slice', 'splice'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'objects', title: 'Build a Learner Summary Method', difficulty: 'beginner', relatedLessonKeys: ['object-methods'],
    description: 'Create a learner object with related data and a method that returns a readable summary.',
    requirements: ['Include name and completedLessons.', 'Add summary() as a normal method.', 'Use this inside the method.', 'Return a string.'],
    starterHints: ['Method shorthand is summary() { ... }.'], expectedOutput: 'The method returns a readable learner summary.',
    solution: "const learner = {\n  name: 'Asha',\n  completedLessons: 12,\n  summary() {\n    return this.name + ' completed ' + this.completedLessons + ' lessons';\n  }\n};",
    evaluationChecklist: ['Stores related properties', 'Uses method syntax', 'Uses this correctly', 'Returns readable text'], tags: ['objects', 'methods'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'objects', title: 'List Topic Scores with Object.entries', difficulty: 'beginner', relatedLessonKeys: ['object-keys-values-entries'],
    description: 'Convert an object of topic scores into readable lines.',
    requirements: ['Accept a score object.', 'Use Object.entries.', 'Return formatted strings.', 'Do not mutate the input object.'],
    starterHints: ['Map over the [key, value] pairs.'], expectedOutput: '{ javascript: 80 } becomes an array containing javascript: 80%.',
    solution: "function scoreLines(scores) {\n  return Object.entries(scores).map(([topic, score]) => topic + ': ' + score + '%');\n}",
    evaluationChecklist: ['Uses Object.entries', 'Handles key and value', 'Returns an array', 'Does not mutate input'], tags: ['objects', 'entries'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'references-copying', title: 'Fix a Shared Nested Object Bug', difficulty: 'beginner', relatedLessonKeys: ['shallow-copy-spread', 'nested-copy-structured-clone'],
    description: 'Update a nested theme while keeping both the original user object and original settings object unchanged.',
    requirements: ['Create a new outer object.', 'Create a new nested settings object.', 'Change only theme.', 'Verify the original theme remains unchanged.'],
    starterHints: ['Use spread at both levels.'], expectedOutput: 'The original stays dark while the new object is light.',
    solution: "const user = { name: 'Asha', settings: { theme: 'dark', language: 'en' } };\nconst nextUser = { ...user, settings: { ...user.settings, theme: 'light' } };\nconsole.log(user.settings.theme, nextUser.settings.theme);",
    evaluationChecklist: ['Copies outer object', 'Copies nested object', 'Changes only theme', 'Preserves original'], tags: ['references', 'immutable-update'], estimatedMinutes: 35
  }),
  task({
    topicKey: 'references-copying', title: 'Demonstrate Primitive Copy vs Object Reference', difficulty: 'beginner', relatedLessonKeys: ['primitive-vs-reference-copy'],
    description: 'Show how copying a primitive differs from copying an object reference.',
    requirements: ['Copy a primitive and reassign the copy.', 'Copy an object reference and mutate through the copy.', 'Print original values.', 'Explain why the results differ.'],
    starterHints: ['Object assignment copies a reference, not a deep clone.'], expectedOutput: 'The primitive original stays unchanged while the object original sees the mutation.',
    solution: "let firstNumber = 10;\nlet secondNumber = firstNumber;\nsecondNumber = 20;\nconst firstUser = { score: 10 };\nconst secondUser = firstUser;\nsecondUser.score = 20;\nconsole.log(firstNumber);\nconsole.log(firstUser.score);",
    evaluationChecklist: ['Shows primitive independence', 'Shows shared object reference', 'Prints both outcomes', 'Explains the difference'], tags: ['references', 'copying'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'array-methods', title: 'Create a Paid Order Revenue Summary', difficulty: 'beginner', relatedLessonKeys: ['filter-find', 'reduce-sort-method-selection'],
    description: 'Use array methods to total revenue from paid orders only.',
    requirements: ['Filter non-paid orders.', 'Use reduce to total paid amounts.', 'Use 0 as the initial accumulator.', 'Do not mutate the orders array.'],
    starterHints: ['Filter first, then reduce.'], expectedOutput: 'Paid orders of 400 and 250 produce 650.',
    solution: "function paidRevenue(orders) {\n  return orders.filter((order) => order.status === 'paid').reduce((sum, order) => sum + order.total, 0);\n}",
    evaluationChecklist: ['Uses filter', 'Uses reduce', 'Uses initial value 0', 'Returns numeric revenue'], tags: ['filter', 'reduce'], estimatedMinutes: 35
  }),
  task({
    topicKey: 'array-methods', title: 'Build Course Availability Checks', difficulty: 'beginner', relatedLessonKeys: ['some-every-includes'],
    description: 'Answer three boolean questions with the array method that best matches each requirement.',
    requirements: ['Use some to detect any archived course.', 'Use every to require titles on all courses.', 'Use includes to validate a role.', 'Return all three booleans.'],
    starterHints: ['Choose the method from the shape of the answer you need.'], expectedOutput: 'One object containing three clearly named boolean values.',
    solution: "function checks(courses, role) {\n  return {\n    hasArchived: courses.some((course) => course.status === 'archived'),\n    allHaveTitles: courses.every((course) => Boolean(course.title)),\n    roleAllowed: ['learner', 'admin'].includes(role)\n  };\n}",
    evaluationChecklist: ['Uses some', 'Uses every', 'Uses includes', 'Returns named booleans'], tags: ['some', 'every', 'includes'], estimatedMinutes: 30
  })
];
