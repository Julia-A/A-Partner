import ApiError from "../../utils/ApiError.js";
import mongoose  from "mongoose";
import { Milestone } from "./milestones.models.js";
import { Goal } from "../goals/goals.models.js";
import { Step } from "../steps/steps.models.js";
import { goalServices } from "../goals/goals.services.js";
import {deductXP, awardXP} from "../Gamification/userProfile.services.js"
import { normalizeToUTCMidnight } from "../../utils/date.js";

function assertWithinGoalTimeline(startDate, targetDate, goal) {
  if (!goal) throw new ApiError(404, "Goal not found");

  if (startDate && goal.startDate && startDate < goal.startDate) {
    throw new ApiError(400, "Milestone start date must be within the goal timeline");
  }

  if (targetDate && goal.targetDate && targetDate > goal.targetDate) {
    throw new ApiError(400, "Milestone target date must be within the goal timeline");
  }
}

async function create(userId, goalId, { title, description, startDate, targetDate }) {
  // Validate if the goal exists and if it belongs to the user
  const goal = await goalServices.getById(userId, goalId);

  const normalizedStartDate = normalizeToUTCMidnight(startDate);
  const normalizedTargetDate = normalizeToUTCMidnight(targetDate);

  if (normalizedStartDate && normalizedTargetDate && normalizedTargetDate < normalizedStartDate) {
    throw new ApiError(400, "Target date must be on or after start date");
  }

  assertWithinGoalTimeline(normalizedStartDate, normalizedTargetDate, goal);

  const milestone = await Milestone.create({
    goalId,
    title,
    description: description || "",
    startDate: normalizedStartDate,
    targetDate: normalizedTargetDate,
  });

  return milestone;
}

async function listByGoal(userId, goalId) {
  // Validate ownership
  await goalServices.getById(userId, goalId);

  const milestones = await Milestone.find({ goalId }).sort({
    createdAt: 1,
  });

  return milestones;
}

async function getMilestoneById(userId, milestoneId) {
  const milestone = await Milestone.findById(milestoneId);

  if (!milestone) throw new ApiError(404, "Milestone not found");

  // Verify the ownership through the parent goal
  // Make sure the correct user is accessing this milestone by first:
  // Verifying if the goalId in the milestone model has a corresponding goal in the goal model
  // And if the userId in the goal model is equal to the userId provided from req.user.id
  const goal = await Goal.findById(milestone.goalId);

  if (!goal || goal.userId.toString() !== userId.toString()) {
    throw new ApiError(403, "Unauthorized access");
  }

  return milestone;
}

async function update(userId, milestoneId, { title, description, startDate, targetDate }) {
  const milestone = await getMilestoneById(userId, milestoneId);
  const goal = await Goal.findById(milestone.goalId);

  if (title !== undefined) {
    milestone.title = title;
  }
  if (description !== undefined) {
    milestone.description = description;
  }

  const nextStartDate =
    startDate !== undefined ? normalizeToUTCMidnight(startDate) : milestone.startDate;
  const nextTargetDate =
    targetDate !== undefined ? normalizeToUTCMidnight(targetDate) : milestone.targetDate;

  if (nextStartDate && nextTargetDate && nextTargetDate < nextStartDate) {
    throw new ApiError(400, "Target date must be on or after start date");
  }

  assertWithinGoalTimeline(nextStartDate, nextTargetDate, goal);

  if (startDate !== undefined) milestone.startDate = nextStartDate;
  if (targetDate !== undefined) milestone.targetDate = nextTargetDate;


  await milestone.save();
  return milestone;
}


async function delete_(userId, milestoneId) {
  const milestone = await getMilestoneById(userId, milestoneId)

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // Find all completed steps for this milestone
    const completedSteps = await Step.find({
      milestoneId: milestone._id,
      status: 'completed'
    }).session(session)

    // Deduct XP for each completed step
    for (const step of completedSteps) {
      await deductXP(userId, 10, 'step_deleted', step._id)
    }

    // Deduct XP for milestone itself if it was completed
    if(milestone.completedAt) {
      await deductXP(userId, 50, 'milestone_deleted', milestone._id)
    }

    // Delete all steps, then milestone
    await Step.deleteMany({milestoneId: milestone._id}).session(session)
    await Milestone.findByIdAndDelete(milestone._id).session(session)

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    throw err
  } finally {
    session.endSession()
  }
}


async function autoComplete (userId, milestoneId) {
  const milestone = await Milestone.findById(milestoneId)

  if(!milestone) return null

  if(milestone.completedAt) return milestone // already completed then

  milestone.completedAt = new Date()
  await milestone.save()

  await awardXP(userId, 50, 'milestone_completed', milestoneId)

  const goalResult = await goalServices.syncCompletionFromMilestones(userId, milestone.goalId)

  return {
    milestone,
    goalCompleted: Boolean(goalResult?.goalCompleted),
  }
}

async function autoUncomplete (userId, milestoneId) {
  const milestone = await Milestone.findById(milestoneId)

  if(!milestone) return null

  if(!milestone.completedAt) return milestone // not completed then

  milestone.completedAt = null
  await milestone.save()

  await deductXP(userId, 50, 'milestone_uncompleted', milestoneId)

  await goalServices.syncCompletionFromMilestones(userId, milestone.goalId)

  return milestone
}


export const milestoneServices = {
  create,
  listByGoal,
  getMilestoneById,
  update,
  delete_,
  autoComplete,
  autoUncomplete
}
