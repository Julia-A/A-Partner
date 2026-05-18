import { Router } from "express";
import authRoutes from "../features/auth/auth.routes.js";
import userProfileRoutes from "../features/Gamification/userProfile.routes.js";
import goalRoutes from "../features/goals/goals.routes.js";
import milestoneRoutes from "../features/milestones/milestones.routes.js";
import stepRoutes from "../features/steps/steps.routes.js";
import analyticsRoutes from "../features/Analytics/analytics.route.js";

const router = Router();

// Auth routes
router.use("/auth", authRoutes);

// User Profile routes
router.use("/users", userProfileRoutes);

// Goal routes
router.use("/goal", goalRoutes);

// Milestone routes
router.use("/milestone", milestoneRoutes);

// Step routes
router.use("/steps", stepRoutes);

// Analytics routes
router.use("/analytics", analyticsRoutes);

export default router;
