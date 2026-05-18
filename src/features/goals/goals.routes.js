import { Router } from "express";
import joiValidate from "../../middleware/validate.middleware.js";
import requireAuth from "../../middleware/auth.middleware.js";
import {
  goalSchema,
  listAllGoalsSchema,
  getSpecificGoalSchema,
  updateGoalSchema,
} from "./goals.validation.js";
import { goalControllers } from "./goals.controllers.js";
import { create, list } from "../milestones/milestones.controllers.js";
import { milestoneSchema } from "../milestones/milestones.validations.js";

const goalRouter = Router();

// create goal
goalRouter.post(
  "/",
  requireAuth,
  joiValidate(goalSchema),
  goalControllers.create,
);

// List all goals of a user
goalRouter.get(
  "/",
  requireAuth,
  joiValidate(listAllGoalsSchema, "query"),
  goalControllers.listAllGoals,
);

// Get a single goal by its ID
goalRouter.get(
  "/:goalId",
  requireAuth,
  joiValidate(getSpecificGoalSchema, "params"),
  goalControllers.getGoalById,
);

// Update a single goal
goalRouter.patch(
  "/:goalId",
  requireAuth,
  joiValidate(updateGoalSchema),
  goalControllers.updateGoal,
);

// Delete a goal
goalRouter.delete("/:goalId", requireAuth, goalControllers.delete_);

// Complete a goal
goalRouter.post("/:goalId/complete", requireAuth, goalControllers.complete);

// Uncomplete a goal
goalRouter.post("/:goalId/uncomplete", requireAuth, goalControllers.uncomplete);

// Create a milestone
goalRouter.post(
  "/:goalId/milestones",
  requireAuth,
  joiValidate(milestoneSchema),
  create,
);

// List milestone by goal
goalRouter.get("/:goalId/milestones", requireAuth, list);

export default goalRouter;
