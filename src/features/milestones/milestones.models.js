import mongoose from "mongoose";

const milestoneSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

milestoneSchema.index({ goalId: 1 }, { createdAt: 1 });


export const Milestone = mongoose.model('Milestone', milestoneSchema)
