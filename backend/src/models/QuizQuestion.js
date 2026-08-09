import mongoose from 'mongoose';
import { Course } from './Course.js';
import { Topic } from './Topic.js';
import { Lesson } from './Lesson.js';

const quizQuestionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    question: { type: String, required: true },
    bank: { type: String, enum: ['quiz', 'skill_check'], required: true, default: 'quiz', index: true },
    type: { type: String, enum: ['mcq', 'code_output', 'short_answer'], default: 'mcq' },
    codeSnippet: { type: String, default: '' },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    explanation: { type: String, default: '' },
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    relatedLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    manualArchive: { type: Boolean, default: false },
    statusBeforeManualArchive: { type: String, enum: ['draft', 'published'], default: null },
    archivedByTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    archivedByLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    statusBeforeCascadeArchive: { type: String, enum: ['draft', 'published'], default: null },
    statusBeforeTopicArchive: { type: String, enum: ['draft', 'published'], default: null }
  },
  { timestamps: true }
);

quizQuestionSchema.pre('validate', async function validateOwnership() {
  if (!this.course || !this.topic) return;
  const [course, topic, lesson] = await Promise.all([
    Course.findById(this.course).select('_id status').lean(),
    Topic.findById(this.topic).select('_id course status').lean(),
    this.relatedLesson ? Lesson.findById(this.relatedLesson).select('_id course topic status').lean() : null
  ]);
  if (!course || course.status === 'archived') this.invalidate('course', 'Question must belong to an available course');
  if (!topic || topic.status !== 'active') this.invalidate('topic', 'Question must belong to an active topic');
  else if (topic.course.toString() !== this.course.toString()) this.invalidate('topic', 'Question topic must belong to the same course');
  if (this.relatedLesson) {
    if (!lesson) this.invalidate('relatedLesson', 'Related lesson does not exist');
    else if (lesson.course.toString() !== this.course.toString()) this.invalidate('relatedLesson', 'Related lesson must belong to the same course');
    else if (lesson.topic.toString() !== this.topic.toString()) this.invalidate('relatedLesson', 'Related lesson must belong to the selected topic');
  }
});

quizQuestionSchema.index({ course: 1, bank: 1, status: 1, difficulty: 1, topic: 1, type: 1 });
quizQuestionSchema.index({ technologies: 1, status: 1 });
quizQuestionSchema.index({ archivedByTopics: 1, status: 1 });
quizQuestionSchema.index({ archivedByLessons: 1, status: 1 });
quizQuestionSchema.index({ course: 1, tags: 1, bank: 1, status: 1 });
quizQuestionSchema.index({ question: 'text', explanation: 'text', tags: 'text' });

export const QuizQuestion = mongoose.model('QuizQuestion', quizQuestionSchema);
