import mongoose from 'mongoose';

const quizAnswerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'QuizQuestion' },
    selectedAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    explanation: String,
    topic: String
  },
  { _id: false }
);

const quizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', required: true },
    moduleId: { type: String, required: true },
    answers: [quizAnswerSchema],
    score: { type: Number, default: 0 },
    weakTopicsDetected: [{ topic: String, score: Number }],
    feedback: { type: String, default: '' },
    aiExplanation: {
      summary: { type: String, default: '' },
      focusTopics: [{ type: String }],
      sources: [
        {
          type: { type: String, default: 'lesson' },
          title: String,
          refId: String
        }
      ],
      generatedAt: Date,
      aiAvailable: { type: Boolean, default: true }
    },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

quizAttemptSchema.index({ user: 1, coursePlan: 1, completedAt: -1 });
quizAttemptSchema.index({ user: 1, moduleId: 1, createdAt: -1 });

export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
