import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    tags: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// topicSchema.index({ slug: 1 }, { unique: true });
topicSchema.index({ category: 1, difficulty: 1, order: 1 });
topicSchema.index({ title: "text", category: "text", tags: "text" });

export const Topic = mongoose.model("Topic", topicSchema);
