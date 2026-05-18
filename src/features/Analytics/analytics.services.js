import { UserProfile } from "../Gamification/userProfile.models.js";
import { stepServices } from "../steps/steps.services.js";
import { Goal } from "../goals/goals.models.js";
import { Milestone } from "../milestones/milestones.models.js";
import { Step } from "../steps/steps.models.js";
import ApiError from "../../utils/ApiError.js";

// Shared helper
async function getUserMilestoneIds(userId) {
  const goalIds = (await Goal.find({ userId }).select("_id")).map((g) => g._id);
  const milestoneIds = (
    await Milestone.find({ goalId: { $in: goalIds } }).select("_id")
  ).map((m) => m._id);
  return milestoneIds;
}

async function getOverview(userId) {
  const profilePromise = UserProfile.findOne({ userId });

  const goalIds = (await Goal.find({ userId }).select("_id")).map((g) => g._id);

  const milestoneIds = (
    await Milestone.find({ goalId: { $in: goalIds } }).select("_id")
  ).map((m) => m._id);

  const [
    profile,
    totalSteps,
    completedSteps,
    stepsLast7Days,
    stepsLast30Days,
    totalGoals,
    completedGoals,
  ] = await Promise.all([
    profilePromise,
    Step.countDocuments({ milestoneId: { $in: milestoneIds } }),
    Step.countDocuments({
      milestoneId: { $in: milestoneIds },
      status: "completed",
    }),
    Step.countDocuments({
      milestoneId: { $in: milestoneIds },
      status: "completed",
      completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }),
    Step.countDocuments({
      milestoneId: { $in: milestoneIds },
      status: "completed",
      completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }),
    Goal.countDocuments({ userId }),
    Goal.countDocuments({ userId, completedAt: { $ne: null } }),
  ]);

  const completionRate =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const goalCompletionRate =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const overdueCount = await Step.countDocuments({
    milestoneId: { $in: milestoneIds },
    status: { $ne: "completed" },
    endDate: { $lt: startOfToday },
  });

  return {
    currentStreak: profile?.currentStreak || 0,
    bestStreak: profile?.bestStreak || 0,
    completionRate,
    stepsLast7Days,
    stepsLast30Days,
    totalGoals,
    completedGoals,
    goalCompletionRate,
    overdueCount,
  };
}

async function getDailyCompletions(userId, days) {
  if (days < 1 || days > 365)
    throw new ApiError(400, "Days must be between 1 and 365");

  const milestoneIds = await getUserMilestoneIds(userId);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (days - 1));
  startDate.setHours(0, 0, 0, 0);

  const completions = await Step.aggregate([
    {
      $match: {
        milestoneId: { $in: milestoneIds },
        status: "completed",
        completedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$completedAt",
            timezone: "UTC",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Convert to map for fast lookup
  const completionMap = new Map(
    completions.map((c) => [c._id, c.count])
  );

  const result = [];

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);

    const dateStr = d.toISOString().split("T")[0];

    result.push({
      date: dateStr,
      count: completionMap.get(dateStr) || 0,
    });
  }

  return result;
}

async function getWeeklyCompletions(userId, weeks) {
  if (weeks < 1 || weeks > 52) {
    throw new ApiError(400, "Weeks must be between 1 and 52");
  }

  const milestoneIds = await getUserMilestoneIds(userId);

  const now = new Date();
  const result = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const count = await Step.countDocuments({
      milestoneId: { $in: milestoneIds },
      status: "completed",
      completedAt: { $gte: weekStart, $lte: weekEnd },
    });

    const label = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    result.push({ week: label, count });
  }

  return result;
}


export const analyticsServices = {
  getOverview,
  getDailyCompletions,
  getWeeklyCompletions
}
