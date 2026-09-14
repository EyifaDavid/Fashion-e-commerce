// controllers/tryonController.js
import Product from "../models/product.js";
import {
  runTryOn,
  TryOnBusyError,
  TryOnTimeoutError,
  TryOnUnavailableError,
} from "../utils/hfTryon.js";
import { rehostToCloudinary } from "../utils/rehost.js";
import { resolveGarment } from "../utils/modelPreview.js";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB (also enforced by multer in the route)

export const tryOn = async (req, res) => {
  try {
    const file = req.file;
    const { productId } = req.body;

    // --- Validate the upload (server is the source of truth) ---
    if (!file) {
      return res.status(400).json({ status: false, message: "Please upload a photo to try this on." });
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return res.status(400).json({ status: false, message: "Please upload a JPG, PNG or WebP image." });
    }
    if (file.size > MAX_BYTES) {
      return res.status(400).json({ status: false, message: "That image is too large. Please use one under 8MB." });
    }
    if (!productId) {
      return res.status(400).json({ status: false, message: "Missing product." });
    }

    // --- Look up the product + its garment image ---
    const product = await Product.findById(productId).select("images garmentImage name");
    if (!product) {
      return res.status(404).json({ status: false, message: "Product not found." });
    }
    const garmentUrl = resolveGarment(product);
    if (!garmentUrl) {
      return res.status(404).json({ status: false, message: "This product can't be tried on yet." });
    }

    // --- Call the free HF Space. The customer photo lives only in memory. ---
    // [NO PERSIST] req.file.buffer is never written to disk or Cloudinary.
    // [OPT-IN STORAGE] To keep the customer photo, upload req.file.buffer to Cloudinary HERE.
    const { imageUrl } = await runTryOn({
      personBuffer: file.buffer,
      personMime: file.mimetype,
      garmentUrl,
      provider: "kolors", // per-customer photos: Kolors has no ZeroGPU quota; CatVTON is reserved for previews
    });

    // HF file URLs 404 quickly (evicted from the Space's /tmp), so serve the result
    // from Cloudinary instead. On rehost failure we fall back to the raw URL rather
    // than failing a request that already paid ~30s to generate.
    let resultUrl = imageUrl;
    try {
      resultUrl = await rehostToCloudinary(imageUrl);
    } catch (rehostErr) {
      console.error("[tryon] rehost to Cloudinary failed, returning raw URL:", rehostErr?.message);
    }

    return res.status(200).json({ status: true, imageUrl: resultUrl });
  } catch (err) {
    // Log technical details; return only friendly, non-technical messages to users.
    console.error("[tryon] error:", err?.name, "-", err?.message);

    if (err instanceof TryOnBusyError || err instanceof TryOnTimeoutError) {
      return res.status(503).json({
        status: false,
        message: "Try-on is busy right now — please try again shortly.",
      });
    }
    if (err instanceof TryOnUnavailableError) {
      return res.status(503).json({
        status: false,
        message: "Try-on is starting up (it's a free service). Please try again in a minute.",
      });
    }
    return res.status(500).json({ status: false, message: "Try-on failed. Please try again." });
  } finally {
    // [NO PERSIST] Drop the buffer reference as soon as the request is done.
    if (req.file) req.file.buffer = null;
  }
};
