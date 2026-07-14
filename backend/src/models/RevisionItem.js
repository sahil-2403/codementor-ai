import mongoose from 'mongoose';

const revisionItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', required: true, index: true },
    topic: { type: String, required: true },
    relatedLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    dueDate: { type: Date, required: true, index: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending', index: true },
    source: { type: String, enum: ['assessment', 'quiz', 'mentor_chat', 'project_submission', 'interview_mode', 'manual'], default: 'quiz' },
    reason: { type: String, default: '' }
  },
  { timestamps: true }
);

revisionItemSchema.index({ user: 1, coursePlan: 1, topic: 1, status: 1 });
revisionItemSchema.index({ user: 1, coursePlan: 1, status: 1, dueDate: 1 });

export const RevisionItem = mongoose.model('RevisionItem', revisionItemSchema);
