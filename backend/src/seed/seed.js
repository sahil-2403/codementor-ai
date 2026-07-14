import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Topic } from '../models/Topic.js';
import { Lesson } from '../models/Lesson.js';
import { QuizQuestion } from '../models/QuizQuestion.js';
import { RoadmapTemplate } from '../models/RoadmapTemplate.js';
import { LearningGoal } from '../models/LearningGoal.js';
import { CoursePlan } from '../models/CoursePlan.js';
import { Progress } from '../models/Progress.js';
import { Assessment } from '../models/Assessment.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { MentorChat } from '../models/MentorChat.js';
import { AIUsageLog } from '../models/AIUsageLog.js';
import { AIJob } from '../models/AIJob.js';
import { WeeklyReport } from '../models/WeeklyReport.js';
import { RevisionItem } from '../models/RevisionItem.js';
import { ProjectTask } from '../models/ProjectTask.js';
import { ProjectSubmission } from '../models/ProjectSubmission.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { InterviewAttempt } from '../models/InterviewAttempt.js';
import { generateSlug } from '../utils/generateSlug.js';

const clear = async () => {
  await Promise.all([
    User.deleteMany({}), Topic.deleteMany({}), Lesson.deleteMany({}), QuizQuestion.deleteMany({}), RoadmapTemplate.deleteMany({}),
    LearningGoal.deleteMany({}), CoursePlan.deleteMany({}), Progress.deleteMany({}), Assessment.deleteMany({}), QuizAttempt.deleteMany({}),
    MentorChat.deleteMany({}), AIUsageLog.deleteMany({}), AIJob.deleteMany({}), WeeklyReport.deleteMany({}), RevisionItem.deleteMany({}),
    ProjectTask.deleteMany({}), ProjectSubmission.deleteMany({}), InterviewQuestion.deleteMany({}), InterviewAttempt.deleteMany({})
  ]);
};

const topicSeeds = [
  ['JavaScript Basics', 'javascript', 'beginner'],
  ['ES6 Features', 'javascript', 'beginner'],
  ['Async JavaScript', 'javascript', 'intermediate'],
  ['React Fundamentals', 'react', 'beginner'],
  ['React Hooks', 'react', 'intermediate'],
  ['React Router', 'react', 'intermediate'],
  ['Node.js Basics', 'backend', 'beginner'],
  ['Express APIs', 'backend', 'intermediate'],
  ['MongoDB and Mongoose', 'database', 'intermediate'],
  ['Authentication and Security', 'security', 'advanced'],
  ['Full Stack Integration', 'project', 'advanced'],
  ['Interview Preparation', 'career', 'advanced']
];

const lessonSeeds = [
  {
    title: 'Variables, Scope, and Hoisting', topic: 'JavaScript Basics', difficulty: 'beginner', tags: ['javascript', 'scope', 'beginner'],
    theory: 'Variables store values. Scope decides where a variable can be accessed. Hoisting is JavaScript behavior where declarations are moved to memory before execution. var is function-scoped and initialized with undefined, while let and const are block-scoped and stay in the temporal dead zone before declaration.',
    codeExample: "console.log(a);\nvar a = 10;\n\n// console.log(b); // ReferenceError\nlet b = 20;",
    codeExplanation: 'The first console logs undefined because var declarations are hoisted and initialized. The let example throws ReferenceError if accessed before declaration because of the temporal dead zone.',
    commonMistakes: ['Thinking var and let hoist in exactly the same way', 'Using var in modern React/Node code'],
    interviewDefinition: 'Hoisting means JavaScript allocates memory for declarations before executing code.',
    interviewQuestions: [{ question: 'Difference between var, let, and const?', answer: 'var is function-scoped; let and const are block-scoped. let can be reassigned; const cannot be reassigned.' }],
    practiceTask: 'Write three examples showing function scope, block scope, and temporal dead zone.'
  },
  {
    title: 'Functions and Closures', topic: 'JavaScript Basics', difficulty: 'beginner', tags: ['javascript', 'closures'],
    theory: 'A closure is created when an inner function remembers variables from its outer function even after the outer function has finished execution.',
    codeExample: "function outer() {\n  let count = 0;\n  return function inner() {\n    count++;\n    return count;\n  };\n}\nconst counter = outer();\nconsole.log(counter());\nconsole.log(counter());",
    codeExplanation: 'inner keeps access to count because it was created inside outer. This is useful for private state, callbacks, and React hooks understanding.',
    commonMistakes: ['Thinking closure copies the value only once', 'Not understanding lexical scope'],
    interviewDefinition: 'Closure is a function bundled with its lexical environment.',
    interviewQuestions: [{ question: 'Why are closures useful?', answer: 'They help preserve state, create private variables, and power callbacks and higher-order functions.' }],
    practiceTask: 'Create a function createCounter that returns increment and reset functions.'
  },
  {
    title: 'Array Methods: map, filter, reduce', topic: 'ES6 Features', difficulty: 'beginner', tags: ['javascript', 'arrays'],
    theory: 'map transforms each item, filter selects items, and reduce converts an array into a single accumulated result.',
    codeExample: "const nums = [1, 2, 3, 4];\nconst doubled = nums.map(n => n * 2);\nconst even = nums.filter(n => n % 2 === 0);\nconst total = nums.reduce((sum, n) => sum + n, 0);",
    codeExplanation: 'These methods are heavily used in React rendering, data transformation, and backend aggregation-like logic.',
    commonMistakes: ['Using map when filter is needed', 'Forgetting to return inside callback'],
    interviewDefinition: 'Higher-order array methods accept callback functions to process array data declaratively.',
    interviewQuestions: [{ question: 'When should you use reduce?', answer: 'Use reduce when you need to accumulate array values into one result, like sum, object, grouped data, or counts.' }],
    practiceTask: 'Given users array, create a list of active user names using filter and map.'
  },
  {
    title: 'Promises and Async/Await', topic: 'Async JavaScript', difficulty: 'intermediate', tags: ['javascript', 'async'],
    theory: 'Promises represent future completion or failure of async work. async/await is syntax that makes promise-based code easier to read.',
    codeExample: "async function fetchUser() {\n  try {\n    const res = await fetch('/api/user');\n    return await res.json();\n  } catch (error) {\n    console.error(error);\n  }\n}",
    codeExplanation: 'await pauses inside the async function until the promise settles. try/catch handles errors.',
    commonMistakes: ['Forgetting await', 'Not handling rejected promises'],
    interviewDefinition: 'async/await is syntactic sugar over promises.',
    interviewQuestions: [{ question: 'Does await block the whole JavaScript thread?', answer: 'No. It pauses only the async function execution, not the entire event loop.' }],
    practiceTask: 'Write an async function that fetches posts and handles loading/error states conceptually.'
  },
  {
    title: 'React Components and Props', topic: 'React Fundamentals', difficulty: 'beginner', tags: ['react', 'components'],
    theory: 'Components are reusable UI functions. Props are data passed from parent to child component.',
    codeExample: "function UserCard({ name, role }) {\n  return <div>{name} - {role}</div>;\n}\n\n<UserCard name=\"Sahil\" role=\"Developer\" />",
    codeExplanation: 'The parent controls the values. The child receives props and uses them to render UI.',
    commonMistakes: ['Trying to modify props directly', 'Confusing props with state'],
    interviewDefinition: 'Props are read-only inputs passed to React components.',
    interviewQuestions: [{ question: 'Can child component change props?', answer: 'No. Props are read-only. Use state in parent and pass callbacks if child needs to request changes.' }],
    practiceTask: 'Create a CourseCard component that receives title, level, and progress as props.'
  },
  {
    title: 'State and Controlled Forms', topic: 'React Fundamentals', difficulty: 'beginner', tags: ['react', 'forms'],
    theory: 'State stores data that changes over time. A controlled form stores input value in React state and updates it through onChange.',
    codeExample: "const [email, setEmail] = useState('');\n<input value={email} onChange={(e) => setEmail(e.target.value)} />",
    codeExplanation: 'React state becomes the source of truth for the input value. This makes validation and submission easier.',
    commonMistakes: ['Using value without onChange', 'Storing derived data unnecessarily'],
    interviewDefinition: 'Controlled component means form input value is controlled by React state.',
    interviewQuestions: [{ question: 'Why use controlled components?', answer: 'They make form data predictable and easier to validate and submit.' }],
    practiceTask: 'Create a login form with email and password controlled inputs.'
  },
  {
    title: 'useEffect and Dependency Array', topic: 'React Hooks', difficulty: 'intermediate', tags: ['react', 'hooks', 'useEffect'],
    theory: 'useEffect runs side effects after render. The dependency array controls when the effect reruns.',
    codeExample: "useEffect(() => {\n  document.title = `Count: ${count}`;\n}, [count]);",
    codeExplanation: 'The effect runs after initial render and whenever count changes. Without dependencies, it runs after every render.',
    commonMistakes: ['Missing dependencies', 'Putting derived state in effect unnecessarily', 'Creating infinite loops'],
    interviewDefinition: 'useEffect lets React components synchronize with external systems after rendering.',
    interviewQuestions: [{ question: 'What happens with empty dependency array?', answer: 'The effect runs once after initial render, except development StrictMode may run it twice to detect side effects.' }],
    practiceTask: 'Fetch users in useEffect and display loading/error states.'
  },
  {
    title: 'React Router Basics', topic: 'React Router', difficulty: 'intermediate', tags: ['react', 'router'],
    theory: 'React Router creates client-side routes so different URLs render different components without reloading the page.',
    codeExample: "<Routes>\n  <Route path=\"/login\" element={<Login />} />\n  <Route path=\"/dashboard\" element={<Dashboard />} />\n</Routes>",
    codeExplanation: 'Route matching decides which component appears for the current path.',
    commonMistakes: ['Forgetting BrowserRouter', 'Using Navigate and useNavigate incorrectly'],
    interviewDefinition: 'React Router manages routing in single-page React applications.',
    interviewQuestions: [{ question: 'Difference between Navigate and useNavigate?', answer: 'Navigate is a component for declarative redirects. useNavigate is a hook for imperative navigation in event handlers.' }],
    practiceTask: 'Create routes for login, dashboard, and profile pages.'
  },
  {
    title: 'Node.js and Express Server', topic: 'Node.js Basics', difficulty: 'beginner', tags: ['node', 'express'],
    theory: 'Node.js runs JavaScript on the server. Express is a minimal framework for creating HTTP APIs.',
    codeExample: "import express from 'express';\nconst app = express();\napp.get('/health', (req, res) => res.json({ ok: true }));",
    codeExplanation: 'Express listens for HTTP requests and returns responses from route handlers.',
    commonMistakes: ['Forgetting express.json middleware', 'Not handling async errors'],
    interviewDefinition: 'Express is a web framework for Node.js used to build APIs and web servers.',
    interviewQuestions: [{ question: 'What is middleware?', answer: 'Middleware is a function that runs during request-response cycle and can modify req/res or stop/pass control.' }],
    practiceTask: 'Create an Express route that returns a list of courses.'
  },
  {
    title: 'REST API Design in Express', topic: 'Express APIs', difficulty: 'intermediate', tags: ['express', 'rest'],
    theory: 'REST APIs use HTTP methods and resource-based URLs to perform actions on data.',
    codeExample: "router.get('/products', listProducts);\nrouter.post('/products', createProduct);\nrouter.get('/products/:id', getProduct);",
    codeExplanation: 'GET reads data, POST creates data, PATCH updates data, DELETE removes data. Keep URLs resource-focused.',
    commonMistakes: ['Using verbs in URLs unnecessarily', 'Not using proper status codes'],
    interviewDefinition: 'REST is an architectural style for designing resource-based HTTP APIs.',
    interviewQuestions: [{ question: 'What status code for successful creation?', answer: '201 Created.' }],
    practiceTask: 'Design routes for lessons and quiz attempts.'
  },
  {
    title: 'Mongoose Models and Relationships', topic: 'MongoDB and Mongoose', difficulty: 'intermediate', tags: ['mongodb', 'mongoose'],
    theory: 'Mongoose models define schema structure for MongoDB documents. Relationships can be stored using ObjectId references and populated when needed.',
    codeExample: "const courseSchema = new Schema({\n  user: { type: Schema.Types.ObjectId, ref: 'User' },\n  lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }]\n});",
    codeExplanation: 'References store IDs. populate replaces IDs with actual document data when querying.',
    commonMistakes: ['Overusing populate', 'Not indexing frequently queried fields'],
    interviewDefinition: 'populate is a Mongoose method that replaces referenced ObjectIds with documents.',
    interviewQuestions: [{ question: 'When should you avoid populate?', answer: 'Avoid it for very large lists or performance-critical queries; consider embedding or aggregation.' }],
    practiceTask: 'Create schemas for CoursePlan and Progress with references.'
  },
  {
    title: 'JWT Authentication with Cookies', topic: 'Authentication and Security', difficulty: 'advanced', tags: ['auth', 'jwt', 'security'],
    theory: 'JWT authentication verifies user identity using signed tokens. HTTP-only cookies protect tokens from direct JavaScript access.',
    codeExample: "res.cookie('accessToken', token, { httpOnly: true, sameSite: 'lax' });",
    codeExplanation: 'The browser sends the cookie automatically. Backend verifies the JWT in protected routes.',
    commonMistakes: ['Storing sensitive tokens in localStorage', 'Forgetting CORS credentials'],
    interviewDefinition: 'JWT is a signed token format used to securely transmit claims between parties.',
    interviewQuestions: [{ question: 'Why HTTP-only cookies?', answer: 'They reduce token theft risk because client-side JavaScript cannot directly read them.' }],
    practiceTask: 'Explain access token vs refresh token flow in your own words.'
  },
  {
    title: 'Connecting React with Express APIs', topic: 'Full Stack Integration', difficulty: 'advanced', tags: ['fullstack', 'axios'],
    theory: 'Full-stack integration connects frontend actions to backend APIs using HTTP clients like Axios.',
    codeExample: "const api = axios.create({ baseURL: '/api', withCredentials: true });\nconst res = await api.get('/auth/me');",
    codeExplanation: 'withCredentials allows cookies to be sent with cross-origin requests when CORS is configured properly.',
    commonMistakes: ['Forgetting withCredentials', 'Wrong API base URL'],
    interviewDefinition: 'API integration is the process of connecting frontend UI with backend data and actions.',
    interviewQuestions: [{ question: 'Why use Axios instance?', answer: 'It centralizes base URL, credentials, headers, and interceptors.' }],
    practiceTask: 'Create axios instance and call /auth/me.'
  },
  {
    title: 'MERN Interview Problem Solving Strategy', topic: 'Interview Preparation', difficulty: 'advanced', tags: ['interview', 'mern'],
    theory: 'Interview preparation requires explaining concepts, predicting outputs, debugging code, and connecting answers to real project experience.',
    codeExample: "// Explain what happens before running code\nconsole.log(typeof test);\nfunction test() {}",
    codeExplanation: 'Function declarations are hoisted with their body, so typeof test is function.',
    commonMistakes: ['Only memorizing definitions', 'Not practicing output-based questions'],
    interviewDefinition: 'A strong interview answer includes definition, example, and real project use case.',
    interviewQuestions: [{ question: 'How do you explain a project architecture?', answer: 'Start from user workflow, then frontend, backend, database, auth, and edge cases.' }],
    practiceTask: 'Prepare a 2-minute explanation of CodeMentor AI architecture.'
  }
];

const questionSeeds = [
  ['What is hoisting?', ['Moving code physically', 'Memory allocation before execution', 'Deleting variables', 'Async behavior'], 'Memory allocation before execution', 'JavaScript allocates memory for declarations before executing code.', 'JavaScript Basics', 'beginner', ['javascript', 'scope', 'beginner']],
  ['What is a closure?', ['A function with lexical scope', 'A closed file', 'A React component', 'A database index'], 'A function with lexical scope', 'Closure means a function remembers variables from its outer scope.', 'JavaScript Basics', 'beginner', ['javascript', 'closures']],
  ['Which method transforms every array item?', ['filter', 'map', 'reduce', 'find'], 'map', 'map returns a new array by transforming each item.', 'ES6 Features', 'beginner', ['javascript', 'arrays']],
  ['What does async/await simplify?', ['CSS styling', 'Promise-based async code', 'MongoDB indexes', 'JWT signing'], 'Promise-based async code', 'async/await makes promise code look synchronous.', 'Async JavaScript', 'intermediate', ['javascript', 'async']],
  ['Props in React are:', ['Mutable by child', 'Read-only inputs', 'Database records', 'Routes'], 'Read-only inputs', 'Props are data passed from parent to child and should not be mutated by child.', 'React Fundamentals', 'beginner', ['react', 'components']],
  ['A controlled input means:', ['Value controlled by DOM only', 'Value controlled by React state', 'No onChange needed', 'Input is disabled'], 'Value controlled by React state', 'Controlled inputs store value in React state.', 'React Fundamentals', 'beginner', ['react', 'forms']],
  ['Empty dependency array in useEffect usually means:', ['Run after every render', 'Run once after initial render', 'Never run', 'Run before render'], 'Run once after initial render', 'An empty dependency array runs effect after mount.', 'React Hooks', 'intermediate', ['react', 'hooks']],
  ['useNavigate is used for:', ['Declarative redirect component', 'Programmatic navigation', 'API calls', 'Database queries'], 'Programmatic navigation', 'useNavigate lets you navigate after events like form submit.', 'React Router', 'intermediate', ['react', 'router']],
  ['Which middleware parses JSON body in Express?', ['cors()', 'helmet()', 'express.json()', 'morgan()'], 'express.json()', 'express.json parses JSON request bodies.', 'Node.js Basics', 'beginner', ['node', 'express']],
  ['Which HTTP method is commonly used to create a resource?', ['GET', 'POST', 'PATCH', 'DELETE'], 'POST', 'POST is commonly used for creation.', 'Express APIs', 'intermediate', ['express', 'rest']],
  ['Mongoose populate is used to:', ['Hash passwords', 'Replace refs with documents', 'Create JWTs', 'Start server'], 'Replace refs with documents', 'populate resolves referenced ObjectIds into documents.', 'MongoDB and Mongoose', 'intermediate', ['mongodb', 'mongoose']],
  ['Why use HTTP-only cookies for tokens?', ['Faster database queries', 'Prevent JS from reading tokens', 'Style UI', 'Generate slugs'], 'Prevent JS from reading tokens', 'HTTP-only cookies reduce XSS token theft risk.', 'Authentication and Security', 'advanced', ['auth', 'security']],
  ['Axios withCredentials is needed when:', ['Sending cookies cross-origin', 'Creating CSS', 'Using arrays', 'Writing reducers'], 'Sending cookies cross-origin', 'withCredentials sends cookies with cross-origin requests.', 'Full Stack Integration', 'advanced', ['fullstack', 'axios']],
  ['A strong interview answer should include:', ['Only definition', 'Definition, example, and project use case', 'Only code', 'Only theory'], 'Definition, example, and project use case', 'Good answers connect concept to practical usage.', 'Interview Preparation', 'advanced', ['interview', 'mern']]
];


const projectTaskSeeds = [
  {
    title: 'Build a React Login Form with Validation',
    description: 'Create a controlled React login form with email/password fields, validation messages, loading state, and clean submit handling.',
    moduleTitle: 'React Fundamentals',
    difficulty: 'beginner',
    relatedLessonSlugs: ['state-and-controlled-forms', 'react-components-and-props'],
    requirements: ['Use controlled inputs', 'Show validation errors', 'Disable submit while loading', 'Explain how form state works'],
    starterHints: ['Start with useState for email/password', 'Validate before submitting', 'Keep UI feedback visible'],
    expectedOutput: 'A login form component that handles input state and validates required fields before submit.',
    evaluationChecklist: ['Controlled inputs are used', 'Validation is handled before submit', 'Loading/disabled state exists', 'Explanation mentions why controlled components help'],
    tags: ['react', 'forms', 'frontend'],
    estimatedMinutes: 90
  },
  {
    title: 'Create an Express REST API Module',
    description: 'Design a small Express module for lessons with routes, controller, service, validation, and consistent API responses.',
    moduleTitle: 'Backend API Design',
    difficulty: 'intermediate',
    relatedLessonSlugs: ['nodejs-and-express-server', 'rest-api-design-in-express'],
    requirements: ['Create resource-based routes', 'Separate controller and service logic', 'Use validation', 'Return consistent response shape'],
    starterHints: ['Use GET and POST first', 'Keep business logic out of route files', 'Think in resources, not verbs'],
    expectedOutput: 'A small backend module that follows modular Express architecture.',
    evaluationChecklist: ['Routes are RESTful', 'Controller delegates to service', 'Validation is present', 'Errors are handled consistently'],
    tags: ['express', 'rest', 'backend'],
    estimatedMinutes: 120
  },
  {
    title: 'Implement JWT Protected Route Flow',
    description: 'Explain and sketch the frontend/backend flow for login, HTTP-only cookies, protected APIs, and logout.',
    moduleTitle: 'Authentication and Security',
    difficulty: 'advanced',
    relatedLessonSlugs: ['jwt-authentication-with-cookies', 'connecting-react-with-express-apis'],
    requirements: ['Describe login flow', 'Mention HTTP-only cookie security', 'Show protected route/API check', 'Explain logout behavior'],
    starterHints: ['Start from user submitting credentials', 'Then backend signs token and sets cookie', 'Frontend calls /auth/me to restore session'],
    expectedOutput: 'A clear implementation or architecture explanation for auth flow.',
    evaluationChecklist: ['Access token/cookie flow is clear', 'Protected API behavior is explained', 'Frontend session restore is mentioned', 'Security tradeoffs are included'],
    tags: ['auth', 'jwt', 'security', 'fullstack'],
    estimatedMinutes: 120
  },
  {
    title: 'Connect React Dashboard with Express API',
    description: 'Create a dashboard data-fetching plan using Axios/TanStack Query, loading states, error states, and protected API cookies.',
    moduleTitle: 'Full Stack Integration',
    difficulty: 'advanced',
    relatedLessonSlugs: ['connecting-react-with-express-apis', 'rest-api-design-in-express'],
    requirements: ['Use central Axios instance', 'Handle loading and error UI', 'Explain query invalidation after mutations', 'Include withCredentials behavior'],
    starterHints: ['Think server state vs UI state', 'Avoid fetching everything manually in useEffect', 'Explain what happens after a mutation succeeds'],
    expectedOutput: 'A frontend integration explanation or code sketch for a real dashboard.',
    evaluationChecklist: ['Central Axios instance is used', 'Loading/error states are considered', 'Cache invalidation is explained', 'Cookie credentials are handled'],
    tags: ['fullstack', 'axios', 'tanstack-query'],
    estimatedMinutes: 100
  }
  ,
  {
    title: 'Transform User Data with Array Methods',
    description: 'Practice map, filter, and reduce by transforming a users array into active user summaries and statistics.',
    moduleTitle: 'JavaScript Foundation',
    difficulty: 'beginner',
    topicOrder: 1,
    relatedLessonSlugs: ['array-methods-map-filter-reduce'],
    requirements: ['Filter active users', 'Map to display names', 'Reduce to a count or total', 'Explain when each method is used'],
    starterHints: ['Start with filter', 'Use map after filtering', 'Use reduce for totals'],
    expectedOutput: 'A clear JS solution using map, filter, and reduce with explanation.',
    evaluationChecklist: ['Uses correct array method for each task', 'Explains transformation flow', 'Handles empty arrays'],
    solution: 'Filter first to keep active users, map them into display objects, then reduce the original list into summary statistics. Keep each transformation small and readable.',
    tags: ['javascript', 'arrays'],
    estimatedMinutes: 60
  },
  {
    title: 'Build a useEffect Data Fetching Component',
    description: 'Create a React component that fetches data, handles loading and error states, and avoids dependency-array mistakes.',
    moduleTitle: 'React Application Patterns',
    difficulty: 'intermediate',
    topicOrder: 2,
    relatedLessonSlugs: ['useeffect-and-dependency-array'],
    requirements: ['Use useEffect for fetching', 'Show loading state', 'Show error state', 'Avoid infinite loops'],
    starterHints: ['Keep fetch function inside effect or memoize it', 'Use an empty dependency array for initial load', 'Track loading and error separately'],
    expectedOutput: 'A React component or detailed code sketch for safe API fetching.',
    evaluationChecklist: ['Effect dependencies are correct', 'Loading/error handled', 'No infinite loop risk'],
    solution: 'Use useEffect once on mount, set loading before request, catch errors, and update state only after response. Do not put fetched state as an effect dependency.',
    tags: ['react', 'hooks', 'api'],
    estimatedMinutes: 90
  },
  {
    title: 'Design a Mongoose Relationship Model',
    description: 'Model users, courses, and progress using ObjectId references and explain when populate should be used.',
    moduleTitle: 'MongoDB and Mongoose',
    difficulty: 'intermediate',
    topicOrder: 3,
    relatedLessonSlugs: ['mongoose-models-and-relationships'],
    requirements: ['Create schemas', 'Use ObjectId refs', 'Explain populate', 'Mention indexing'],
    starterHints: ['User owns many progress documents', 'CoursePlan references lessons', 'Progress references user and course'],
    expectedOutput: 'A schema design explanation with relationship decisions.',
    evaluationChecklist: ['References are correct', 'Populate tradeoff is explained', 'Indexes are considered'],
    solution: 'Use references for user/course/progress relationships and populate only when the page needs nested data. Add indexes for user/course queries.',
    tags: ['mongodb', 'mongoose', 'schema'],
    estimatedMinutes: 100
  },
  {
    title: 'Plan Secure Cookie Authentication',
    description: 'Create a complete auth plan with access tokens, refresh rotation, CSRF protection, logout-all, and CORS credentials.',
    moduleTitle: 'Authentication and Security',
    difficulty: 'advanced',
    topicOrder: 4,
    relatedLessonSlugs: ['jwt-authentication-with-cookies'],
    requirements: ['Explain access vs refresh tokens', 'Use HTTP-only cookies', 'Mention CSRF token', 'Explain refresh rotation and logout all'],
    starterHints: ['Start from login', 'Show cookie settings', 'Then protect API routes', 'Explain refresh endpoint'],
    expectedOutput: 'A secure auth workflow explanation for a MERN app.',
    evaluationChecklist: ['HTTP-only cookies are used', 'CSRF is included', 'Refresh rotation is included', 'Logout behavior is clear'],
    solution: 'Store access and refresh tokens in HTTP-only cookies, use a readable CSRF token paired with a hashed cookie, rotate refresh tokens, and validate token version for logout-all.',
    tags: ['auth', 'security', 'jwt'],
    estimatedMinutes: 120
  }

];

const interviewQuestionSeeds = [
  {
    question: 'Explain closures in JavaScript with one real use case.',
    topic: 'JavaScript Closures',
    type: 'concept',
    difficulty: 'beginner',
    expectedAnswer: 'A closure is a function bundled with its lexical scope. It can remember variables from an outer function even after that outer function finishes. A real use case is preserving private state, such as a counter function or callbacks that remember earlier values.',
    answerChecklist: ['Defines closure', 'Mentions lexical scope', 'Gives real example', 'Avoids saying it copies values only once'],
    tags: ['javascript', 'closures']
  },
  {
    question: 'What problem does useEffect solve, and what is the dependency array?',
    topic: 'React useEffect',
    type: 'concept',
    difficulty: 'intermediate',
    expectedAnswer: 'useEffect lets a component synchronize with external systems after rendering, such as APIs, subscriptions, timers, or document title changes. The dependency array controls when the effect reruns. Missing dependencies can cause stale data, while wrong dependencies can cause unnecessary rerenders or loops.',
    answerChecklist: ['Explains side effects', 'Explains dependency array', 'Mentions common mistakes', 'Gives example'],
    tags: ['react', 'hooks', 'useEffect']
  },
  {
    question: 'How would you design REST routes for a lessons module?',
    topic: 'REST API Design',
    type: 'scenario',
    difficulty: 'intermediate',
    expectedAnswer: 'Use resource-based URLs like GET /lessons, POST /lessons, GET /lessons/:id, PATCH /lessons/:id, DELETE /lessons/:id. Keep verbs out of URLs, use proper status codes, validate input, and separate route/controller/service logic.',
    answerChecklist: ['Uses resource URLs', 'Mentions HTTP methods', 'Mentions validation/status codes', 'Mentions separation of concerns'],
    tags: ['express', 'rest', 'backend']
  },
  {
    question: 'Why should JWT tokens usually not be stored in localStorage?',
    topic: 'Authentication Security',
    type: 'concept',
    difficulty: 'advanced',
    expectedAnswer: 'localStorage is accessible from JavaScript, so an XSS attack can steal tokens. HTTP-only cookies reduce this risk because client-side JavaScript cannot read them. Cookie auth still needs correct SameSite, Secure, CORS credentials, and logout handling.',
    answerChecklist: ['Mentions XSS risk', 'Explains HTTP-only cookie benefit', 'Mentions cookie config tradeoffs', 'Mentions logout/session handling'],
    tags: ['auth', 'jwt', 'security']
  },
  {
    question: 'How would you explain CodeMentor AI architecture in an interview?',
    topic: 'Project Architecture',
    type: 'system_design_lite',
    difficulty: 'advanced',
    expectedAnswer: 'Start from user workflow: onboarding, roadmap, lessons, quizzes, progress, AI mentor. Then explain React frontend, Express API, MongoDB models, JWT cookies, AI provider abstraction, usage limits, and optional BullMQ/RAG modules. Finish with fallback behavior when AI is disabled.',
    answerChecklist: ['Starts with user workflow', 'Explains frontend/backend/database', 'Mentions AI abstraction and fallback', 'Mentions production concerns like limits/jobs'],
    tags: ['interview', 'architecture', 'mern']
  }
];

const templateModules = {
  beginner: [
    ['JavaScript Foundation', 'Start with the JavaScript concepts required for React and Node.', 1, 14, ['variables-scope-and-hoisting', 'functions-and-closures', 'array-methods-map-filter-reduce'], ['javascript', 'beginner']],
    ['Async JavaScript and React Basics', 'Understand async code and start building reusable UI.', 2, 14, ['promises-and-async-await', 'react-components-and-props', 'state-and-controlled-forms'], ['react', 'beginner']],
    ['React Hooks and Routing', 'Learn the core React features used in real MERN apps.', 3, 14, ['useeffect-and-dependency-array', 'react-router-basics'], ['react', 'hooks']],
    ['Backend and Database', 'Build APIs using Express and store data in MongoDB.', 4, 21, ['nodejs-and-express-server', 'rest-api-design-in-express', 'mongoose-models-and-relationships'], ['express', 'mongodb']],
    ['Auth, Integration, and Interviews', 'Connect frontend/backend and prepare for interviews.', 5, 21, ['jwt-authentication-with-cookies', 'connecting-react-with-express-apis', 'mern-interview-problem-solving-strategy'], ['auth', 'interview']]
  ],
  intermediate: [
    ['JavaScript + Async Revision', 'Revise tricky JS and async patterns before advanced React.', 1, 10, ['functions-and-closures', 'promises-and-async-await', 'array-methods-map-filter-reduce'], ['javascript', 'async']],
    ['React Application Patterns', 'Focus on forms, hooks, routing, and API state.', 2, 14, ['state-and-controlled-forms', 'useeffect-and-dependency-array', 'react-router-basics'], ['react', 'hooks']],
    ['Backend API Design', 'Strengthen Express and database modeling.', 3, 14, ['rest-api-design-in-express', 'mongoose-models-and-relationships'], ['express', 'mongodb']],
    ['Auth + Full Stack Integration', 'Connect real frontend and backend workflows.', 4, 14, ['jwt-authentication-with-cookies', 'connecting-react-with-express-apis'], ['auth', 'fullstack']],
    ['Interview Readiness', 'Practice output questions and project explanations.', 5, 8, ['mern-interview-problem-solving-strategy'], ['interview']]
  ],
  advanced: [
    ['Advanced JS and React Weak Areas', 'Target concepts that commonly break interviews.', 1, 10, ['functions-and-closures', 'useeffect-and-dependency-array'], ['javascript', 'hooks']],
    ['Backend Architecture and Security', 'Practice real backend patterns and auth decisions.', 2, 14, ['rest-api-design-in-express', 'jwt-authentication-with-cookies'], ['express', 'auth', 'security']],
    ['Database and Full Stack Integration', 'Improve schema design and API integration clarity.', 3, 14, ['mongoose-models-and-relationships', 'connecting-react-with-express-apis'], ['mongodb', 'fullstack']],
    ['Interview and Project Defense', 'Prepare strong answers and architecture explanations.', 4, 10, ['mern-interview-problem-solving-strategy'], ['interview', 'mern']]
  ]
};

const seed = async () => {
  await connectDB();
  await clear();

  const [admin, learner] = await User.create([
    { name: 'Admin Mentor', email: 'admin@codementor.ai', password: 'Admin@123', role: 'admin', isEmailVerified: true },
    { name: 'Demo Learner', email: 'learner@codementor.ai', password: 'Learner@123', role: 'learner', isEmailVerified: true }
  ]);

  const topicDocs = {};
  for (let i = 0; i < topicSeeds.length; i += 1) {
    const [title, category, difficulty] = topicSeeds[i];
    const topic = await Topic.create({ title, category, difficulty, slug: generateSlug(title), order: i + 1, tags: [category, difficulty] });
    topicDocs[title] = topic;
  }

  const lessonDocs = {};
  for (const lesson of lessonSeeds) {
    const doc = await Lesson.create({ ...lesson, slug: generateSlug(lesson.title), topic: topicDocs[lesson.topic]._id });
    lessonDocs[doc.slug] = doc;
  }

  for (const item of questionSeeds) {
    const [question, options, correctAnswer, explanation, topicTitle, difficulty, tags] = item;
    const relatedLesson = Object.values(lessonDocs).find((lesson) => lesson.tags.some((tag) => tags.includes(tag)));
    await QuizQuestion.create({ question, type: 'mcq', options, correctAnswer, explanation, topic: topicDocs[topicTitle]._id, difficulty, relatedLesson: relatedLesson?._id, tags });
  }

  for (const level of ['beginner', 'intermediate', 'advanced']) {
    await RoadmapTemplate.create({
      goalKey: 'junior-mern-stack',
      level,
      title: `${level[0].toUpperCase()}${level.slice(1)} Junior MERN Stack Developer Roadmap`,
      description: `A ${level} roadmap for becoming job-ready in MERN stack development.`,
      estimatedDurationDays: level === 'beginner' ? 90 : level === 'intermediate' ? 60 : 45,
      modules: templateModules[level].map(([title, description, order, durationDays, lessonSlugs, quizTags]) => ({ title, description, order, durationDays, lessonSlugs, quizTags }))
    });
  }



  for (const task of projectTaskSeeds) {
    const relatedLessons = (task.relatedLessonSlugs || []).map((slug) => lessonDocs[slug]?._id).filter(Boolean);
    await ProjectTask.create({
      title: task.title,
      slug: generateSlug(task.title),
      description: task.description,
      moduleTitle: task.moduleTitle,
      topicOrder: task.topicOrder || 999,
      solution: task.solution || '',
      difficulty: task.difficulty,
      relatedLessons,
      requirements: task.requirements,
      starterHints: task.starterHints,
      expectedOutput: task.expectedOutput,
      evaluationChecklist: task.evaluationChecklist,
      tags: task.tags,
      estimatedMinutes: task.estimatedMinutes
    });
  }

  await InterviewQuestion.insertMany(interviewQuestionSeeds);

  console.log('Seed completed successfully');
  console.log('Admin:', admin.email, 'Admin@123');
  console.log('Learner:', learner.email, 'Learner@123');
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
