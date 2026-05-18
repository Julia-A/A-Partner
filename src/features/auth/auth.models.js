import joi from "joi";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    passwordChangedAt: Date,
    isEmailVerified: {
      type: String,
      default: false,
      required: true,
    },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 });

const resetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: { type: String, required: true},
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

resetTokenSchema.index({ token: 1 });

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ token: 1 });
refreshTokenSchema.index({ userId: 1 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export const ResetToken = mongoose.model("ResetToken", resetTokenSchema);
export const User = mongoose.model("User", userSchema);
