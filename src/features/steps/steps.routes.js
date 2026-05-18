import Router from "express";
import { stepController } from "./steps.controllers.js";
import joiValidate from "../../middleware/validate.middleware.js";
import requireAuth from "../../middleware/auth.middleware.js";
import {
  createStepsSchema,
  validateMilestoneId,
  validateStepId,
  updateStepSchema,
} from "./steps.validation.js";

const stepRoutes = Router();

// Update a step
stepRoutes.patch(
  "/:stepId",
  requireAuth,
  joiValidate(updateStepSchema),
  joiValidate(validateStepId, "params"),
  stepController.update,
);

// Complete a step
stepRoutes.post(
  "/:stepId/complete",
  requireAuth,
  stepController.complete,
);

// Uncomplete a step
stepRoutes.post(
  "/:stepId/uncomplete",
  requireAuth,
  stepController.uncomplete,
);

// Delete a step
stepRoutes.delete(
  "/:stepId",
  requireAuth,
  joiValidate(validateStepId),
  stepController.delete_,
);

// Get today's focus
stepRoutes.get("/today", requireAuth, stepController.getTodayFocus);

// Get overdue steps
stepRoutes.get("/overdue", requireAuth, stepController.getOverdue);

export default stepRoutes;
