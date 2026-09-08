// routes/tryonRoutes.js
// POST /api/tryon  — virtual try-on against a free Hugging Face Space.
// (Mounted at "/tryon" in routes/index.js → full path /api/tryon.)
//
// [MIGRATION] Free-tier MVP. When moving to a paid provider, only utils/hfTryon.js changes;
// this route, its validation, rate limiting and auth stay the same.
import express from "express";
import multer from "multer";
import { protectRoute } from "../middleware/authMiddleware.js";
import tryonRateLimit from "../middleware/tryonRateLimit.js";
import { tryOn } from "../controllers/tryonController.js";

const router = express.Router();

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

// [NO PERSIST] Memory storage — the customer photo is never written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "photo"));
  },
});

// Turn multer errors (too large / wrong type) into friendly 400s instead of a 500.
function handlePhotoUpload(req, res, next) {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      const tooLarge = err.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({
        status: false,
        message: tooLarge
          ? "That image is too large. Please use one under 8MB."
          : "Please upload a JPG, PNG or WebP image under 8MB.",
      });
    }
    next();
  });
}

// Order matters: auth sets req.user → rate-limit keys off it → then we accept the upload.
router.post("/", protectRoute, tryonRateLimit, handlePhotoUpload, tryOn);

export default router;
