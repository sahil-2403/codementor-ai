import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Technology } from '../models/Technology.js';
import { Course } from '../models/Course.js';
import { LearningPath } from '../models/LearningPath.js';
import { Topic } from '../models/Topic.js';
import { Lesson } from '../models/Lesson.js';
import { QuizQuestion } from '../models/QuizQuestion.js';
import { RoadmapTemplate } from '../models/RoadmapTemplate.js';
import { ProjectTask } from '../models/ProjectTask.js';
import { InterviewQuestion } from '../models/InterviewQuestion.js';
import { generateSlug } from '../utils/generateSlug.js';

const levels = ['beginner', 'intermediate', 'advanced'];

const technologyDefinitions = [
  { name: 'JavaScript', type: 'language', description: 'The core language for browser and Node.js development.' },
  { name: 'Java', type: 'language', description: 'A strongly typed language used across backend and enterprise development.' },
  { name: 'React', type: 'framework', parent: 'JavaScript', description: 'A frontend library for component-based user interfaces.' },
  { name: 'Node.js', type: 'runtime', parent: 'JavaScript', description: 'A JavaScript runtime for backend applications.' },
  { name: 'Express', type: 'framework', parent: 'Node.js', description: 'A lightweight Node.js framework for web APIs.' },
  { name: 'MongoDB', type: 'database', description: 'A document database commonly used with JavaScript stacks.' },
  { name: 'Spring Boot', type: 'framework', parent: 'Java', description: 'A Java framework for production backend applications.' },
  { name: 'PostgreSQL', type: 'database', description: 'A relational database used across backend stacks.' }
];

const courseDefinitions = [
  { title: 'Complete JavaScript', category: 'fundamentals', primary: 'JavaScript', technologies: ['JavaScript'], description: 'Build strong JavaScript fundamentals from syntax and functions through asynchronous application patterns.' },
  { title: 'React Developer', category: 'frontend', primary: 'React', technologies: ['JavaScript', 'React'], description: 'Learn React independently through components, state, hooks, routing, forms, and API integration.' },
  { title: 'Node.js Backend', category: 'backend', primary: 'Node.js', technologies: ['JavaScript', 'Node.js', 'Express', 'MongoDB'], description: 'Build backend APIs with Node.js, Express, persistence, authentication, and production patterns.' },
  { title: 'MERN Full Stack', category: 'fullstack', primary: 'JavaScript', technologies: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'], description: 'Connect React, Node.js, Express, and MongoDB into complete full-stack applications.' },
  { title: 'Complete Java', category: 'fundamentals', primary: 'Java', technologies: ['Java'], description: 'Learn Java syntax, object-oriented programming, collections, exceptions, and application design.' },
  { title: 'Spring Boot Backend', category: 'backend', primary: 'Spring Boot', technologies: ['Java', 'Spring Boot', 'PostgreSQL'], description: 'Build REST APIs with Spring Boot, persistence, validation, security, and PostgreSQL.' },
  { title: 'Java Full Stack', category: 'fullstack', primary: 'Java', technologies: ['Java', 'Spring Boot', 'JavaScript', 'React', 'PostgreSQL'], description: 'Build full-stack applications with Spring Boot APIs, React interfaces, and PostgreSQL persistence.' }
];

const lessonTitleFor = (courseTitle, level) => `${courseTitle}: ${level[0].toUpperCase()}${level.slice(1)} Core`;

const ensureFreshDatabase = async () => {
  const existingUsers = await User.countDocuments();
  const existingCourses = await Course.countDocuments();
  if (existingUsers || existingCourses) {
    throw new Error('Seed expects a fresh development database. Clear the development database first, then run npm run seed.');
  }
};

const seed = async () => {
  await connectDB();
  await ensureFreshDatabase();

  const [admin, learner] = await User.create([
    { name: 'Admin Mentor', email: 'admin@codementor.ai', password: 'Admin@123', role: 'admin', isEmailVerified: true },
    { name: 'Demo Learner', email: 'learner@codementor.ai', password: 'Learner@123', role: 'learner', isEmailVerified: true }
  ]);

  const technologyByName = new Map();
  for (let index = 0; index < technologyDefinitions.length; index += 1) {
    const definition = technologyDefinitions[index];
    const technology = await Technology.create({
      name: definition.name,
      slug: generateSlug(definition.name),
      type: definition.type,
      description: definition.description,
      parentTechnology: definition.parent ? technologyByName.get(definition.parent)?._id || null : null,
      iconKey: generateSlug(definition.name),
      order: index + 1,
      status: 'published'
    });
    technologyByName.set(definition.name, technology);
  }

  const courseByTitle = new Map();
  for (let index = 0; index < courseDefinitions.length; index += 1) {
    const definition = courseDefinitions[index];
    const course = await Course.create({
      title: definition.title,
      slug: generateSlug(definition.title),
      description: definition.description,
      category: definition.category,
      technologies: definition.technologies.map((name) => technologyByName.get(name)._id),
      primaryTechnology: technologyByName.get(definition.primary)._id,
      availableLevels: levels,
      featured: ['React Developer', 'MERN Full Stack', 'Java Full Stack'].includes(definition.title),
      order: index + 1,
      status: 'published'
    });
    courseByTitle.set(definition.title, course);
  }

  await Course.updateOne({ _id: courseByTitle.get('React Developer')._id }, { recommendedPrerequisites: [courseByTitle.get('Complete JavaScript')._id] });
  await Course.updateOne({ _id: courseByTitle.get('Node.js Backend')._id }, { recommendedPrerequisites: [courseByTitle.get('Complete JavaScript')._id] });
  await Course.updateOne({ _id: courseByTitle.get('Spring Boot Backend')._id }, { recommendedPrerequisites: [courseByTitle.get('Complete Java')._id] });

  for (const definition of courseDefinitions) {
    const course = courseByTitle.get(definition.title);
    const technologyIds = definition.technologies.map((name) => technologyByName.get(name)._id);
    const topic = await Topic.create({
      course: course._id,
      technologies: technologyIds,
      title: `${definition.title} Foundations`,
      slug: generateSlug(`${definition.title} Foundations`),
      category: definition.category,
      difficulty: 'beginner',
      tags: [generateSlug(definition.title), definition.category],
      order: 1,
      status: 'active'
    });

    const lessons = {};
    for (const level of levels) {
      const title = lessonTitleFor(definition.title, level);
      lessons[level] = await Lesson.create({
        course: course._id,
        technologies: technologyIds,
        title,
        slug: generateSlug(title),
        topic: topic._id,
        difficulty: level,
        theory: `${title} explains the essential concepts, decisions, and implementation patterns a ${level} learner needs in this course.`,
        codeExample: level === 'beginner' ? 'const concept = "practice";\nconsole.log(concept);' : '',
        codeExplanation: level === 'beginner' ? 'This small example represents practicing the course concept with executable code.' : '',
        commonMistakes: ['Skipping fundamentals before combining concepts'],
        interviewDefinition: `${definition.title} concepts should be explained with a definition, example, and practical use case.`,
        interviewQuestions: [{ question: `What is one important ${definition.title} concept?`, answer: 'Explain the core idea and connect it to a practical application.' }],
        practiceTask: `Build a small ${level} exercise using concepts from ${definition.title}.`,
        tags: [generateSlug(definition.title), level],
        estimatedMinutes: 45,
        status: 'published'
      });

      const quizTag = `${generateSlug(definition.title)}-${level}`;
      await QuizQuestion.create({
        course: course._id,
        technologies: technologyIds,
        question: `Which statement best represents ${level} practice in ${definition.title}?`,
        bank: 'quiz',
        type: 'mcq',
        options: ['Understand the concept and apply it', 'Only memorize terminology', 'Skip testing the implementation'],
        correctAnswer: 'Understand the concept and apply it',
        explanation: 'Course quizzes check whether the learner can connect a concept to practical implementation.',
        topic: topic._id,
        difficulty: level,
        relatedLesson: lessons[level]._id,
        tags: [quizTag, generateSlug(definition.title)],
        status: 'published'
      });

      if (level !== 'beginner') {
        await QuizQuestion.create({
          course: course._id,
          technologies: technologyIds,
          question: `Diagnostic ${level} question for ${definition.title}: what should guide an implementation decision?`,
          bank: 'skill_check',
          type: 'mcq',
          options: ['Requirements and tradeoffs', 'Random preference', 'Avoiding documentation'],
          correctAnswer: 'Requirements and tradeoffs',
          explanation: 'Skill checks measure whether the learner can reason about implementation decisions at the selected level.',
          topic: topic._id,
          difficulty: level,
          relatedLesson: null,
          tags: [generateSlug(definition.title), 'diagnostic', level],
          status: 'published'
        });
      }

      await RoadmapTemplate.create({
        course: course._id,
        level,
        title: `${definition.title} — ${level[0].toUpperCase()}${level.slice(1)} Roadmap`,
        description: `A ${level} roadmap for ${definition.title}.`,
        modules: [{ title: `${level[0].toUpperCase()}${level.slice(1)} Core Module`, description: `Build the ${level} foundation for ${definition.title}.`, order: 1, durationDays: level === 'beginner' ? 21 : 14, lessons: [lessons[level]._id], quizTags: [quizTag] }],
        estimatedDurationDays: level === 'beginner' ? 21 : 14,
        status: 'published'
      });
    }

    await ProjectTask.create({
      course: course._id,
      technologies: technologyIds,
      title: `${definition.title} Practice Project`,
      slug: generateSlug(`${definition.title} Practice Project`),
      description: `Build a focused project that demonstrates the core workflow of ${definition.title}.`,
      moduleTitle: 'Core Module',
      difficulty: 'beginner',
      relatedLessons: [lessons.beginner._id],
      requirements: ['Use the main course concepts', 'Explain the implementation decisions'],
      starterHints: ['Start with the smallest working version'],
      expectedOutput: 'A working implementation and short explanation.',
      evaluationChecklist: ['Core feature works', 'Implementation is explained'],
      tags: [generateSlug(definition.title), 'project'],
      estimatedMinutes: 90,
      status: 'published'
    });

    await InterviewQuestion.create({
      course: course._id,
      technologies: technologyIds,
      question: `How would you explain the core architecture of a ${definition.title} project?`,
      topic: topic.title,
      topicRef: topic._id,
      type: 'concept',
      difficulty: 'beginner',
      expectedAnswer: 'Start with the user or system goal, explain the important components, describe how data or control flows between them, and finish with key tradeoffs.',
      answerChecklist: ['States the goal', 'Explains the major components', 'Explains the flow between components'],
      tags: [generateSlug(definition.title), 'architecture'],
      status: 'published'
    });
  }

  await LearningPath.create([
    {
      title: 'JavaScript Full Stack Path', slug: 'javascript-full-stack-path',
      description: 'Progress from JavaScript fundamentals through frontend, backend, and complete MERN development.',
      category: 'fullstack',
      technologies: ['JavaScript', 'React', 'Node.js', 'Express', 'MongoDB'].map((name) => technologyByName.get(name)._id),
      availableLevels: levels,
      courses: [
        { course: courseByTitle.get('Complete JavaScript')._id, order: 1, required: true },
        { course: courseByTitle.get('React Developer')._id, order: 2, required: true },
        { course: courseByTitle.get('Node.js Backend')._id, order: 3, required: true },
        { course: courseByTitle.get('MERN Full Stack')._id, order: 4, required: true }
      ],
      featured: true, order: 1, status: 'published'
    },
    {
      title: 'Java Full Stack Path', slug: 'java-full-stack-path',
      description: 'Combine Java fundamentals, Spring Boot backend development, React frontend work, and a Java full-stack capstone.',
      category: 'fullstack',
      technologies: ['Java', 'Spring Boot', 'JavaScript', 'React', 'PostgreSQL'].map((name) => technologyByName.get(name)._id),
      availableLevels: levels,
      courses: [
        { course: courseByTitle.get('Complete Java')._id, order: 1, required: true },
        { course: courseByTitle.get('Spring Boot Backend')._id, order: 2, required: true },
        { course: courseByTitle.get('React Developer')._id, order: 3, required: true },
        { course: courseByTitle.get('Java Full Stack')._id, order: 4, required: true }
      ],
      featured: true, order: 2, status: 'published'
    }
  ]);

  console.log('Fresh multi-course seed completed successfully');
  console.log(`Technologies: ${technologyByName.size}`);
  console.log(`Courses: ${courseByTitle.size}`);
  console.log('Learning paths: 2');
  console.log('Admin test account:', admin.email);
  console.log('Learner test account:', learner.email);
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
