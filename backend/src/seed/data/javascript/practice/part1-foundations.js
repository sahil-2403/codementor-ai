import { task } from './taskFactory.js';

export const javascriptPracticePart1 = [
  task({
    topicKey: 'getting-started-javascript', title: 'Print a Learner Profile', difficulty: 'beginner', relatedLessonKeys: ['what-is-javascript'],
    description: 'Write a small JavaScript program that stores and prints basic learner information.',
    requirements: ['Create variables for name, goal, and weeklyHours.', 'Print one readable sentence using all three values.', 'Include one useful comment.'],
    starterHints: ['Use console.log for output.', 'Use const for values that do not change.'], expectedOutput: 'One readable learner profile sentence in the console.',
    solution: "const name = 'Asha';\nconst goal = 'learn JavaScript';\nconst weeklyHours = 7;\n// Show the learning plan\nconsole.log(name + ' wants to ' + goal + ' and will study ' + weeklyHours + ' hours per week.');",
    evaluationChecklist: ['Uses clearly named variables', 'Prints every required value', 'Produces one readable sentence', 'Includes a useful comment'], tags: ['basics', 'console'], estimatedMinutes: 20
  }),
  task({
    topicKey: 'getting-started-javascript', title: 'Detect the JavaScript Environment', difficulty: 'beginner', relatedLessonKeys: ['javascript-runtime-environments'],
    description: 'Detect whether a script is running in a browser-like environment or a Node.js-like environment.',
    requirements: ['Use typeof so checking window is safe.', 'Store the detected environment.', 'Print the result.'],
    starterHints: ['Browsers normally provide window.', 'typeof can safely check a missing global.'], expectedOutput: 'Browser or Node.js-like is printed.',
    solution: "const environment = typeof window === 'undefined' ? 'Node.js-like' : 'Browser';\nconsole.log(environment);",
    evaluationChecklist: ['Uses typeof safely', 'Distinguishes the two environments', 'Stores the result', 'Prints the result'], tags: ['runtime', 'environment'], estimatedMinutes: 20
  }),
  task({
    topicKey: 'variables-values', title: 'Build a Running Study Counter', difficulty: 'beginner', relatedLessonKeys: ['let-reassignment'],
    description: 'Track completed study sessions with a variable that changes as work is completed.',
    requirements: ['Start completedSessions at 0.', 'Increase it three times.', 'Print the final value.', 'Use let only for the changing value.'],
    starterHints: ['Use += 1 for a clear increment.', 'Keep stable values in const.'], expectedOutput: 'The final completed session count is 3.',
    solution: "let completedSessions = 0;\ncompletedSessions += 1;\ncompletedSessions += 1;\ncompletedSessions += 1;\nconsole.log(completedSessions);",
    evaluationChecklist: ['Uses let appropriately', 'Starts at zero', 'Increments three times', 'Prints the final count'], tags: ['let', 'counter'], estimatedMinutes: 20
  }),
  task({
    topicKey: 'variables-values', title: 'Explain const with a Mutable Object', difficulty: 'beginner', relatedLessonKeys: ['const-bindings'],
    description: 'Show that a const object binding stays fixed even though one property can change.',
    requirements: ['Create a const settings object.', 'Update one existing property.', 'Do not reassign the object variable.', 'Explain the binding/property difference in a comment.'],
    starterHints: ['const protects the binding, not every property.'], expectedOutput: 'The same object contains the updated property.',
    solution: "const settings = { theme: 'dark', compact: false };\n// The binding is unchanged; only a property changes.\nsettings.compact = true;\nconsole.log(settings);",
    evaluationChecklist: ['Uses const', 'Mutates a property without reassignment', 'Prints the updated object', 'Explains why the update is allowed'], tags: ['const', 'objects'], estimatedMinutes: 20
  }),
  task({
    topicKey: 'data-types', title: 'Create a Value Type Inspector', difficulty: 'beginner', relatedLessonKeys: ['typeof-primitives-references'],
    description: 'Write describeValue(value) that gives useful labels for null, arrays, and ordinary JavaScript values.',
    requirements: ['Return null for null.', 'Return array for arrays.', 'Use typeof for other values.', 'Test at least five inputs.'],
    starterHints: ['Check null before typeof.', 'Use Array.isArray.'], expectedOutput: 'Each test value gets an accurate readable type label.',
    solution: "function describeValue(value) {\n  if (value === null) return 'null';\n  if (Array.isArray(value)) return 'array';\n  return typeof value;\n}\nconsole.log(describeValue(null));\nconsole.log(describeValue([1, 2]));\nconsole.log(describeValue('hello'));",
    evaluationChecklist: ['Handles null', 'Uses Array.isArray', 'Falls back to typeof', 'Includes test cases'], tags: ['types', 'typeof'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'data-types', title: 'Validate Numeric Input', difficulty: 'beginner', relatedLessonKeys: ['numbers-nan'],
    description: 'Convert possible numeric input and return a clear result when conversion fails.',
    requirements: ['Create parseScore(input).', 'Convert with Number.', 'Return null for NaN.', 'Return the numeric value otherwise.'],
    starterHints: ['Use Number.isNaN after conversion.'], expectedOutput: 'Numeric text becomes a number and invalid text returns null.',
    solution: "function parseScore(input) {\n  const score = Number(input);\n  if (Number.isNaN(score)) return null;\n  return score;\n}\nconsole.log(parseScore('82'));\nconsole.log(parseScore('hello'));",
    evaluationChecklist: ['Converts explicitly', 'Uses Number.isNaN', 'Handles invalid input', 'Returns valid numbers'], tags: ['number', 'nan'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'operators-conversion', title: 'Normalize an Age and Check Eligibility', difficulty: 'beginner', relatedLessonKeys: ['comparison-equality', 'explicit-conversion-coercion'],
    description: 'Convert an age input and determine whether the person meets a minimum age.',
    requirements: ['Convert the input explicitly.', 'Reject invalid numeric input.', 'Compare against 18.', 'Return a boolean.'],
    starterHints: ['Separate conversion from comparison.'], expectedOutput: '20 returns true, 16 returns false, and invalid text is handled.',
    solution: "function canRegister(input) {\n  const age = Number(input);\n  if (Number.isNaN(age)) return false;\n  return age >= 18;\n}",
    evaluationChecklist: ['Uses explicit conversion', 'Handles NaN', 'Uses the correct comparison', 'Returns true or false'], tags: ['conversion', 'comparison'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'operators-conversion', title: 'Calculate a Cart Total Safely', difficulty: 'beginner', relatedLessonKeys: ['arithmetic-assignment', 'logical-truthy-falsy'],
    description: 'Calculate discount, delivery, and final cart total with clearly named intermediate values.',
    requirements: ['Accept subtotal and isMember.', 'Apply a 10% member discount.', 'Use free delivery at or above 1000 after discount.', 'Return the final amount.'],
    starterHints: ['Use named discount and delivery values.'], expectedOutput: 'The function returns the correct numeric final total.',
    solution: "function calculateCartTotal(subtotal, isMember) {\n  const discount = isMember ? subtotal * 0.1 : 0;\n  const discountedSubtotal = subtotal - discount;\n  const delivery = discountedSubtotal >= 1000 ? 0 : 60;\n  return discountedSubtotal + delivery;\n}",
    evaluationChecklist: ['Calculates member discount', 'Applies delivery rule', 'Uses readable intermediate values', 'Returns a number'], tags: ['operators', 'cart'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'conditions-decisions', title: 'Build a Grade Classifier', difficulty: 'beginner', relatedLessonKeys: ['else-if-ranges'],
    description: 'Convert a score into a grade using ordered conditions.',
    requirements: ['Return A for 90 or above.', 'Return B for 75 to 89.', 'Return C for 60 to 74.', 'Return D below 60.', 'Test boundary values.'],
    starterHints: ['Check the highest threshold first.'], expectedOutput: 'Each score maps to the correct grade.',
    solution: "function gradeScore(score) {\n  if (score >= 90) return 'A';\n  if (score >= 75) return 'B';\n  if (score >= 60) return 'C';\n  return 'D';\n}",
    evaluationChecklist: ['Uses correct order', 'Handles all ranges', 'Returns one grade', 'Covers boundaries'], tags: ['conditions', 'ranges'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'conditions-decisions', title: 'Choose a Status Message with switch', difficulty: 'beginner', relatedLessonKeys: ['switch-statements'],
    description: 'Map known submission states to readable messages with switch.',
    requirements: ['Handle submitted, reviewing, and reviewed.', 'Include a default case.', 'Prevent fall-through.', 'Return the message.'],
    starterHints: ['Returning from each case removes the need for break.'], expectedOutput: 'Each known status produces the correct message.',
    solution: "function statusMessage(status) {\n  switch (status) {\n    case 'submitted': return 'Waiting for review';\n    case 'reviewing': return 'Review in progress';\n    case 'reviewed': return 'Feedback ready';\n    default: return 'Unknown status';\n  }\n}",
    evaluationChecklist: ['Uses switch appropriately', 'Handles every requested state', 'Includes default', 'Avoids accidental fall-through'], tags: ['switch', 'conditions'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'loops-repetition', title: 'Count Passing Scores', difficulty: 'beginner', relatedLessonKeys: ['for-loop', 'for-of-break-continue'],
    description: 'Loop through scores and count how many meet the passing threshold.',
    requirements: ['Use a loop.', 'Count scores at or above 60.', 'Do not change the input array.', 'Return the count.'],
    starterHints: ['for...of gives each score directly.'], expectedOutput: '[72, 45, 91, 66] returns 3.',
    solution: "function countPassing(scores) {\n  let count = 0;\n  for (const score of scores) {\n    if (score >= 60) count += 1;\n  }\n  return count;\n}",
    evaluationChecklist: ['Uses a suitable loop', 'Uses the correct threshold', 'Maintains a counter', 'Returns the result'], tags: ['loops', 'for-of'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'loops-repetition', title: 'Stop at the First Invalid Transaction', difficulty: 'beginner', relatedLessonKeys: ['choosing-loops'],
    description: 'Scan transaction amounts and stop at the first negative value.',
    requirements: ['Return the first negative value.', 'Return null if none exists.', 'Stop after finding the first match.', 'Do not mutate the input.'],
    starterHints: ['Returning from inside the loop stops the function.'], expectedOutput: '[30, 20, -5, -9] returns -5.',
    solution: "function firstInvalidTransaction(values) {\n  for (const value of values) {\n    if (value < 0) return value;\n  }\n  return null;\n}",
    evaluationChecklist: ['Stops at first match', 'Returns null when appropriate', 'Does not mutate input', 'Uses a clear loop'], tags: ['loops', 'search'], estimatedMinutes: 25
  })
];
