import ApiError from "../../utils/ApiError.js";
import { Goal } from "./goals.models.js";
import { Milestone } from "../milestones/milestones.models.js";
import { Step } from "../steps/steps.models.js";
import { normalizeToUTCMidnight } from "../../utils/date.js";
import { awardXP, deductXP } from "../Gamification/userProfile.services.js";
import mongoose from "mongoose";

// data = { title, description, startDate, targetDate }

// Create a goal
async function create(userId, { title, description, startDate, targetDate }) {
  if (!title) throw new ApiError(400, "Title is required");

  if (!description) description = "";

  if (startDate && targetDate) {
    if (targetDate < startDate) {
      throw new ApiError(400, "Target date must be on or after start date");
    }
  }

  const goal = await Goal.create({
    userId,
    title,
    description,
    startDate: normalizeToUTCMidnight(startDate) || null,
    targetDate: normalizeToUTCMidnight(targetDate) || null,
  });

  return goal;
}

// List goals by user
async function listByUser(userId, { status, sort, page = 1, limit = 10 }) {
  if (!userId) throw new ApiError(400, "Id not provided");

  // The filter object for querying the DB in Goal.find()
  const filterBy = { userId };

  // Adding to the filter object if status is a particular value
  if (status === "active") filterBy.completedAt = null;
  if (status === "completed") filterBy.completedAt = { $ne: null };

  // Let the default sorting be descending (As in the newest goal created)
  // the sort method is expecting an object as the parameter: 1 for ascending, and -1 for descending
  let sortObj = { createdAt: -1 };

  if (sort === "created_asc") sortObj = { createdAt: 1 };
  if (sort === "target_date") sortObj = { targetDate: 1 };

  // Getting pagination by knowing the amount of pages to skip and the limit (number of goals to list per page)

  const skip = (page - 1) * limit;

  const [goals, total] = await Promise.all([
    Goal.find(filterBy).sort(sortObj).skip(skip).limit(limit),
    Goal.countDocuments(filterBy),
  ]);

  return { goals, total, page, limit };
}

// Get a single goal by Id
async function getById(userId, goalId) {
  if (!userId || !goalId) throw new ApiError(400, "Id not provided");

  const goal = await Goal.findOne({ _id: goalId, userId });

  if (!goal) throw new ApiError(404, "Goal not found");

  return goal;
}

async function update(
  userId,
  goalId,
  { title, description, startDate, targetDate },
) {
  if (!userId || !goalId) throw new ApiError(400, "Id not provided");

  const goal = await getById(userId, goalId);

  if (title !== undefined) {
    goal.title = title;
  }
  if (description !== undefined) {
    goal.description = description;
  }

  // validate dates before assigning the values

  if (startDate !== undefined && targetDate !== undefined) {
    startDate = normalizeToUTCMidnight(startDate);
    targetDate = normalizeToUTCMidnight(targetDate);
    if (targetDate < startDate) {
      throw new ApiError(
        400,
        "Target date should be on or after the start date",
      );
    } else if (targetDate >= startDate) {
      goal.startDate = startDate;
      goal.targetDate = targetDate;
    }
  }

  await goal.save();
  return goal;
}

async function delete_(userId, goalId) {
  if (!userId || !goalId) throw new ApiError(400, "Id not provided");

  const goal = await getById(userId, goalId);

  // Mongoose session allows this to be a "ALL SUCCEED OR NONE SUCCEED" process
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find all the milestones for this goal
    const milestones = await Milestone.find({ goalId }).session(session);

    const milestoneIds = milestones.map((milestone) => milestone._id);

    // Find all completed steps under these milestones
    const completedSteps = await Step.find({
      milestoneId: { $in: milestoneIds },
      status: "completed",
    }).session(session);

    // Deduct XP for each completed step
    for (const step of completedSteps) {
      await deductXP(userId, 10, "step_deleted", step._id);
    }

    // Deduct XP for each completed milestone
    for (const milestone of milestones) {
      if (milestone.completedAt) {
        await deductXP(userId, 50, "milestone_deleted", milestone._id);
      }
    }

    if (goal.completedAt) {
      await deductXP(userId, 100, "goal_deleted", goal._id);
    }

    // Delete all steps, milestones, and then goal
    await Step.deleteMany({ milestoneId: { $in: milestoneIds } }).session(
      session,
    );
    await Milestone.deleteMany({ goalId: goal._id }).session(session);
    await Goal.findByIdAndDelete(goal._id).session(session);

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

async function complete(userId, goalId) {
  const goal = await getById(userId, goalId);

  // Idempotency
  if (goal.completedAt) {
    return { goal, xpAwarded: 0, goalCompleted: false };
  }

  goal.completedAt = new Date();
  await goal.save();

  await awardXP(userId, 100, "goal_completed", goalId);

  return { goal, xpAwarded: 100, goalCompleted: true };
}

async function uncomplete(userId, goalId) {
  const goal = await getById(userId, goalId);

  // Idempotency
  if (!goal.completedAt) {
    return { goal, xpDeducted: 0, goalCompleted: false };
  }

  goal.completedAt = null;
  await goal.save();

  await deductXP(userId, 100, "goal_uncompleted", goalId);

  return { goal, xpDeducted: 100, goalCompleted: false };
}

async function syncCompletionFromMilestones(userId, goalId) {
  const milestones = await Milestone.find({ goalId }).select("completedAt");

  if (!milestones.length) return null;

  const allCompleted = milestones.every((m) => m.completedAt);

  if (allCompleted) {
    return await complete(userId, goalId);
  }

  return await uncomplete(userId, goalId);
}

export const goalServices = {
  create,
  listByUser,
  getById,
  update,
  delete_,
  complete,
  uncomplete,
  syncCompletionFromMilestones,
};
