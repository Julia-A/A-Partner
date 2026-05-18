import asyncHandler from "../../utils/asyncHandler.js";
import { analyticsServices } from "./analytics.services.js";

const getOverview = asyncHandler(async (req, res) => {
  const result = await analyticsServices.getOverview(req.user.id);

  res.json(result);
});

const getDailyCompletions = asyncHandler(async (req, res) => {
  const { days } = req.query;
  const result = await analyticsServices.getDailyCompletions(
    req.user.id,
    parseInt(days),
  );

  res.json({ data: result });
});

const getWeeklyCompletions = asyncHandler(async (req, res) => {
  const { weeks } = req.query;
  const result = await analyticsServices.getWeeklyCompletions(
    req.user.id,
    parseInt(weeks),
  );

  res.json({ data: result });
});

export const analyticsControllers = {
  getOverview,
  getDailyCompletions,
  getWeeklyCompletions
}
