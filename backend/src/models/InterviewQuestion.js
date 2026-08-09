import mongoose from 'mongoose';
import { Course } from './Course.js';
import { Topic } from './Topic.js';

const interviewQuestionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    technologies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technology' }],
    question: { type: String, required: true },
    topic: { type: String, required: true, index: true },
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null, index: true },
    type: { type: String, enum: ['definition', 'concept', 'output', 'scenario', 'debugging', 'system_design_lite'], default: 'concept' },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner', index: true },
    expectedAnswer: { type: String, required: true },
    answerChecklist: [{ type: String }],
    tags: [{ type: String }],
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
    manualArchive: { type: Boolean, default: false },
    statusBeforeManualArchive: { type: String, enum: ['draft', 'published'], default: null },
    archivedByTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    statusBeforeCascadeArchive: { type: String, enum: ['draft', 'published'], default: null },
    statusBeforeTopicArchive: { type: String, enum: ['draft', 'published'], default: null }
  },
  { timestamps: true }
);

interviewQuestionSchema.pre('validate', async function validateOwnership() {
  if (!this.course) return;
  const [course, topic] = await Promise.all([
    Course.findById(this.course).select('_id status').lean(),
    this.topicRef ? Topic.findById(this.topicRef).select('_id course title status').lean() : null
  ]);
  if (!course || course.status === 'archived') this.invalidate('course', 'Interview question must belong to an available course');
  if (this.topicRef) {
    if (!topic || topic.status !== 'active') this.invalidate('topicRef', 'Interview topic is unavailable');
    else if (topic.course.toString() !== this.course.toString()) this.invalidate('topicRef', 'Interview topic must belong to the same course');
    else this.topic = topic.title;
  }
});

interviewQuestionSchema.index({ course: 1, status: 1, difficulty: 1, topic: 1 });
interviewQuestionSchema.index({ technologies: 1, status: 1 });
interviewQuestionSchema.index({ question: 'text', topic: 'text', tags: 'text' });
interviewQuestionSchema.index({ archivedByTopics: 1, status: 1 });

export const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);
