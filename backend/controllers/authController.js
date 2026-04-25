import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { createToken } from "../utils/token.js";
import { verifyGoogleCredential } from "../utils/google.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  emailVerified: user.emailVerified
});

export const checkUsername = async (req, res) => {
  const username = req.params.username.toLowerCase();
  const existing = await User.exists({ username });
  res.json({ available: !existing });
};

export const signup = async (req, res) => {
  const { name, username, email, password, googleCredential } = req.body;
  const normalizedUsername = username.toLowerCase();
  const normalizedEmail = email.toLowerCase();

  const googleUser = await verifyGoogleCredential(googleCredential);

  if (googleUser.email !== normalizedEmail) {
    return res.status(400).json({ message: "Google verified email must match signup email" });
  }

  const existingUsername = await User.exists({ username: normalizedUsername });
  if (existingUsername) {
    return res.status(409).json({ message: "Username is already taken" });
  }

  const existingEmail = await User.exists({ email: normalizedEmail });
  if (existingEmail) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    username: normalizedUsername,
    email: normalizedEmail,
    password: hashedPassword,
    googleSub: googleUser.sub,
    emailVerified: true
  });

  res.status(201).json({
    user: publicUser(user),
    token: createToken(user)
  });
};

export const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username: username.toLowerCase() });

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  res.json({
    user: publicUser(user),
    token: createToken(user)
  });
};

export const me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};
