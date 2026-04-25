import multer from "multer";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const profileImageUploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error("Only jpg, png, and webp images are allowed"));
      return;
    }

    callback(null, true);
  }
}).single("profileImage");

export const uploadProfileImage = (req, res, next) => {
  profileImageUploader(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ message: "Profile photo must be under 2MB" });
      return;
    }

    res.status(400).json({ message: error.message });
  });
};
