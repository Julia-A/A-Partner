import { Router } from "express";
import joiValidate from "../../middleware/validate.middleware.js";
import requireAuth from "../../middleware/auth.middleware.js";
import { getById, update, delete_ } from "./milestones.controllers.js";
import {
  getMilestoneByIdSchema,
  updateMilestoneSchema,
} from "./milestones.validations.js";
import { stepController } from "../steps/steps.controllers.js";
import {
  createStepsSchema,
  validateMilestoneId,
} from "../steps/steps.validation.js";

const milestoneRoutes = Router();

milestoneRoutes.get(
  "/:milestoneId",
  requireAuth,
  joiValidate(getMilestoneByIdSchema, "params"),
  getById,
);

milestoneRoutes.patch(
  "/:milestoneId",
  requireAuth,
  joiValidate(updateMilestoneSchema),
  update,
);

// Delete a milestone
milestoneRoutes.delete("/:milestoneId", requireAuth, delete_);

// Create a step in a milestone
milestoneRoutes.post(
  "/:milestoneId/steps",
  requireAuth,
  joiValidate(createStepsSchema),
  stepController.create,
);

// Get the list of steps in a milestone
milestoneRoutes.get(
  "/:milestoneId/steps",
  requireAuth,
  stepController.list,
);

export default milestoneRoutes;
