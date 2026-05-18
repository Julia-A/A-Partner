import jwt from "jsonwebtoken";
import { User } from "../features/auth/auth.models.js";
import ApiError from "../utils/ApiError.js";

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new ApiError(401, "Invalid authorization header");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new ApiError(401, "Token not found");
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.ACCESS_JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Invalid token");
  }

  // find user in database
  const user = await User.findOne({ _id: payload.sub });

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  req.user = {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
  };

  next();
};

export default requireAuth;
