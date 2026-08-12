import mongoose from 'mongoose';
import { Course } from './Course.js';
import { Topic } from './Topic.js';

const referenceId = (value) => value?._id || value;
const referenceString = (value) => String(referenceId(value) || '');

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
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true }
  },
  { timestamps: true }
);

interviewQuestionSchema.pre('validate', async function validateOwnership() {
  const courseId = referenceId(this.course);
  const topicId = referenceId(this.topicRef);
  if (!courseId) return;

  const [course, topic] = await Promise.all([
    Course.findById(courseId).select('_id status').lean(),
    topicId ? Topic.findById(topicId).select('_id course title status').lean() : null
  ]);

  if (!course || course.status === 'archived') this.invalidate('course', 'Interview question must belong to an available course');
  if (topicId) {
    if (!topic || topic.status !== 'active') this.invalidate('topicRef', 'Interview topic is unavailable');
    else if (referenceString(topic.course) !== referenceString(courseId)) this.invalidate('topicRef', 'Interview topic must belong to the same course');
    else this.topic = topic.title;
  }
});

interviewQuestionSchema.index({ course: 1, status: 1, difficulty: 1, topic: 1 });
interviewQuestionSchema.index({ technologies: 1, status: 1 });
interviewQuestionSchema.index({ question: 'text', topic: 'text', tags: 'text' });

export const InterviewQuestion = mongoose.model('InterviewQuestion', interviewQuestionSchema);
