import {
  createProfile,
  getProfile,
  getXPTransactions,
  awardXP,
  deductXP,
  updateStreak,
  recalculateXP,
} from "./userProfile.services.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { User } from "../auth/auth.models.js";

export const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await getProfile(userId);
  const user = await User.findById(userId).select("name email createdAt");

  res.json ({profile: result, user});
});

export const getXPHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { page, limit } = req.query;

  const result = await getXPTransactions(userId, page, limit);

  res.json({transactions: result.transactions, total: result.total, page: result.page, limit: result.limit});
});
