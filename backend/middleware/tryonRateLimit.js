// middleware/tryonRateLimit.js
// [FREE-TIER] We share a PUBLIC Hugging Face Space's queue — this protects that shared
// resource (and other shoppers' experience), not just our own quota.
// [MIGRATION] On a paid provider you own the quota; relax the numbers or remove entirely.
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_WINDOW = Number(process.env.TRYON_RATE_MAX) || 5;

const tryonRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  limit: MAX_PER_WINDOW,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // Prefer the logged-in user id; fall back to a normalized IP for safety.
  keyGenerator: (req) =>
    req.user?._id ? `user:${req.user._id}` : `ip:${ipKeyGenerator(req.ip)}`,
  handler: (req, res) =>
    res.status(429).json({
      status: false,
      message: "You've reached the try-on limit. Please wait a few minutes and try again.",
    }),
});

export default tryonRateLimit;
