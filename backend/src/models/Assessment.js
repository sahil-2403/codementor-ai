import mongoose from 'mongoose';

const assessmentAnswerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' },
    selectedAnswer: String,
    isCorrect: Boolean,
    topicTitle: String
  },
  { _id: false }
);

const categoryScoreSchema = new mongoose.Schema(
  {
    topic: String,
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    score: Number,
    total: Number
  },
  { _id: false }
);

const topicScoreSchema = new mongoose.Schema(
  {
    topic: String,
    topicRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
    score: Number
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    enrollment: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    level: { type: String, enum: ['intermediate', 'advanced'], required: true },
    status: { type: String, enum: ['started', 'completed'], default: 'completed', index: true },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' }],
    answers: [assessmentAnswerSchema],
    categoryScores: [categoryScoreSchema],
    weakTopics: [topicScoreSchema],
    strongTopics: [topicScoreSchema],
    score: { type: Number, default: 0 },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

assessmentSchema.index({ user: 1, enrollment: 1, completedAt: -1 });
assessmentSchema.index({ course: 1, level: 1, status: 1, createdAt: -1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
