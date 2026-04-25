import { User } from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";
import { uploadImageBuffer } from "../utils/cloudinaryUpload.js";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  emailVerified: user.emailVerified,
  profileImage: user.profileImage
});

export const getProfile = async (req, res) => {
  res.json({ user: publicUser(req.user) });
};

export const updateProfile = async (req, res) => {
  const name = req.body.name?.trim();
  const username = req.body.username?.trim().toLowerCase();

  if (username && username !== req.user.username) {
    const existing = await User.exists({ username, _id: { $ne: req.user._id } });

    if (existing) {
      return res.status(409).json({ message: "Username already taken" });
    }
  }

  const user = await User.findById(req.user._id);
  user.name = name || user.name;
  user.username = username || user.username;

  if (req.file) {
    const uploaded = await uploadImageBuffer(req.file.buffer, "expense-tracker/profiles");

    if (user.profileImagePublicId) {
      await cloudinary.uploader.destroy(user.profileImagePublicId).catch(() => null);
    }

    user.profileImage = uploaded.secure_url;
    user.profileImagePublicId = uploaded.public_id;
  }

  await user.save();

  res.json({ user: publicUser(user) });
};
