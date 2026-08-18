import mongoose from 'mongoose';

const weakTopicSchema = new mongoose.Schema(
  {
    topic: String,
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    source: { type: String, enum: ['assessment', 'quiz', 'mentor_chat', 'practice_submission', 'interview_mode', 'manual'], default: 'quiz' },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    score: { type: Number, default: 0 },
    attempts: { type: Number, default: 1 },
    relatedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    lastDetectedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', required: true, index: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    completedModules: [{ type: String }],
    quizStats: {
      totalAttempts: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      bestScore: { type: Number, default: 0 }
    },
    weakTopics: [weakTopicSchema],
    streak: { type: Number, default: 0 },
    lastStudiedAt: { type: Date, default: null },
    overallCompletion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

progressSchema.index({ user: 1, coursePlan: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);
