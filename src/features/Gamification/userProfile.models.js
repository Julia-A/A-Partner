import mongoose from "mongoose";

const userProfileSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    currentStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    bestStreak: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastCompletionDate: { type: Date, default: null },
  },
  { timestamps: true },
);

userProfileSchema.index({ userId: 1 });

const xpTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, required: true },
    reason: {
      type: String,
      enum: [
        "step_completed",
        "step_uncompleted",
        "milestone_completed",
        "milestone_uncompleted",
        "goal_completed",
        "goal_uncompleted",
        "step_deleted",
        "milestone_deleted",
        "goal_deleted",
      ],
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);


xpTransactionSchema.index({ userId: 1, reason: 1, referenceId: 1 }, {unique: true});
xpTransactionSchema.index({ userId: 1, createdAt: -1 });

export const UserProfile = mongoose.model("UserProfile", userProfileSchema);
export const XpTransaction = mongoose.model(
  "XpTransaction",
  xpTransactionSchema,
);
