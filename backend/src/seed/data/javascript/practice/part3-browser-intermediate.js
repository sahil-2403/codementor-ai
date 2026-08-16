import { task } from './taskFactory.js';

export const javascriptPracticePart3 = [
  task({
    topicKey: 'dom-fundamentals', title: 'Render a Topic List Safely', difficulty: 'beginner', relatedLessonKeys: ['dom-create-remove'],
    description: 'Render an array of topic names into a list using DOM creation APIs.',
    requirements: ['Select the target list.', 'Create one li per topic.', 'Use textContent.', 'Append every item.'],
    starterHints: ['Use document.createElement and append.'], expectedOutput: 'The list contains one safe item for each topic.',
    solution: "const topics = ['Variables', 'Functions', 'Arrays'];\nconst list = document.querySelector('#topics');\nif (list) {\n  topics.forEach((topic) => {\n    const item = document.createElement('li');\n    item.textContent = topic;\n    list.append(item);\n  });\n}",
    evaluationChecklist: ['Selects list safely', 'Creates li elements', 'Uses textContent', 'Appends all topics'], tags: ['dom', 'rendering'], estimatedMinutes: 35
  }),
  task({
    topicKey: 'dom-fundamentals', title: 'Update a Status Element', difficulty: 'beginner', relatedLessonKeys: ['dom-content-attributes-styles'],
    description: 'Update one status element using text, a CSS class, and an accessibility attribute.',
    requirements: ['Select #status.', 'Set text to Ready.', 'Add an is-ready class.', 'Set aria-live to polite.'],
    starterHints: ['Check that querySelector found the element.'], expectedOutput: 'The element reflects the requested text, class, and attribute.',
    solution: "const status = document.querySelector('#status');\nif (status) {\n  status.textContent = 'Ready';\n  status.classList.add('is-ready');\n  status.setAttribute('aria-live', 'polite');\n}",
    evaluationChecklist: ['Checks the selected element', 'Uses textContent', 'Uses classList', 'Sets the attribute'], tags: ['dom', 'classlist'], estimatedMinutes: 25
  }),
  task({
    topicKey: 'events-interaction', title: 'Build One Delegated Remove Handler', difficulty: 'beginner', relatedLessonKeys: ['event-delegation'],
    description: 'Use one list listener to handle remove buttons that may be added dynamically.',
    requirements: ['Attach one click listener to the list.', 'Use closest to find data-remove-id.', 'Ignore unrelated clicks.', 'Read and print the id.'],
    starterHints: ['Bubbling lets the parent observe child clicks.'], expectedOutput: 'Any current or future matching button produces its remove id.',
    solution: "const list = document.querySelector('#tasks');\nlist?.addEventListener('click', (event) => {\n  const button = event.target.closest('[data-remove-id]');\n  if (!button || !list.contains(button)) return;\n  console.log(button.dataset.removeId);\n});",
    evaluationChecklist: ['Uses one parent listener', 'Uses closest', 'Guards unrelated clicks', 'Reads dataset id'], tags: ['events', 'delegation'], estimatedMinutes: 35
  }),
  task({
    topicKey: 'events-interaction', title: 'Create a Live Search Preview', difficulty: 'beginner', relatedLessonKeys: ['event-object-input'],
    description: 'Update preview text while a learner types into a search input.',
    requirements: ['Listen for input.', 'Read event.target.value.', 'Trim displayed text.', 'Use a fallback message when empty.'],
    starterHints: ['The browser passes an event object to the callback.'], expectedOutput: 'The preview updates after every input change.',
    solution: "const search = document.querySelector('#search');\nconst preview = document.querySelector('#preview');\nsearch?.addEventListener('input', (event) => {\n  const value = event.target.value.trim();\n  if (preview) preview.textContent = value || 'Type to search';\n});",
    evaluationChecklist: ['Uses input event', 'Reads event.target.value', 'Trims input', 'Updates preview safely'], tags: ['events', 'input'], estimatedMinutes: 30
  }),
  task({
    topicKey: 'forms-browser-data', title: 'Validate an Age Form', difficulty: 'beginner', relatedLessonKeys: ['form-submit-formdata', 'form-validation'],
    description: 'Handle a form submission, normalize the age field, and return clear validation feedback.',
    requirements: ['Listen to submit.', 'Call preventDefault.', 'Read age with FormData.', 'Convert with Number.', 'Reject invalid or out-of-range values.'],
    starterHints: ['Keep validation in a focused helper.'], expectedOutput: 'Valid age is accepted and invalid age receives a useful message.',
    solution: "function validateAge(raw) {\n  const age = Number(raw);\n  if (Number.isNaN(age)) return 'Age must be a number';\n  if (age < 13 || age > 120) return 'Age must be between 13 and 120';\n  return null;\n}\nconst form = document.querySelector('#profile-form');\nform?.addEventListener('submit', (event) => {\n  event.preventDefault();\n  const data = new FormData(form);\n  console.log(validateAge(data.get('age')) ?? 'Valid');\n});",
    evaluationChecklist: ['Handles submit', 'Prevents default navigation', 'Uses FormData', 'Converts and validates age', 'Produces clear feedback'], tags: ['forms', 'validation'], estimatedMinutes: 40
  }),
  task({
    topicKey: 'forms-browser-data', title: 'Persist a Theme Preference', difficulty: 'beginner', relatedLessonKeys: ['localstorage-json', 'persistent-browser-flow'],
    description: 'Load, apply, and save a harmless theme preference with localStorage.',
    requirements: ['Load a saved theme with a light fallback.', 'Apply it to document.body.dataset.theme.', 'Create saveTheme(theme).', 'Do not store sensitive information.'],
    starterHints: ['getItem returns null for a missing key.', 'Use ?? for the fallback.'], expectedOutput: 'The saved theme survives reload and light is used initially.',
    solution: "function loadTheme() {\n  return localStorage.getItem('theme') ?? 'light';\n}\nfunction saveTheme(theme) {\n  localStorage.setItem('theme', theme);\n}\nconst currentTheme = loadTheme();\ndocument.body.dataset.theme = currentTheme;",
    evaluationChecklist: ['Loads localStorage', 'Provides fallback', 'Applies state', 'Saves through a focused function'], tags: ['localstorage', 'state'], estimatedMinutes: 35
  }),
  task({
    topicKey: 'modern-javascript-syntax', title: 'Merge User Settings Safely', difficulty: 'intermediate', relatedLessonKeys: ['spread-rest-modern', 'optional-nullish-modern'],
    description: 'Combine defaults and saved settings without mutating either input.',
    requirements: ['Use object spread.', 'Let saved settings overwrite defaults.', 'Preserve valid false and 0 values.', 'Read an optional nested value safely.'],
    starterHints: ['Spread saved values after defaults.', 'Use ?? instead of || for nullish fallback.'], expectedOutput: 'A new merged settings object is returned without changing either input.',
    solution: "function mergeSettings(defaults, saved) {\n  const merged = { ...defaults, ...saved };\n  const pageSize = saved.preferences?.pageSize ?? defaults.preferences?.pageSize ?? 10;\n  return { ...merged, pageSize };\n}",
    evaluationChecklist: ['Creates a new object', 'Uses correct spread order', 'Uses optional chaining', 'Uses nullish fallback'], tags: ['spread', 'optional-chaining'], estimatedMinutes: 40
  }),
  task({
    topicKey: 'modern-javascript-syntax', title: 'Destructure an API User Record', difficulty: 'intermediate', relatedLessonKeys: ['destructuring'],
    description: 'Extract only the fields needed for a profile summary from nested user data.',
    requirements: ['Destructure name and role.', 'Destructure nested city.', 'Use Unknown when city is undefined.', 'Return a formatted string.'],
    starterHints: ['A nested object pattern can provide a default property value.'], expectedOutput: 'A readable name, role, and city summary is returned.',
    solution: "function userSummary(user) {\n  const { name, role, profile: { city = 'Unknown' } = {} } = user;\n  return `${name} (${role}) - ${city}`;\n}",
    evaluationChecklist: ['Uses object destructuring', 'Handles nested city', 'Provides a default', 'Returns formatted output'], tags: ['destructuring', 'template-literals'], estimatedMinutes: 35
  }),
  task({
    topicKey: 'functional-javascript', title: 'Create a Reusable Operation Wrapper', difficulty: 'intermediate', relatedLessonKeys: ['higher-order-functions'],
    description: 'Write withLogging(operation) that returns a wrapper and preserves the original function behavior.',
    requirements: ['Accept a function.', 'Return a new function.', 'Forward every argument.', 'Return the original result.'],
    starterHints: ['Use a rest parameter and spread arguments.'], expectedOutput: 'The wrapped function logs once and otherwise behaves like the original.',
    solution: "function withLogging(operation) {\n  return function (...args) {\n    console.log('Running operation');\n    return operation(...args);\n  };\n}",
    evaluationChecklist: ['Receives a function', 'Returns a function', 'Forwards arguments', 'Preserves return value'], tags: ['higher-order-functions', 'callbacks'], estimatedMinutes: 40
  }),
  task({
    topicKey: 'functional-javascript', title: 'Refactor a Mutating Cart Update', difficulty: 'intermediate', relatedLessonKeys: ['immutability-composition'],
    description: 'Return a new cart with one added item while preserving the original cart and items array.',
    requirements: ['Do not push into the original array.', 'Create a new outer cart.', 'Create a new items array.', 'Keep unrelated properties.'],
    starterHints: ['Use object spread and array spread.'], expectedOutput: 'The original cart remains unchanged and nextCart contains the item.',
    solution: "function addItem(cart, item) {\n  return { ...cart, items: [...cart.items, item] };\n}",
    evaluationChecklist: ['Does not mutate original', 'Creates a new outer object', 'Creates a new items array', 'Preserves other properties'], tags: ['immutability', 'pure-functions'], estimatedMinutes: 35
  })
];
