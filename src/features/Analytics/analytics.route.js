import Router from "express";
import requireAuth from "../../middleware/auth.middleware.js";
import { analyticsControllers } from "./analytics.controllers.js";

const analyticsRouter = Router();

analyticsRouter.get("/overview", requireAuth, analyticsControllers.getOverview);

analyticsRouter.get(
  "/daily",
  requireAuth,
  analyticsControllers.getDailyCompletions,
);

analyticsRouter.get(
  "/weekly",
  requireAuth,
  analyticsControllers.getWeeklyCompletions,
);

export default analyticsRouter;
