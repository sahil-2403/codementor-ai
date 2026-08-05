import mongoose from 'mongoose';

const weeklyReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', required: true },
    weekStart: { type: Date, default: null },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    strongTopics: [{ type: String }],
    weakTopics: [{ type: String }],
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
