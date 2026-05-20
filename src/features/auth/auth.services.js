import { RefreshToken, User, ResetToken } from "./auth.models.js";
import ApiError from "../../utils/ApiError.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendRegistrationMail, sendResetPasswordMail } from "./auth.emails.js";
import { createProfile } from "../Gamification/userProfile.services.js";
import { generateOtp, hashToken, signAccessToken } from "../../utils/token.js";
const APP_NAME = process.env.APP_NAME;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Register newly
async function register(name, email, password) {
  if (!name) throw new ApiError(400, "Name is required");
  // Check if user exists already
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  await createProfile(user._id);
  // Get access token
  const accessToken = signAccessToken({ sub: user._id.toString() });

  // Get refresh token
  // Generate 40 random bytes, and convert them to hex text
  const refreshToken = hashToken(crypto.randomBytes(40).toString("hex"));

  // Save refresh token on db
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  // send registration mail
  sendRegistrationMail({
    to: user.email,
    name: user.name,
  });

  // return info
  return {
    user: { id: user._id, name, email },
    accessToken,
    refreshToken,
  };
}

// Login a user
async function login(email, password) {
  if (!email) throw new ApiError(400, "Email is required");

  if (!password) throw new ApiError(400, "Password is required");

  // Check if user exists
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Compare passwords
  const storedPassword = user.passwordHash;
  const ok = await bcrypt.compare(password, storedPassword);
  if (!ok) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Handle access and refresh tokens
  const accessToken = signAccessToken({ sub: user._id.toString() });

  const refreshToken = hashToken(crypto.randomBytes(40).toString("hex"));

  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  // return safe info
  return {
    user: { id: user._id, name: user.name },
    accessToken,
    refreshToken,
  };
}

// refresh token
async function refresh(refreshToken) {
  const token = await RefreshToken.findOne({ token: refreshToken });

  if (!token) throw new ApiError(401, "Invalid refresh token");

  if (token.revokedAt) {
    // if revokedAt is not null, possible token theft...revoke all tokens for this user
    await RefreshToken.updateMany(
      { userId: token.userId },
      { revokedAt: new Date() },
    );
    throw new ApiError(401, "Token reuse detected. All sessions revoked");
  }

  if (token.expiresAt < new Date())
    throw new ApiError(401, "Refresh token expired");

  const user = await User.findById(token.userId);

  if (!user) throw new ApiError(404, "Account not found");

  // revoke old token (revokedAt = now)
  token.revokedAt = new Date();
  await token.save();

  // issue and store a new refresh token, then return new access token
  const newRefreshToken = hashToken(crypto.randomBytes(40).toString("hex"));

  await RefreshToken.create({
    userId: token.userId,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

  const accessToken = signAccessToken({ sub: token.userId });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
}

// Logout
async function logout(refreshToken) {
  await RefreshToken.findOneAndUpdate(
    { token: refreshToken, revokedAt: null }, // criteria/filter to select the document
    { $set: { revokedAt: new Date() } }, // the update to apply
  );

  return {
    message: "Logged out",
  };
}

async function forgotPassword(email) {
  const user = await User.findOne({ email });

  // Silent return - to not reveal if the email exists or not
  if (!user) return;

  // Invalidate any existing unused reset tokens for this user
  await ResetToken.updateMany(
    { userId: user._id, usedAt: null },
    { usedAt: new Date() },
  );

  // Generate a new reset token
  const token = crypto.randomBytes(32).toString("hex");

  // Store the token
  await ResetToken.create({
    userId: user._id,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  // Send email to user with a reset link
  sendResetPasswordMail({
    to: user.email,
    resetUrl: `${FRONTEND_URL}/reset-password?token=${token}`,
  });

  return { message: "If an account exists, a reset link has been sent" };
}

async function verifyResetToken(token) {
  const tokenDoc = await ResetToken.findOne({ token });

  if (!tokenDoc) throw new ApiError(400, "Invalid or expired reset link");

  if (tokenDoc.usedAt)
    throw new ApiError(400, "This reset link has already been used");

  if (tokenDoc.expiresAt < new Date()) {
    throw new ApiError(
      400,
      "This reset link is expired. Please request a new one",
    );
  }

  const user = await User.findById(tokenDoc.userId).select("email");
  if (!user) throw new ApiError(404, "Account not found");

  // returning email so the frontend can show "Resetting password for {email}"
  return { valid: true, email: user.email };
}

async function resetPassword(token, newPassword) {
  const tokenDoc = await ResetToken.findOne({ token });

  if (!tokenDoc) throw new ApiError(400, "Invalid or expired reset link");

  if (tokenDoc.usedAt)
    throw new ApiError(400, "This reset link has already been used");

  if (tokenDoc.expiresAt < new Date()) {
    throw new ApiError(
      400,
      "This reset link is expired. Please request a new one",
    );
  }

  // Hash the new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  const user = await User.findById(tokenDoc.userId).select("+passwordHash");

  if (!user) throw new ApiError(404, "Account not found");

  user.passwordHash = newPasswordHash;
  await user.save();

  // Mark the reset token as used
  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  // Revoke all refresh tokens for this user
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { revokedAt: new Date() },
  );

  return { message: "Password has been reset. Please log in." };
}

async function changePassword(
  userId,
  currentPassword,
  newPassword,
  currentRefreshToken,
) {
  // Prevent setting the same password
  if (currentPassword === newPassword)
    throw new ApiError(
      400,
      "New password must be different from current password",
    );

  // Check if the refresh token provided is correct
  const refreshToken = await RefreshToken.findOne({
    token: currentRefreshToken,
  });

  if (!refreshToken) throw new ApiError(404, "Refresh token not found");

  if (refreshToken.revokedAt) throw new ApiError(400, "Token reuse detected");

  if (refreshToken.expiresAt < new Date())
    throw new ApiError(400, "Refresh token expired");

  const user = await User.findById(userId).select("+passwordHash");

  if (!user) throw new ApiError(404, "Account not found");

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw new ApiError(401, "Current password is incorrect");

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();

  // revoke all OTHER refresh tokens (keep the current session alive)
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null, token: { $ne: currentRefreshToken } },
    { revokedAt: new Date() },
  );

  return { message: "Password changed successfully" };
}

export default {
  register,
  login,
  logout,
  refresh,
  forgotPassword,
  verifyResetToken,
  resetPassword,
  changePassword,
};

// verifyForgotPasswordOtp("juliaaderemi+accountability@gmail.com", 971963)

// changePassword("juliaaderemi+accountability@gmail.com", "newPassword")
