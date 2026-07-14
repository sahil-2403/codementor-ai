import mongoose from 'mongoose';

const weeklyReportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', required: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    strongTopics: [{ type: String }],
    weakTopics: [{ type: String }],
    summary: { type: String, default: '' },
    nextWeekFocus: [{ type: String }]
  },
  { timestamps: true }
);

weeklyReportSchema.index({ user: 1, coursePlan: 1, createdAt: -1 });

export const WeeklyReport = mongoose.model('WeeklyReport', weeklyReportSchema);
