// utils/hfTryon.js
// ---------------------------------------------------------------------------
// Virtual try-on via a FREE public Hugging Face Space (Kolors Virtual Try-On).
//
// [MIGRATION] This is the ONLY file that knows about the provider. To move to a
// paid provider (Replicate / fal.ai) for production reliability, keep the exported
// runTryOn({ personBuffer, personMime, garmentUrl }) -> { imageUrl, seed } contract
// and swap the body below. Nothing else in the app needs to change.
//
// Fragility note: the Kolors Space exposes the try-on fn WITHOUT an api_name
// (show_api=false), so we call it by function index. Free Spaces can sleep, queue,
// change fn order, close their API, or vanish. Every failure is classified and
// surfaced to the user as a friendly message (see tryonController).
// ---------------------------------------------------------------------------
import { Client } from "@gradio/client";

// [MIGRATION] Provider config — all overridable via env so you never edit code to repoint.
const HF_SPACE_ID = process.env.HF_SPACE_ID || "Kwai-Kolors/Kolors-Virtual-Try-On";
const HF_TOKEN = process.env.HF_TOKEN || undefined; // optional; improves shared-queue priority
const TRYON_FN_INDEX = Number(process.env.HF_TRYON_FN_INDEX) || 2; // Kolors "Run" click fn
// Keep BELOW the hosting platform's request timeout (e.g. Render) so we can return a
// friendly "busy" message before the platform kills the connection. See VTON_TRYON_PLAN.md §9.
const TRYON_TIMEOUT_MS = Number(process.env.TRYON_TIMEOUT_MS) || 90_000;
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

// Fetch the product's garment image (a Cloudinary URL) into a Blob for upload.
async function fetchGarmentBlob(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GARMENT_FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new TryOnUnavailableError(`garment fetch failed: ${resp.status}`);
    const type = resp.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await resp.arrayBuffer());
    return new Blob([buf], { type });
  } catch (err) {
    if (err.name === "AbortError") throw new TryOnUnavailableError("garment fetch timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }
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
  const person = new Blob([personBuffer], { type: personMime || "image/jpeg" });
  const garment = await fetchGarmentBlob(garmentUrl);

  // Connect (this also wakes a sleeping Space).
  let client;
  try {
    client = await Client.connect(HF_SPACE_ID, HF_TOKEN ? { hf_token: HF_TOKEN } : {});
  } catch (err) {
    throw new TryOnUnavailableError(`connect failed: ${err?.message || err}`);
  }

  // [MIGRATION] Kolors input order: [person_img, garment_img, seed, randomize_seed].
  // randomize_seed=true → fresh result each run (seed value is then ignored).
  const payload = [person, garment, 0, true];

  let submission;
  try {
    submission = client.submit(TRYON_FN_INDEX, payload);
  } catch (err) {
    // e.g. the Space closed its API / fn index no longer exists.
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
