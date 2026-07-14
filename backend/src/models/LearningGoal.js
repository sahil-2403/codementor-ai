import mongoose from 'mongoose';

const learningGoalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    goalKey: { type: String, required: true, default: 'junior-mern-stack' },
    goalTitle: { type: String, required: true, default: 'Junior MERN Stack Developer' },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
    dailyStudyTime: { type: Number, default: 90 },
    targetDurationDays: { type: Number, default: 90 },
    learningStyle: { type: String, default: 'project-based' },
    knownBasics: [{ type: String }],
    mainFocus: { type: String, default: 'job-preparation' },
    assessmentPreference: { type: String, enum: ['not_applicable', 'take', 'skip'], default: 'not_applicable' },
    status: { type: String, enum: ['draft', 'active', 'completed', 'archived'], default: 'draft' }
  },
  { timestamps: true }
);

learningGoalSchema.index({ user: 1, status: 1, createdAt: -1 });
learningGoalSchema.index({ user: 1, status: 1 }, { unique: true, partialFilterExpression: { status: 'active' } });

export const LearningGoal = mongoose.model('LearningGoal', learningGoalSchema);
