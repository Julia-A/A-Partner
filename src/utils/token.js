import crypto from "crypto";
import jwt from "jsonwebtoken";



export const generateOtp = () => {
  // generate random number between 100,000 and 900,000
  const otp = Math.floor(Math.random() * 900000) + 100000
  return otp.toString();
}

export const generateJti = () => crypto.randomUUID();

export const signAccessToken = (payload) => {
 return jwt.sign(payload, process.env.ACCESS_JWT_SECRET, {
    expiresIn: process.env.ACCESS_JWT_EXPIRES_IN,
  });
};

export const signRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_JWT_SECRET, {
    expiresIn: process.env.REFRESH_JWT_EXPIRES_IN,
  });
};



export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
