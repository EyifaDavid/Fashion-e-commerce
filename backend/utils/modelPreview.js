// utils/modelPreview.js
// ---------------------------------------------------------------------------
// Pre-generated "on-model" previews.
//
// Instead of generating a try-on per customer request, we generate ONE clean
// on-model image per product+gender: the product's garment composited onto a
// FIXED reference model (male / female, plain background, neutral pose). It's
// generated once, persisted to Cloudinary, stored on the product, and shown to
// every visitor by default — no per-visit API call, no loading wait.
//
// This reuses the EXACT same VTON path as the per-customer "see it on yourself"
// flow (utils/hfTryon.js → runTryOn), only the "person" image is our fixed
// reference model instead of a customer upload. The per-customer flow is
// unchanged and independent.
// ---------------------------------------------------------------------------
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import Product from "../models/product.js";
import { runTryOn } from "./hfTryon.js";
import { rehostToCloudinary } from "./rehost.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REF_DIR = path.join(__dirname, "..", "assets", "reference-models");

// The two committed reference photos. Keys are the canonical gender values stored
// in product.genders. mime must match the file so the VTON Space reads it correctly.
const REFERENCE_MODELS = {
  Male: { file: "male.png", mime: "image/png" },
  Female: { file: "female.jpg", mime: "image/jpeg" },
};

// product.genders → the field the generated preview is saved to.
const PREVIEW_FIELD = {
  Male: "modelPreviewMale",
  Female: "modelPreviewFemale",
};

// Accept the canonical "Male"/"Female" plus common aliases, so callers (hooks,
// an admin button, a query param) don't have to care about exact casing.
function normalizeGender(g) {
  const key = String(g || "").trim().toLowerCase();
  if (key === "male" || key === "men" || key === "man") return "Male";
  if (key === "female" || key === "women" || key === "woman") return "Female";
  return null;
}

// [VTON] Which product image to send as the garment: dedicated field first, else primary image.
// Shared with tryonController (the per-customer flow) so both resolve garments identically.
export function resolveGarment(product) {
  return product?.garmentImage || product?.images?.[0] || null;
}

/**
 * Generate ONE on-model preview (product's garment on the fixed reference model for
 * `gender`), persist it to Cloudinary, and store the URL on the product. Only the
 * targeted gender's field is written — the other is never touched.
 *
 * @param {string} productId
 * @param {string} gender  "Male" | "Female" (aliases accepted)
 * @returns {Promise<string>} the durable Cloudinary URL that was stored
 */
export async function generateModelPreview(productId, gender) {
  const canonical = normalizeGender(gender);
  if (!canonical) throw new Error(`unsupported gender: ${gender}`);

  const product = await Product.findById(productId).select("images garmentImage name");
  if (!product) throw new Error("product not found");

  const garmentUrl = resolveGarment(product);
  if (!garmentUrl) throw new Error("no garment image to generate a preview from");

  const ref = REFERENCE_MODELS[canonical];
  const personBuffer = await readFile(path.join(REF_DIR, ref.file));

  // Same VTON call as the per-customer flow — only the "person" differs.
  const { imageUrl } = await runTryOn({
    personBuffer,
    personMime: ref.mime,
    garmentUrl,
  });

  // HF result URLs 404 within seconds; rehost to a durable Cloudinary URL.
  const durableUrl = await rehostToCloudinary(imageUrl, "model-previews");

  // Write only this gender's field (atomic $set), leaving the other preview intact.
  await Product.findByIdAndUpdate(productId, { [PREVIEW_FIELD[canonical]]: durableUrl });
  return durableUrl;
}

// Guard against overlapping runs for the same product+gender (e.g. a rapid
// double-save, or the auto-hook racing the admin "Generate" button). In-memory /
// per-instance — enough for a single backend process; a multi-instance deploy
// would want a shared lock, noted in VTON_TRYON_PLAN.md.
const inFlight = new Set();

/**
 * Refresh the previews a product should have, based on its `genders`. Designed to
 * be called fire-and-forget from the add/update hooks: it NEVER throws (a failed
 * free-tier VTON call must not break a product save) and generates SEQUENTIALLY
 * (the shared free Space is effectively single-slot; parallel calls just queue).
 *
 * @param {string} productId
 * @param {{ force?: boolean }} [opts]  force=true regenerates even if a preview
 *        already exists (use when the garment/primary image changed). Default false
 *        only fills in missing previews.
 */
export async function refreshProductPreviews(productId, { force = false } = {}) {
  let product;
  try {
    product = await Product.findById(productId).select(
      "genders images garmentImage modelPreviewMale modelPreviewFemale"
    );
  } catch (err) {
    console.error(`[modelPreview] lookup failed for ${productId}:`, err?.message);
    return;
  }
  if (!product) return;
  if (!resolveGarment(product)) return; // nothing to composite yet — leave previews empty

  const genders = [...new Set((product.genders || []).map(normalizeGender).filter(Boolean))];

  for (const gender of genders) {
    const hasPreview = Boolean(product[PREVIEW_FIELD[gender]]);
    if (!force && hasPreview) continue; // keep the existing one unless we're forcing a refresh

    const key = `${productId}:${gender}`;
    if (inFlight.has(key)) continue;
    inFlight.add(key);
    try {
      await generateModelPreview(productId, gender);
      console.log(`[modelPreview] generated ${gender} preview for product ${productId}`);
    } catch (err) {
      console.error(`[modelPreview] ${gender} preview failed for ${productId}:`, err?.message);
    } finally {
      inFlight.delete(key);
    }
  }
}

/**
 * Generate missing previews for ALL products in the catalog.
 *
 * Runs as a SINGLE sequential background job — one product+gender at a time —
 * because the free VTON Space is effectively single-slot (parallel calls just
 * queue and time out). The job is kicked off fire-and-forget; the caller gets
 * a 202 back immediately with only the count of previews that were queued.
 *
 * Guards against overlapping runs: `bulkInFlight` stays true for the entire
 * duration of the background job, so a second click returns "already running".
 * The per-product `inFlight` set (shared with refreshProductPreviews) also
 * ensures a preview being generated by the add/update hook isn't double-fired.
 *
 * @returns {Promise<{status, message, queued}>}
 */
let bulkInFlight = false;

export async function generateAllMissingPreviews() {
  if (bulkInFlight) {
    return { status: 'already-running', message: 'Bulk preview generation is already running.' };
  }

  // Fast pass: snapshot the catalog and count what's missing BEFORE launching,
  // so the caller gets a real "queued" number while the job runs in background.
  const products = await Product.find({})
    .select('images garmentImage genders modelPreviewMale modelPreviewFemale')
    .lean();

  const pending = products.filter((product) => {
    if (!resolveGarment(product)) return false;
    const genders = [...new Set((product.genders || []).map(normalizeGender).filter(Boolean))];
    return genders.some((g) => !product[PREVIEW_FIELD[g]]);
  });

  if (pending.length === 0) {
    return { status: 'done', message: 'All products already have on-model previews.', queued: 0 };
  }

  bulkInFlight = true;

  // Background job — strictly sequential. Runs to completion (or an unrecoverable
  // error) before the next bulk request is allowed.
  (async () => {
    for (const product of pending) {
      const genders = [...new Set((product.genders || []).map(normalizeGender).filter(Boolean))];
      for (const gender of genders) {
        if (product[PREVIEW_FIELD[gender]]) continue;

        const key = `${product._id}:${gender}`;
        if (inFlight.has(key)) continue; // a hook/button run already has this one
        inFlight.add(key);
        try {
          await generateModelPreview(product._id, gender);
          console.log(`[modelPreview] bulk: generated ${gender} preview for ${product._id}`);
        } catch (err) {
          console.error(`[modelPreview] bulk: ${gender} preview failed for ${product._id}:`, err?.message);
        } finally {
          inFlight.delete(key);
        }
      }
    }
  })()
    .catch((err) =>
      console.error('[modelPreview] bulk job crashed:', err?.message)
    )
    .finally(() => {
      bulkInFlight = false;
    });

  return {
    status: 'started',
    message: `Queued ${pending.length} product(s) for background preview generation.`,
    queued: pending.length,
  };
}

export default { generateModelPreview, refreshProductPreviews, resolveGarment, generateAllMissingPreviews };