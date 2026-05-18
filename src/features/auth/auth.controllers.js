import asyncHandler from "../../utils/asyncHandler.js";
import authService from "./auth.services.js";


// PUBLIC ENDPOINTS (no auth middleware)
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const result = await authService.register(name, email, password);

  res.status(201).json(result);
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json(result);
});

export const refreshUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.refresh(refreshToken);

  res.status(200).json(result);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await authService.forgotPassword(email);

  res.json(result);
});

export const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const result = await authService.verifyResetToken(token);

  res.json(result);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const result = await authService.resetPassword(token, newPassword);

  res.json(result);
});

// PROTECTED ENDPOINTS (auth middleware required)
export const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.logout(refreshToken);

  res.status(200).json(result);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, currentRefreshToken } = req.body;
  const userId = req.user.id;

  const result = await authService.changePassword(
    userId,
    currentPassword,
    newPassword,
    currentRefreshToken
  );

  res.json(result);
});
