import { makeLesson } from './lessonFactory.js';

export const javascriptBrowserLessons = [
  makeLesson({
    key: 'dom-tree', topicKey: 'dom-fundamentals', title: 'What the DOM Is and How a Page Becomes a Tree', difficulty: 'beginner',
    theory: [
      'When a browser loads HTML, it creates an in-memory representation of the page called the Document Object Model, or DOM. The DOM represents the document as objects connected in a tree. Elements can have parent, child, and sibling relationships. JavaScript can use this tree to read or change what the user sees.',
      'The DOM is provided by the browser environment; it is not part of the core JavaScript language. That is why document exists in a browser but not in a normal Node.js script. JavaScript is the language you use to communicate with the DOM API.',
      'Thinking of the page as a tree helps you understand selectors and event propagation later. The document contains the html element, which contains head and body, and body contains the page elements written in your HTML. A nested button belongs to the container around it, which belongs to another ancestor, and so on.',
      'DOM manipulation should reflect real application state instead of randomly changing page nodes. In small examples we will update elements directly; later frameworks such as React provide another layer for describing UI state, but they still ultimately result in changes to the browser DOM.'
    ],
    codeExample: `console.log(document);\nconsole.log(document.body);\nconsole.log(document.body.children.length);`,
    codeExplanation: 'document represents the page, document.body is the body element object, and children reports the element children directly inside it.',
    commonMistakes: ['Thinking the DOM is the same thing as the original HTML source text.', 'Trying to use document in a normal Node.js environment.', 'Changing DOM nodes without understanding which element in the tree is being targeted.'],
    interviewDefinition: 'The DOM is the browser’s object-based tree representation of an HTML document that JavaScript can read and modify through browser APIs.',
    interviewQuestion: 'Is the DOM part of the core JavaScript language?', interviewAnswer: 'No. The DOM is a browser API that JavaScript can use when it runs in a browser.',
    interviewChecklist: ['Defines the DOM as an object tree', 'Mentions browser API', 'Explains JavaScript can read or modify it'],
    practiceTask: 'Open DevTools on a simple page, inspect document.body in the console, and identify one parent-child element relationship.',
    knowledgeCheck: { type: 'mcq', question: 'Who provides the document object in normal frontend JavaScript?', options: ['The browser environment', 'The const keyword', 'The JavaScript number type'], correctAnswer: 'The browser environment', explanation: 'document belongs to the browser DOM API.' },
    tags: ['javascript', 'dom', 'document', 'browser'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'dom-selectors', topicKey: 'dom-fundamentals', title: 'Selecting Elements with querySelector and querySelectorAll', difficulty: 'beginner',
    theory: [
      'Before JavaScript can update an element, it needs a reference to that DOM node. document.querySelector uses a CSS selector and returns the first matching element. document.querySelectorAll returns a static NodeList containing all matching elements.',
      'Because selectors use normal CSS selector syntax, you can target an id with #id, a class with .className, an element name such as button, or a more specific combination. Specific selectors make it less likely that future page changes accidentally target the wrong element.',
      'querySelector returns null when nothing matches. Code should consider that possibility instead of immediately assuming a node exists. In small controlled pages, the element may always be present, but reusable scripts and dynamically rendered interfaces benefit from safe checks.',
      'A NodeList from querySelectorAll can be iterated with forEach or converted to an array when array-specific operations are needed. Do not confuse one selected element with a collection of elements; their available properties and methods differ.'
    ],
    codeExample: `const title = document.querySelector('#page-title');\nconst buttons = document.querySelectorAll('.action-button');\n\nif (title) {\n  console.log(title.textContent);\n}\n\nbuttons.forEach((button) => console.log(button.textContent));`,
    codeExplanation: 'The id selector returns one element or null. The class selector returns a collection, which is iterated with forEach.',
    commonMistakes: ['Calling an element method on the NodeList returned by querySelectorAll.', 'Forgetting that querySelector may return null.', 'Using a selector that is so broad it matches an unintended element.'],
    interviewDefinition: 'querySelector returns the first element matching a CSS selector, while querySelectorAll returns a collection of all matching elements.',
    interviewQuestion: 'What does querySelector return when no element matches?', interviewAnswer: 'It returns null.',
    interviewChecklist: ['Explains first-match behavior', 'Explains querySelectorAll collection', 'Mentions null for no match'],
    practiceTask: 'Select one heading by id and all list items by class, then print their text content.',
    knowledgeCheck: { type: 'short_answer', question: 'What does document.querySelector return when nothing matches?', correctAnswer: 'null', explanation: 'querySelector returns null when no matching element exists.' },
    tags: ['javascript', 'dom', 'queryselector', 'selectors'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'dom-content-attributes-styles', topicKey: 'dom-fundamentals', title: 'Reading and Updating Content, Attributes and Styles', difficulty: 'beginner',
    theory: [
      'A selected DOM element exposes properties and methods for reading and changing page state. textContent reads or writes plain text. classList adds, removes, toggles, and checks CSS classes. setAttribute and getAttribute work with attributes such as aria-label or data values, although many common attributes also have direct properties.',
      'Prefer textContent when inserting ordinary text because it treats the value as text rather than HTML markup. innerHTML can create HTML from a string, but using untrusted data with innerHTML can introduce security problems such as cross-site scripting. Learn safe text updates first.',
      'Styles can be changed through element.style, but adding or removing CSS classes is often cleaner because presentation rules remain in CSS. JavaScript can decide the state—such as active or error—and CSS can decide how that state looks.',
      'DOM updates are immediate from the page’s point of view. If many values represent one application state, keep the data logic clear so the UI does not become a collection of unrelated manual changes.'
    ],
    codeExample: `const status = document.querySelector('#status');\nif (status) {\n  status.textContent = 'Ready';\n  status.classList.add('is-ready');\n  status.setAttribute('aria-live', 'polite');\n}`,
    codeExplanation: 'The code safely checks the element, replaces its text, adds a CSS state class, and updates an accessibility attribute.',
    commonMistakes: ['Using innerHTML with untrusted user input.', 'Putting all visual styling directly into JavaScript instead of using classes.', 'Updating a selector result without checking whether it exists.'],
    interviewDefinition: 'DOM element APIs let JavaScript update text, attributes, classes, and inline styles after selecting a node.',
    interviewQuestion: 'Why is textContent safer than innerHTML for ordinary user text?', interviewAnswer: 'textContent treats the value as text rather than parsing it as HTML, reducing the risk of injecting markup or scripts.',
    interviewChecklist: ['Mentions textContent', 'Explains classList or attributes', 'Mentions innerHTML security concern'],
    practiceTask: 'Select a status element, update its text, toggle a success class, and set one accessibility attribute.',
    knowledgeCheck: { type: 'mcq', question: 'Which property is usually appropriate for inserting plain text?', options: ['textContent', 'innerHTML with any user input', 'window.location'], correctAnswer: 'textContent', explanation: 'textContent inserts plain text without parsing HTML.' },
    tags: ['javascript', 'dom', 'textcontent', 'classlist'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'dom-create-remove', topicKey: 'dom-fundamentals', title: 'Creating, Appending and Removing Elements', difficulty: 'beginner',
    theory: [
      'JavaScript can create new DOM elements when the page needs to reflect changing data. document.createElement creates an element object but does not automatically place it on the page. You configure the element first and then append it to an existing parent with append, appendChild, or another insertion method.',
      'Building elements through DOM APIs keeps data and markup handling explicit. For a list item, you can create li, set its textContent, add a class, then append it to the list. The returned object remains the same DOM node after it is inserted, so you can keep a reference when later updates are needed.',
      'remove deletes an element from its current parent. Replacing an entire list can be done by clearing the container and rendering the current data again, while targeted updates can insert or remove only changed items. The right approach depends on the application size and framework.',
      'Avoid repeatedly inserting unsanitized HTML strings just because they are shorter to type. Learning createElement and textContent gives you a safe, predictable foundation for dynamic interfaces.'
    ],
    codeExample: `const list = document.querySelector('#topics');\nif (list) {\n  const item = document.createElement('li');\n  item.textContent = 'Functions';\n  item.classList.add('topic-item');\n  list.append(item);\n}`,
    codeExplanation: 'The li is created in memory, configured, and only then appended to the selected list on the page.',
    commonMistakes: ['Expecting createElement to automatically show the node on the page.', 'Building untrusted content with HTML strings.', 'Removing an element and then assuming it still has the same parent relationship.'],
    interviewDefinition: 'Dynamic DOM creation usually follows create, configure, then insert; elements can later be updated or removed through their node APIs.',
    interviewQuestion: 'Does document.createElement immediately add the new element to the page?', interviewAnswer: 'No. It creates the element object; the code must append or insert it into the document tree.',
    interviewChecklist: ['Mentions createElement', 'Mentions insertion step', 'Mentions safe text configuration'],
    practiceTask: 'Render three topic names into an empty ul by creating one li per topic.',
    knowledgeCheck: { type: 'short_answer', question: 'Which method creates an element object without inserting it?', correctAnswer: 'document.createElement', explanation: 'createElement creates the node; a separate append or insertion call places it in the DOM.' },
    tags: ['javascript', 'dom', 'createelement', 'append', 'remove'], estimatedMinutes: 55
  }),

  makeLesson({
    key: 'event-listeners', topicKey: 'events-interaction', title: 'Listening for Browser Events', difficulty: 'beginner',
    theory: [
      'Browser interfaces are event-driven. The browser produces events when the user clicks, types, submits a form, moves focus, resizes the window, or when other browser activity occurs. JavaScript responds by registering event listeners.',
      'addEventListener takes an event type and a callback function. The callback is not executed when the listener is registered; the browser calls it later when the event occurs. This is one of the first practical examples of functions being passed as values.',
      'Keep event handlers focused. A click handler can read current data, call a separate function to calculate a result, and then update the DOM. Moving complex business logic out of the handler makes the behavior easier to test and reuse.',
      'The same element can have listeners for different event types, and the same handler can sometimes be reused. removeEventListener can detach a listener when you have the same function reference that was originally registered.'
    ],
    codeExample: `const button = document.querySelector('#save');\n\nfunction handleSave() {\n  console.log('Saved');\n}\n\nbutton?.addEventListener('click', handleSave);`,
    codeExplanation: 'The callback is passed to addEventListener without calling it. The browser invokes handleSave later when the selected button is clicked.',
    commonMistakes: ['Writing handleSave() instead of handleSave when registering and therefore calling it immediately.', 'Putting all application logic directly inside one large event handler.', 'Trying to remove an anonymous listener later without keeping its function reference.'],
    interviewDefinition: 'An event listener registers a callback that the browser invokes when a matching event occurs.',
    interviewQuestion: 'Why do we pass a function to addEventListener instead of calling it immediately?', interviewAnswer: 'Because the browser needs the function reference so it can call that function later when the event occurs.',
    interviewChecklist: ['Explains event-driven behavior', 'Mentions callback reference', 'Explains later browser invocation'],
    practiceTask: 'Add click listeners to two buttons that call the same named handler and print which button was clicked.',
    knowledgeCheck: { type: 'mcq', question: 'What should normally be passed as the second argument to addEventListener?', options: ['A function reference', 'The result of calling the handler immediately', 'A CSS selector only'], correctAnswer: 'A function reference', explanation: 'The browser stores the callback and calls it when the event occurs.' },
    tags: ['javascript', 'events', 'addeventlistener'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'event-object-input', topicKey: 'events-interaction', title: 'The Event Object and Common Input Events', difficulty: 'beginner',
    theory: [
      'When the browser invokes an event listener, it passes an event object describing what happened. Properties such as event.type and event.target provide useful context. target usually refers to the element where the event began.',
      'Input-related events have different meanings. input fires as a text field value changes. change usually represents a committed change and behaves differently across control types. click represents pointer or keyboard activation of clickable controls. submit belongs to forms rather than individual submit buttons.',
      'The event object lets one handler read the current input value or determine which element triggered an action. Avoid storing duplicate state unnecessarily when the current value can be read directly at the correct boundary.',
      'Do not assume target always has every property you want. The exact target depends on where the event started. Event delegation later makes this especially important because a container listener may receive events originating from different child elements.'
    ],
    codeExample: `const search = document.querySelector('#search');\nsearch?.addEventListener('input', (event) => {\n  console.log('Search text:', event.target.value);\n});`,
    codeExplanation: 'The input event fires as the field changes. event.target is the input element, and value contains its current text.',
    commonMistakes: ['Using a click event when the requirement is to react to text input changes.', 'Assuming event.target is always the element where the listener is attached.', 'Reading an event object asynchronously after code has changed the related UI without thinking about current state.'],
    interviewDefinition: 'The event object contains information about an event, including its type and the element where it originated.',
    interviewQuestion: 'What is event.target?', interviewAnswer: 'It is usually the element where the event originated.',
    interviewChecklist: ['Defines event object', 'Explains target', 'Names a common event type and its use'],
    practiceTask: 'Listen to an input field and update a separate preview element with the current value.',
    knowledgeCheck: { type: 'short_answer', question: 'Which common event fires while a text input value changes?', correctAnswer: 'input', explanation: 'The input event fires as the control value is modified.' },
    tags: ['javascript', 'events', 'event-object', 'input'], estimatedMinutes: 50
  }),
  makeLesson({
    key: 'event-propagation', topicKey: 'events-interaction', title: 'Event Bubbling, Capturing and stopPropagation', difficulty: 'beginner',
    theory: [
      'Events move through the DOM tree. During the capturing phase, an event can travel from outer ancestors toward the target. After reaching the target, the bubbling phase travels back outward through ancestors. Most normal addEventListener usage listens during bubbling unless configured otherwise.',
      'Bubbling explains why clicking a button inside a card can also trigger a click listener on the card. This is not the browser “clicking twice”; it is one event being observed at more than one point in its propagation path.',
      'event.stopPropagation can stop further propagation, but it should be used only when the interaction truly requires that behavior. Overusing it can make components difficult to combine because parent listeners unexpectedly stop receiving events.',
      'Understanding propagation prepares you for event delegation, where bubbling is used intentionally. Rather than treating bubbling as a problem to disable, first decide whether parent and child handlers should both respond and structure the interface accordingly.'
    ],
    codeExample: `const card = document.querySelector('.card');\nconst button = document.querySelector('.card button');\n\ncard?.addEventListener('click', () => console.log('card'));\nbutton?.addEventListener('click', () => console.log('button'));`,
    codeExplanation: 'Clicking the button normally runs the button listener and then the card listener as the event bubbles through the ancestor.',
    commonMistakes: ['Thinking bubbling means separate events are created.', 'Calling stopPropagation everywhere instead of designing event responsibilities.', 'Ignoring nested clickable elements when adding parent listeners.'],
    interviewDefinition: 'Event propagation describes how an event travels through capturing, target, and bubbling phases in the DOM tree.',
    interviewQuestion: 'Why can a parent click listener run when a child button is clicked?', interviewAnswer: 'Because the same click event normally bubbles from the target through its ancestor elements.',
    interviewChecklist: ['Mentions bubbling', 'Mentions DOM ancestors', 'Explains stopPropagation cautiously'],
    practiceTask: 'Create a container with a button, add listeners to both, and observe the order before and after calling stopPropagation.',
    knowledgeCheck: { type: 'mcq', question: 'What normally happens after an event reaches its target?', options: ['It can bubble through ancestors', 'The DOM is destroyed', 'All parent listeners are removed'], correctAnswer: 'It can bubble through ancestors', explanation: 'Most DOM events bubble upward after the target phase.' },
    tags: ['javascript', 'events', 'bubbling', 'propagation'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'event-delegation', topicKey: 'events-interaction', title: 'Event Delegation for Dynamic Lists', difficulty: 'beginner',
    theory: [
      'Event delegation uses event bubbling to handle interactions from several child elements with one listener on a stable ancestor. Instead of registering a separate click listener on every list item, the parent list can listen for clicks and inspect event.target.',
      'Delegation is especially useful when child elements are added later. A listener attached directly to elements that existed earlier does not automatically attach itself to newly created elements, but the parent listener continues receiving events that bubble from new descendants.',
      'target.closest(selector) is useful when the user may click an icon or span inside a button. closest walks from the target toward its ancestors until it finds a matching element. After finding the actionable child, code should verify it belongs to the intended container before acting.',
      'Do not delegate everything to the document. Choose the nearest stable ancestor that owns the interaction. This keeps the handler’s responsibility local and avoids unrelated page clicks flowing through one giant event switch.'
    ],
    codeExample: `const list = document.querySelector('#tasks');\nlist?.addEventListener('click', (event) => {\n  const button = event.target.closest('[data-remove-id]');\n  if (!button || !list.contains(button)) return;\n  console.log('Remove:', button.dataset.removeId);\n});`,
    codeExplanation: 'One list listener handles clicks from current or future remove buttons. closest finds the actionable button even when a nested child was clicked.',
    commonMistakes: ['Assuming event.target is always the button itself.', 'Delegating at document level when a smaller stable container is available.', 'Acting on a closest match without checking that it belongs to the intended container.'],
    interviewDefinition: 'Event delegation places one listener on an ancestor and uses bubbling to handle events from matching descendant elements.',
    interviewQuestion: 'Why does event delegation work for dynamically added child elements?', interviewAnswer: 'Because their events still bubble to the already-listening ancestor even though the child did not exist when the listener was registered.',
    interviewChecklist: ['Mentions ancestor listener', 'Mentions bubbling', 'Mentions dynamic children or target matching'],
    practiceTask: 'Build a list with remove buttons and use one parent click listener to identify which item should be removed.',
    knowledgeCheck: { type: 'short_answer', question: 'Which event behavior makes event delegation possible?', correctAnswer: 'bubbling', explanation: 'Delegation relies on descendant events bubbling to an ancestor listener.' },
    tags: ['javascript', 'events', 'delegation', 'closest'], estimatedMinutes: 60
  }),

  makeLesson({
    key: 'form-submit-formdata', topicKey: 'forms-browser-data', title: 'Form Submission, preventDefault and FormData', difficulty: 'beginner',
    theory: [
      'HTML forms provide built-in structure for collecting user input and submitting it. JavaScript commonly listens to the form’s submit event instead of only listening to the submit button. That correctly handles mouse clicks, keyboard submission, and other valid ways a form can be submitted.',
      'Browsers normally perform the form’s default submission behavior, which may navigate or reload the page. event.preventDefault stops that default action so JavaScript can validate, send data with fetch later, or update the interface without navigation.',
      'FormData can collect named form controls into a convenient object. You can read values with formData.get(name) or convert entries into a normal object for application logic. Remember that ordinary form values are usually strings unless you explicitly convert them.',
      'Keep form-handling steps separate: read input, normalize or convert values, validate them, perform the intended action, then show success or errors. This sequence keeps UI behavior understandable and prepares you for real API forms later.'
    ],
    codeExample: `const form = document.querySelector('#profile-form');\nform?.addEventListener('submit', (event) => {\n  event.preventDefault();\n  const data = new FormData(form);\n  console.log(data.get('name'));\n});`,
    codeExplanation: 'The listener is attached to the form. preventDefault keeps the page in place, and FormData reads controls by their name attributes.',
    commonMistakes: ['Listening only to the button click and missing keyboard form submission.', 'Forgetting preventDefault when JavaScript should handle the submission.', 'Assuming numeric-looking form values are already numbers.'],
    interviewDefinition: 'The submit event represents form submission; preventDefault can stop browser navigation, and FormData reads named form controls.',
    interviewQuestion: 'Why is listening to submit usually better than only listening to a submit button click?', interviewAnswer: 'The form submit event covers all valid submission methods, including pressing Enter, not just one button interaction.',
    interviewChecklist: ['Mentions submit event', 'Explains preventDefault', 'Explains FormData or string inputs'],
    practiceTask: 'Create a form submit handler that reads name and age, prevents navigation, and converts age to a number.',
    knowledgeCheck: { type: 'short_answer', question: 'Which event method stops a form’s normal browser submission behavior?', correctAnswer: 'preventDefault', explanation: 'event.preventDefault() stops the event’s default browser action.' },
    tags: ['javascript', 'forms', 'submit', 'formdata'], estimatedMinutes: 55
  }),
  makeLesson({
    key: 'form-validation', topicKey: 'forms-browser-data', title: 'Validating and Normalizing Form Input', difficulty: 'beginner',
    theory: [
      'Validation checks whether input satisfies the rules required by the application. A required name should not become an empty string after trimming. An age may need to be a valid number within a reasonable range. An email field may need both browser-level constraints and server-side validation before it is trusted.',
      'Normalization prepares input into a consistent form before validation or storage. Trimming surrounding whitespace and converting numeric text are common examples. Performing these steps explicitly prevents later code from repeatedly handling several equivalent forms of the same value.',
      'Client-side validation improves user experience but does not replace server-side validation. Browser code can be changed or bypassed, so any security or data-integrity rule must also be enforced on the server. The frontend should help the user; the backend must protect the system.',
      'Validation messages should tell the user what needs to change. “Age must be a number from 13 to 120” is more useful than “Invalid input.” Keep validation logic separate from DOM rendering so the same rule is easier to test.'
    ],
    codeExample: `function validateAge(rawAge) {\n  const age = Number(rawAge);\n  if (Number.isNaN(age)) return 'Age must be a number';\n  if (age < 13 || age > 120) return 'Age must be between 13 and 120';\n  return null;\n}`,
    codeExplanation: 'The function converts once, checks conversion failure, checks the allowed range, and returns a clear error message or null.',
    commonMistakes: ['Trusting browser validation as the only security check.', 'Validating before normalizing obvious whitespace or numeric text.', 'Displaying vague errors that do not tell the learner how to fix the input.'],
    interviewDefinition: 'Validation checks input against application rules, while normalization converts input into a consistent representation before use.',
    interviewQuestion: 'Why is frontend validation not enough by itself?', interviewAnswer: 'Because client code can be bypassed or modified, so the server must enforce data-integrity and security rules too.',
    interviewChecklist: ['Defines validation', 'Explains normalization', 'Mentions server-side validation'],
    practiceTask: 'Write validateName and validateAge functions that return a helpful error message or null.',
    knowledgeCheck: { type: 'mcq', question: 'Where must important data-integrity validation also happen?', options: ['On the server', 'Only in CSS', 'Only in localStorage'], correctAnswer: 'On the server', explanation: 'Client-side checks can be bypassed, so the server must enforce important rules.' },
    tags: ['javascript', 'forms', 'validation', 'normalization'], estimatedMinutes: 60
  }),
  makeLesson({
    key: 'localstorage-json', topicKey: 'forms-browser-data', title: 'Saving Browser Data with localStorage and JSON', difficulty: 'beginner',
    theory: [
      'localStorage is a browser-provided key-value storage API. Values remain available after page reloads for the same origin until they are removed or browser data is cleared. It is useful for small preferences, simple draft state, and learning exercises, but it is not a secure place for sensitive secrets.',
      'localStorage stores strings. setItem(key, value) saves a string, getItem(key) returns the saved string or null, and removeItem deletes a key. If you want to store an object or array, convert it to JSON text with JSON.stringify and parse it back with JSON.parse when reading.',
      'JSON parsing can fail if stored text is corrupted or does not contain valid JSON. Real code should handle that possibility instead of assuming every stored value is valid forever. Version changes can also make old stored shapes incompatible with new application code.',
      'Never store passwords, access tokens without understanding the security model, or highly sensitive information simply because localStorage is convenient. For this course, use it for harmless learning data such as theme preference or a small todo list.'
    ],
    codeExample: `const preferences = { theme: 'dark', compact: true };\nlocalStorage.setItem('preferences', JSON.stringify(preferences));\n\nconst raw = localStorage.getItem('preferences');\nconst saved = raw ? JSON.parse(raw) : null;\nconsole.log(saved);`,
    codeExplanation: 'The object is converted to JSON text before storage and parsed back into a JavaScript object when read.',
    commonMistakes: ['Trying to store an object directly and getting "[object Object]".', 'Assuming getItem always returns a value instead of possibly null.', 'Using localStorage for sensitive information without considering security.'],
    interviewDefinition: 'localStorage is browser string-based persistent key-value storage; objects and arrays are commonly serialized with JSON.',
    interviewQuestion: 'Why do objects usually need JSON.stringify before localStorage?', interviewAnswer: 'Because localStorage stores string values, so the object must be serialized into text first.',
    interviewChecklist: ['Mentions string storage', 'Explains JSON stringify/parse', 'Mentions persistence or security limitation'],
    practiceTask: 'Save a small settings object to localStorage, reload it safely, and provide a default when no value exists.',
    knowledgeCheck: { type: 'short_answer', question: 'What does localStorage.getItem return when a key does not exist?', correctAnswer: 'null', explanation: 'Missing localStorage keys return null.' },
    tags: ['javascript', 'localstorage', 'json', 'browser-storage'], estimatedMinutes: 60
  }),
  makeLesson({
    key: 'persistent-browser-flow', topicKey: 'forms-browser-data', title: 'Building a Small Persistent Browser Flow', difficulty: 'beginner',
    theory: [
      'A useful beginner application combines several concepts instead of adding new syntax. A persistent preference form can read initial data from localStorage, fill the form, validate user changes, update a JavaScript object, save it, and render the current preference back into the page.',
      'This flow shows why separation matters. One function can load data, another can validate it, another can save it, and another can render it. The submit handler coordinates those pieces instead of containing every rule itself. That makes the program easier to debug because each function has a clear job.',
      'Application state should have one understandable source at a time. If the current preference object is in memory, render from that value. Save it after a valid update. On reload, initialize the state from storage. Avoid independently changing the DOM and storage in several unrelated places because they can become inconsistent.',
      'This pattern is a bridge to frameworks such as React. Frameworks automate parts of UI synchronization, but the underlying thinking remains the same: receive input, validate it, update state, persist when appropriate, and render the current state.'
    ],
    codeExample: `function saveTheme(theme) {\n  localStorage.setItem('theme', theme);\n}\n\nfunction loadTheme() {\n  return localStorage.getItem('theme') ?? 'light';\n}\n\nconst currentTheme = loadTheme();\ndocument.body.dataset.theme = currentTheme;`,
    codeExplanation: 'Storage access is separated into small functions. The loaded value becomes the current state used to update the page.',
    commonMistakes: ['Updating the DOM and storage in unrelated places with no single state flow.', 'Putting loading, validation, saving, and rendering into one huge event handler.', 'Failing to provide safe defaults for first-time visitors.'],
    interviewDefinition: 'A simple browser state flow reads initial data, validates user input, updates in-memory state, persists when needed, and renders the current state consistently.',
    interviewQuestion: 'Why split form loading, validation, saving, and rendering into separate functions?', interviewAnswer: 'Each function gets one clear responsibility, which makes the flow easier to test, reuse, and debug.',
    interviewChecklist: ['Explains state flow', 'Mentions separated responsibilities', 'Mentions persistence and rendering consistency'],
    practiceTask: 'Build a theme preference form that loads a saved value, validates the selection, saves it, and applies it to the page.',
    knowledgeCheck: { type: 'mcq', question: 'Which order best describes a clean form update flow?', options: ['Read input → validate → update state → save/render', 'Save invalid input first → validate later', 'Change random DOM nodes → guess the state'], correctAnswer: 'Read input → validate → update state → save/render', explanation: 'A predictable flow keeps validation and state changes explicit.' },
    tags: ['javascript', 'forms', 'localstorage', 'state-flow'], estimatedMinutes: 65
  })
];
