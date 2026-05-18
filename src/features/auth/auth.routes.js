import { Router } from "express";
import joiValidate from "../../middleware/validate.middleware.js";
import requireAuth from "../../middleware/auth.middleware.js";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
  verifyResetTokenSchema,
  changePasswordSchema
} from "./auth.validation.js";
import {
  registerUser,
  loginUser,
  refreshUser,
  logoutUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword,
} from "./auth.controllers.js";

const authRouter = Router();

// Public (no auth required)

// register route
authRouter.post('/register', joiValidate(registerSchema), registerUser);

// login route
authRouter.post('/login', joiValidate(loginSchema), loginUser);

// refresh route
authRouter.post('/refresh', refreshUser);


// Forgot password flow (unauthenticated)

// send forgot password mail
authRouter.post('/forgot-password', joiValidate(forgotPasswordSchema), forgotPassword);

// Verify the reset password token
authRouter.post('/verify-reset-token', joiValidate(verifyResetTokenSchema), verifyResetToken)

// Reset the password
authRouter.post('/reset-password', joiValidate(resetPasswordSchema), resetPassword);


// Protected (auth required)

// logout route
authRouter.post('/logout', requireAuth, logoutUser);

// Change password while logged in (for settings)
authRouter.post('/change-password', requireAuth, joiValidate(changePasswordSchema), changePassword)

export default authRouter;
