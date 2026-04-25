import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    },
    env.jwtSecret,
    { expiresIn: "7d" }
  );
