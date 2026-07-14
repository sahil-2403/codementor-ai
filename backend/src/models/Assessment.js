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

const assessmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    learningGoal: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningGoal', required: true },
    level: { type: String, enum: ['intermediate', 'advanced'], required: true },
    status: { type: String, enum: ['started', 'completed'], default: 'completed', index: true },
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' }],
    answers: [assessmentAnswerSchema],
    categoryScores: [{ topic: String, score: Number, total: Number }],
    weakTopics: [{ topic: String, score: Number }],
    strongTopics: [{ topic: String, score: Number }],
    score: { type: Number, default: 0 },
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

assessmentSchema.index({ user: 1, learningGoal: 1, completedAt: -1 });
assessmentSchema.index({ user: 1, level: 1, createdAt: -1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
