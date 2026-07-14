import mongoose from 'mongoose';

const mentorSourceSchema = new mongoose.Schema(
  {
    type: { type: String, default: 'lesson' },
    title: String,
    refId: String
  },
  { _id: false }
);

const mentorMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    sources: [mentorSourceSchema],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const mentorChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    coursePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'CoursePlan', default: null },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
    messages: [mentorMessageSchema]
  },
  { timestamps: true }
);

mentorChatSchema.index({ user: 1, coursePlan: 1, updatedAt: -1 });

export const MentorChat = mongoose.model('MentorChat', mentorChatSchema);
