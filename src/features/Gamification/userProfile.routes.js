import Router from "express";
import joiValidate from "../../middleware/validate.middleware.js";
import { XPHistorySchema } from "./userProfile.validation.js";
import requireAuth from "../../middleware/auth.middleware.js";
import { getUserProfile, getXPHistory } from "./userProfile.controllers.js";

const userProfileRouter = Router();

userProfileRouter.get("/me/profile", requireAuth, getUserProfile);

userProfileRouter.get(
  "/me/xp-history",
  requireAuth,
  joiValidate(XPHistorySchema),
  getXPHistory,
);

export default userProfileRouter;
