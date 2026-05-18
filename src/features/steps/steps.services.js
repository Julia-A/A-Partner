import ApiError from "../../utils/ApiError.js";
import mongoose from "mongoose";
import { Milestone } from "../milestones/milestones.models.js";
import { Step } from "./steps.models.js";
import { milestoneServices } from "../milestones/milestones.services.js";
import { Goal } from "../goals/goals.models.js";
import {
  awardXP,
  deductXP,
  updateStreak,
} from "../Gamification/userProfile.services.js";
import { normalizeToUTCMidnight } from "../../utils/date.js";

async function create(
  userId,
  milestoneId,
  { title, startDate, endDate },
) {
  // Validate ownership chain: milestone → goal → userId
  const milestone = await milestoneServices.getMilestoneById(
    userId,
    milestoneId,
  );

  if (startDate && endDate && endDate < startDate) {
    throw new ApiError(400, "End date must be on or after start date");
  }

  const step = await Step.create({
    milestoneId,
    title,
    startDate: normalizeToUTCMidnight(startDate) || null,
    endDate: normalizeToUTCMidnight(endDate) || null,
    status: "pending",
  });

  // if parent milestone was completed, uncomplete it
  // Because adding a pending step to a "done" milestone makes it not done yet
  if (milestone.completedAt) {
    await milestoneServices.autoUncomplete(userId, milestoneId);
  }
  return step;
}

async function listByMilestone(userId, milestoneId) {
  await milestoneServices.getMilestoneById(userId, milestoneId);

  const steps = await Step.find({ milestoneId }).sort({ createdAt: 1 });

  return steps;
}

async function getByStepId(userId, stepId) {
  const step = await Step.findById(stepId);

  if (!step) throw new ApiError(404, "Step not found");

  // Verify ownership through chain: step → milestone → goal → userId
  const milestone = await Milestone.findById(step.milestoneId);

  if (!milestone) throw new ApiError(404, "Step not found");

  const goal = await Goal.findById(milestone.goalId);
  if (!goal || goal.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }

  return step;
}

async function update(userId, stepId, { title, startDate, endDate }) {
  const step = await getByStepId(userId, stepId);

  if (title !== undefined) {
    step.title = title;
  }

  if (startDate !== undefined) step.startDate = startDate || null;
  if (endDate !== undefined) step.endDate = endDate || null;

  if (startDate && endDate && endDate > startDate) {
    throw new ApiError(400, "End date must be on or after start date");
  }

  await step.save();
  return step;
}

async function complete(userId, stepId) {
  const step = await getByStepId(userId, stepId);

  // Idempotency - check if step has already been marked completed
  if (step.status === "completed") {
    return { step, xpAwarded: 0, milestoneCompleted: false };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let xpAwarded = 0;
    let milestoneCompleted = false;

    // Mark step as completed
    step.status = "completed";
    step.completedAt = new Date();

    await step.save({ session });

    // Award 10 XP
    await awardXP(userId, 10, "step_completed", step._id);
    xpAwarded = 10;

    // Update streak
    await updateStreak(userId);

    // check if all sibling steps are now completed
    const siblingSteps = await Step.find({
      milestoneId: step.milestoneId,
    }).session(session);

    const allCompleted =
      siblingSteps.length > 0 &&
      siblingSteps.every((s) => s.status === "completed");

    if (allCompleted) {
      await milestoneServices.autoComplete(userId, step.milestoneId);
      xpAwarded += 50;

      milestoneCompleted = true;
    }

    await session.commitTransaction();
    return { step, xpAwarded, milestoneCompleted };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function uncomplete(userId, stepId) {
  const step = await getByStepId(userId, stepId);

  // If the step is already uncompleted, just return the step
  if (step.status !== "completed") {
    return { step, xpDeducted: 0, milestoneUncompleted: false };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let xpDeducted = 0;
    let milestoneUncompleted = false;

    // Mark the step as pending
    step.status = "pending";
    step.completedAt = null;
    await step.save({ session });

    // Deduct 10XP
    await deductXP(userId, 10, "step_uncompleted", step._id);
    xpDeducted = 10;

    // If the parent milestone was completed, uncomplete it and deduct 50XP
    const milestone = await Milestone.findById(step.milestoneId).session(
      session,
    );

    if (milestone && milestone.completedAt) {
      await milestoneServices.autoUncomplete(userId, milestone._id);
      xpDeducted += 50;
      milestoneUncompleted = true;
    }

    // DO NOT modify streak
    // The streak is date based. Other steps may have been completed this same day
    await session.commitTransaction();
    return { step, xpDeducted, milestoneUncompleted };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function delete_(userId, stepId) {
  const step = await getByStepId(userId, stepId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // If the step was completed, deduct its XP
    if (step.status === "completed") {
      await deductXP(userId, 10, "step_deleted", step._id);
    }

    // Store milestoneId before deleting
    const milestoneId = step.milestoneId;

    // Delete the step
    await Step.findByIdAndDelete(step._id).session(session);

    // Re-evaluate the milestone state
    const remainingSteps = await Step.find({ milestoneId }).session(session);
    const milestone = await Milestone.findById(milestoneId).session(session);

    if (milestone) {
      if (remainingSteps.length === 0 && milestone.completedAt) {
        // i.e if there are no steps left, milestone should not be complete
        milestone.completedAt = null;
        await milestone.save({ session });
      }

      if (
        remainingSteps.length > 0 &&
        remainingSteps.every((s) => s.status === "completed") &&
        !milestone.completedAt
      ) {
        // Deleting the one incomplete step may now complete the milestone
        await milestoneServices.autoComplete(userId, milestoneId);
      }
    }
    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function getTodayFocus(userId) {
  const userGoals = await Goal.find({ userId }).select("_id");
  const goalIds = userGoals.map((g) => g._id);

  const userMilestones = await Milestone.find({
    goalId: { $in: goalIds },
  }).select("_id");
  const milestoneIds = userMilestones.map((m) => m._id);

  const pendingSteps = await Step.find({
    milestoneId: { $in: milestoneIds },
    status: { $ne: "completed" },
  }).sort({ createdAt: 1 });

  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const overdue = pendingSteps.filter(
    (s) => s.endDate && s.endDate < startOfToday,
  );

  const explicitlyDueToday = pendingSteps.filter(
    (s) =>
      !overdue.includes(s) &&
      ((s.startDate &&
        s.endDate &&
        s.startDate <= endOfToday &&
        s.endDate >= startOfToday) ||
        (!s.startDate &&
          s.endDate &&
          s.endDate >= startOfToday &&
          s.endDate <= endOfToday) ||
        (s.startDate && !s.endDate && s.startDate <= endOfToday)),
  );

  const todaySteps =
    explicitlyDueToday.length > 0
      ? explicitlyDueToday
      : pendingSteps
          .filter((s) => !overdue.includes(s) && !s.startDate && !s.endDate)
          .slice(0, 3);

  return { overdue, today: todaySteps };
}

async function getOverdue(userId) {
  const userGoals = await Goal.find({ userId }).select("_id");
  const goalIds = userGoals.map((g) => g._id);

  const userMilestones = await Milestone.find({
    goalId: { $in: goalIds },
  }).select("_id");
  const milestoneIds = userMilestones.map((m) => m._id);

  // Proper Date boundary
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const overdueSteps = await Step.find({
    milestoneId: { $in: milestoneIds },
    status: { $ne: "completed" },
    endDate: { $lt: startOfToday, $ne: null },
  }).sort({ endDate: 1 });

  return overdueSteps;
}

export const stepServices = {
  create,
  listByMilestone,
  update,
  complete,
  uncomplete,
  delete_,
  getTodayFocus,
  getOverdue,
};
