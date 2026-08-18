import mongoose from 'mongoose';

const weeklyReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', required: true },
    weekStart: { type: Date, default: null },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    activity: {
      lessonsCompleted: { type: Number, default: 0 },
      quizAttempts: { type: Number, default: 0 },
      practiceAttempts: { type: Number, default: 0 },
      interviewAttempts: { type: Number, default: 0 },
      mentorQuestions: { type: Number, default: 0 }
    },
    improvements: [{ type: String }],
    strongTopics: [{ type: String }],
    weakTopics: [{ type: String }],
    quizAverage: { type: Number, default: 0 },
    overallCompletion: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    nextWeekFocus: [{ type: String }],
    generationMode: { type: String, enum: ['ai', 'fallback'], default: 'fallback' }
  },
  { timestamps: true }
);

weeklyReportSchema.index({ user: 1, coursePlan: 1, createdAt: -1 });
weeklyReportSchema.index(
  { user: 1, coursePlan: 1, weekStart: 1 },
  {
    unique: true,
    name: 'weekly_report_period_unique',
    partialFilterExpression: { weekStart: { $type: 'date' } }
  }
);

export const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema);
