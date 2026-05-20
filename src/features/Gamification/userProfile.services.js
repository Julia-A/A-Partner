import { UserProfile, XpTransaction } from "./userProfile.models.js";
import ApiError from "../../utils/ApiError.js";
import mongoose from "mongoose";

export async function createProfile(userId) {
  if (!userId) throw new ApiError(400, "Id not provided");

  const profile = await UserProfile.create({
    userId,
    xp: 0,
    level: 1,
    currentStreak: 0,
    bestStreak: 0,
    lastCompletionDate: null,
  });

  return profile;
}

export async function getProfile(userId) {
  if (!userId) throw new ApiError(400, "Id not provided");

  const profile = await UserProfile.findOne({ userId });

  if (!profile) throw new ApiError(404, "Profile not found");

  return profile;
}

export async function getXPTransactions(userId, page = 1, limit = 10) {
  if (!userId) throw new ApiError(400, "Id not provided");

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    XpTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    XpTransaction.countDocuments({ userId }),
  ]);

  return { transactions, total, page, limit };
}

export async function awardXP(userId, amount, reason, referenceId) {
  if (amount <= 0)
    throw new ApiError(400, "Amount must be positive and greater than 0");

  if (!amount || !reason || !referenceId) {
    throw new ApiError(400, "All fields are required");
  }

  // IDEMPOTENCY CHECK
  const existing = await XpTransaction.findOne({ userId, reason, referenceId });

  if (existing) {
    return await UserProfile.findOne({ userId }); // already awarded, so skip
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await XpTransaction.create([{ userId, amount, reason, referenceId }], {
      session,
    });

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $inc: { xp: amount } },
      { new: true, session },
    );

    if (!profile) throw new ApiError(404, "User profile not found");

    profile.level = Math.floor(profile.xp / 200) + 1;
    await profile.save({ session });

    await session.commitTransaction();
    return profile;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function deductXP(userId, amount, reason, referenceId) {
  if (!userId) throw new ApiError(400, "Id is required");

  if (amount == null || !reason || !referenceId) {
    throw new ApiError(400, "All fields are required");
  }

  if (amount <= 0)
    throw new ApiError(400, "Amount must be positive and greater than 0");


  // IDEMPOTENCY CHECK
  const existing = await XpTransaction.findOne({ userId, reason, referenceId });

  if (existing) {
    return await UserProfile.findOne({ userId }); // already deducted, so skip
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    await XpTransaction.create(
      [{ userId, amount: -amount, reason, referenceId }],
      { session },
    );

    const profile = await UserProfile.findOne({ userId }).session(session);

    if (!profile) throw new ApiError(404, "User profile not found");

    profile.xp = Math.max(0, profile.xp - amount); // floor at 0
    profile.level = Math.floor(profile.xp / 200) + 1;

    await profile.save({ session });

    await session.commitTransaction();
    return profile;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

export async function updateStreak(userId) {
  const profile = await UserProfile.findOne({ userId });

  if (!profile) throw new ApiError(404, "Profile not found");

  const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

  const lastCompletionDate = profile.lastCompletionDate
    ? profile.lastCompletionDate.toISOString().split("T")[0]
    : null;

  if (lastCompletionDate === today) {
    return profile; // that means today has already been counted, no change
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (lastCompletionDate === yesterdayStr) {
    profile.currentStreak += 1; // continue the streak
  } else {
    profile.currentStreak = 1; // streak is broken, start new one
  }

  profile.bestStreak = Math.max(profile.bestStreak, profile.currentStreak);
  profile.lastCompletionDate = today;
  await profile.save();
  return profile;
}

export async function recalculateXP(userId) {
  const result = await XpTransaction.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalXP = Math.max(0, result[0]?.total || 0);
  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { xp: totalXP, level: Math.floor(totalXP / 200) + 1 },
    { new: true },
  );

  return profile;
}
