// utils/hfTryon.js
// ---------------------------------------------------------------------------
// Virtual try-on via FREE public Hugging Face Spaces.
//
// Default provider: zhengchong/CatVTON (mask-free via its auto-masker).
// Legacy provider:  Kwai-Kolors/Kolors-Virtual-Try-On (env HF_PROVIDER=kolors).
//
// [MIGRATION] This is the ONLY file that knows about the provider(s). To move to a
// paid provider (Replicate / fal.ai) for production reliability, keep the exported
// runTryOn({ personBuffer, personMime, garmentUrl }) -> { imageUrl, seed } contract
// and swap the body below. Nothing else in the app needs to change.
//
// Fragility note: free Spaces can sleep, queue, change endpoint names, close their
// API, or vanish. Every failure is classified and surfaced to the user as a friendly
// message (see tryonController).
// ---------------------------------------------------------------------------
import { Client, handle_file } from "@gradio/client";

// --- Global provider config (all overridable via env) ---
const HF_PROVIDER = process.env.HF_PROVIDER || "catvton"; // "catvton" | "kolors"
const HF_SPACE_ID =
  process.env.HF_SPACE_ID ||
  (HF_PROVIDER === "kolors" ? "Kwai-Kolors/Kolors-Virtual-Try-On" : "zhengchong/CatVTON");
const HF_TOKEN = process.env.HF_TOKEN || undefined; // optional; improves shared-queue priority

// --- CatVTON (zhengchong/CatVTON) tuning ---
// Default endpoint is submit_function_p2p — the space's TRUE mask-free variant
// (Instruct-Pix2Pix, no mask input at all), which is the closest live match to the
// "CatVTON-MaskFree" model. The alternative endpoints (submit_function /
// submit_function_flux) need a drawn-ish mask layer, which we can't reliably feed,
// so they're opt-in via CATVTON_ENDPOINT.
const CATVTON_ENDPOINT = process.env.CATVTON_ENDPOINT || "submit_function_p2p";
// Auto-mask garment region when nobody draws a mask: upper | lower | overall.
// Only consulted by submit_function / submit_function_flux, unused by p2p.
const CATVTON_CLOTH_TYPE = process.env.TRYON_CLOTH_TYPE || "upper";
const CATVTON_STEPS = Number(process.env.TRYON_STEPS) || 50;
const CATVTON_GUIDANCE = Number(process.env.TRYON_GUIDANCE) || 2.5;
const CATVTON_SEED = -1; // -1 = random (the Space's slider minimum)

// --- Legacy Kolors (Kwai-Kolors/Kolors-Virtual-Try-On) tuning ---
// The Kolors Space exposes the try-on fn WITHOUT an api_name (show_api=false), so we
// call it by function index ("Run" click). Only used when HF_PROVIDER === "kolors".
const KOLORS_FN_INDEX = Number(process.env.HF_TRYON_FN_INDEX) || 2;

// Keep BELOW the hosting platform's request timeout (e.g. Render) so we can return a
// friendly "busy" message before the platform kills the connection. See VTON_TRYON_PLAN.md §9.
const TRYON_TIMEOUT_MS = Number(process.env.TRYON_TIMEOUT_MS) || 120_000;
const GARMENT_FETCH_TIMEOUT_MS = 15_000;

// Typed errors so the controller can map them to the right HTTP status + message.
export class TryOnBusyError extends Error {
  constructor(m) { super(m); this.name = "TryOnBusyError"; }
}
export class TryOnTimeoutError extends Error {
  constructor(m) { super(m); this.name = "TryOnTimeoutError"; }
}
export class TryOnUnavailableError extends Error {
  constructor(m) { super(m); this.name = "TryOnUnavailableError"; }
}

// Fetch the product's garment image (a Cloudinary URL) into an in-memory buffer.
async function fetchGarment(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GARMENT_FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new TryOnUnavailableError(`garment fetch failed: ${resp.status}`);
    const mime = resp.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await resp.arrayBuffer());
    return { buffer, mime };
  } catch (err) {
    if (err.name === "AbortError") throw new TryOnUnavailableError("garment fetch timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Build the person value for a gr.ImageEditor input. The person is sent as a Blob
// (auto-uploaded by `walk_and_store_blobs` → `handle_blob`, which replaces it with a
// proper FileData dict). For the p2p endpoint layers MUST be empty (the 1×1 black-PNG
// mask layer we used before made the Space fail with "broken data stream when reading
// image file" on its multi-worker ZeroGPU replicas).
function buildPersonEditorValue(personBuffer, personMime) {
  return {
    background: new Blob([personBuffer], { type: personMime || "image/jpeg" }),
    layers: [],
  };
}

// [MIGRATION] CatVTON — one of the zhengchong/CatVTON endpoints. Verified live (2026-09):
// pass the garment as an https URL via handle_file() and the person as a Blob (the
// client uploads it to the Space). Layers stay empty — submit_function_p2p is the true
// mask-free variant. Data-URI strings and raw blob garments fail on this multi-worker
// Space ("File name too long" / "broken data stream when reading image file").
function buildCatVtonPayload(personBuffer, personMime, garmentUrl) {
  const person = buildPersonEditorValue(personBuffer, personMime);
  const garment = handle_file(garmentUrl);

  if (CATVTON_ENDPOINT === "submit_function_p2p") {
    // Truly mask-free pix2pix variant: [person, garment, steps, guidance, seed]
    return {
      endpoint: "submit_function_p2p",
      payload: [person, garment, CATVTON_STEPS, CATVTON_GUIDANCE, CATVTON_SEED],
    };
  }

  // submit_function / submit_function_flux:
  // [person, garment, cloth_type, steps, guidance, seed, show_type]
  return {
    endpoint: CATVTON_ENDPOINT,
    payload: [
      person,
      garment,
      CATVTON_CLOTH_TYPE,
      CATVTON_STEPS,
      CATVTON_GUIDANCE,
      CATVTON_SEED,
      "result only",
    ],
  };
}

// [MIGRATION] Legacy Kolors — [person_img, garment_img, seed, randomize_seed].
// randomize_seed=true → fresh result each run (seed value is then ignored).
function buildKolorsPayload(personBuffer, personMime, garmentUrl) {
  return {
    endpoint: KOLORS_FN_INDEX,
    payload: [
      new Blob([personBuffer], { type: personMime || "image/jpeg" }),
      new Blob([garmentUrl.buffer], { type: garmentUrl.mime }),
      0,
      true,
    ],
  };
}

function extractImageUrl(output) {
  if (!output) return null;
  if (typeof output === "string") return output;           // sometimes a plain URL
  if (output.url) return output.url;                       // gradio FileData (typical)
  if (output.path && /^https?:\/\//.test(output.path)) return output.path;
  return null;
}

/**
 * Run a virtual try-on.
 * @param {{ personBuffer: Buffer, personMime?: string, garmentUrl: string }} args
 * @returns {Promise<{ imageUrl: string, seed?: number }>}
 */
export async function runTryOn({ personBuffer, personMime, garmentUrl }) {
  const provider = HF_PROVIDER === "kolors" ? "kolors" : "catvton";

  // Connect (this also wakes a sleeping Space).
  let client;
  try {
    client = await Client.connect(HF_SPACE_ID, HF_TOKEN ? { hf_token: HF_TOKEN } : {});
  } catch (err) {
    throw new TryOnUnavailableError(`connect failed: ${err?.message || err}`);
  }

  const { endpoint, payload } =
    provider === "kolors"
      ? buildKolorsPayload(personBuffer, personMime, await fetchGarment(garmentUrl))
      : buildCatVtonPayload(personBuffer, personMime, garmentUrl);

  let submission;
  try {
    if (provider === "kolors") {
      submission = client.submit(endpoint, payload);
    } else {
      // CatVTON is called by API name; prepend "/" so it resolves via api_map.
      submission = client.submit(`/${endpoint}`, payload);
    }
  } catch (err) {
    // e.g. the Space closed its API / endpoint no longer exists.
    throw new TryOnUnavailableError(`submit failed: ${err?.message || err}`);
  }

  return await new Promise((resolve, reject) => {
    let settled = false;
    let lastData = null;

    const finish = (fn, arg) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(arg);
    };

    // Timeout → cancel the queue slot (polite on a shared free Space) and fail friendly.
    const timer = setTimeout(() => {
      try { submission.cancel?.(); } catch { /* noop */ }
      finish(reject, new TryOnTimeoutError(`no result within ${TRYON_TIMEOUT_MS}ms`));
    }, TRYON_TIMEOUT_MS);

    (async () => {
      try {
        for await (const msg of submission) {
          if (settled) break;
          if (msg?.type === "data") {
            lastData = msg.data;
          } else if (msg?.type === "status" && msg.stage === "error") {
            const text = String(msg.message || "").toLowerCase();
            if (text.includes("queue") || text.includes("full") || text.includes("too many")) {
              return finish(reject, new TryOnBusyError(msg.message || "queue full"));
            }
            return finish(reject, new TryOnUnavailableError(msg.message || "space error"));
          }
        }
        if (settled) return;
        const imageUrl = extractImageUrl(lastData?.[0]);
        if (!imageUrl) return finish(reject, new TryOnUnavailableError("no image in response"));
        finish(resolve, { imageUrl, seed: lastData?.[1] });
      } catch (err) {
        finish(reject, new TryOnUnavailableError(err?.message || "stream failed"));
      }
    })();
  });
}