import mongoose from "mongoose";

// Major Goal(s) for the Year (or a specified period)
// A Goal has:
// title
// startDate
// endDate
// → either:
// yearly (auto sets endDate = +1 year)
const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    startDate: {
      type: Date,
      default: null
    },
    targetDate: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
  },
  { timestamps: true },
);

goalSchema.index({userId: 1, createdAt: -1})
goalSchema.index({userId: 1, completedAt: 1})


export const Goal = mongoose.model("Goal", goalSchema);
