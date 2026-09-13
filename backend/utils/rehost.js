// utils/rehost.js
// ---------------------------------------------------------------------------
// Fetch an image from a (possibly ephemeral) source URL and store the bytes in
// Cloudinary, returning a durable secure_url.
//
// Why this exists: the free Kolors HF Space returns result URLs that live in a
// worker's /tmp/gradio dir and 404 within seconds (load-balanced Space). Rehosting
// the bytes to Cloudinary makes the URL durable and reachable from every
// device/browser (incl. iOS).
//
// Shared by:
//   - the per-customer try-on flow  → folder "tryon-results" (ephemeral display)
//   - the pre-generated on-model previews → folder "model-previews" (persisted on the product)
// ---------------------------------------------------------------------------
import cloudinary from "./cloudinary.js";

const REHOST_TIMEOUT_MS = 15_000; // guard against a slow HF file fetch

/**
 * @param {string} sourceUrl  The image URL to copy (e.g. an ephemeral HF result URL).
 * @param {string} [folder]   Cloudinary folder to store it in. Defaults to "tryon-results".
 * @returns {Promise<string>} A durable Cloudinary secure_url.
 */
export async function rehostToCloudinary(sourceUrl, folder = "tryon-results") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REHOST_TIMEOUT_MS);
  let resp;
  try {
    resp = await fetch(sourceUrl, { signal: controller.signal });
    if (!resp.ok) throw new Error(`result fetch failed: ${resp.status}`);
  } catch (err) {
    if (err.name === "AbortError") throw new Error("result fetch timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());

  const upload = (buf, options) =>
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) =>
        error ? reject(error) : resolve(result)
      );
      stream.end(buf);
    });

  const result = await upload(buffer, { folder, resource_type: "image" });
  return result.secure_url;
}

export default rehostToCloudinary;
