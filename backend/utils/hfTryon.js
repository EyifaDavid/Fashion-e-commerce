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
// Two Spaces serve different callers: model-preview generation uses CatVTON
// (mask-free), while the per-customer photo try-on uses Kolors (a regular GPU
// Space WITHOUT the strict free ZeroGPU daily quota that CatVTON is subject to).
// HF_PROVIDER sets the default when a caller doesn't pass `provider`.
const HF_PROVIDER = process.env.HF_PROVIDER || "catvton"; // default "catvton" | "kolors"
const CATVTON_SPACE_ID = process.env.HF_SPACE_ID || "zhengchong/CatVTON";
const KOLORS_SPACE_ID = process.env.HF_KOLORS_SPACE_ID || "Kwai-Kolors/Kolors-Virtual-Try-On";
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
export async function runTryOn({ personBuffer, personMime, garmentUrl, provider }) {
  // provider: "catvton" (preview generation) | "kolors" (per-customer photos).
  // Defaults to HF_PROVIDER so a whole-deploy switch is still one env var.
  const resolvedProvider = provider || HF_PROVIDER || "catvton";
  const spaceId = resolvedProvider === "kolors"
    ? KOLORS_SPACE_ID
    : CATVTON_SPACE_ID;

  // Connect (this also wakes a sleeping Space).
  let client;
  try {
    client = await Client.connect(spaceId, HF_TOKEN ? { hf_token: HF_TOKEN } : {});
  } catch (err) {
    throw new TryOnUnavailableError(`connect failed: ${err?.message || err}`);
  }

  const { endpoint, payload } =
    resolvedProvider === "kolors"
      ? buildKolorsPayload(personBuffer, personMime, await fetchGarment(garmentUrl))
      : buildCatVtonPayload(personBuffer, personMime, garmentUrl);

  let submission;
  try {
    // CatVTON is called by API name (prepended "/" so it resolves via api_map);
    // Kolors has no api_name (show_api=false) so it's called by fn index.
    // 5th arg all_events=true so `status:error` messages are surfaced (else a
    // Space rejection like "ZeroGPU quota exceeded" is silently dropped and all
    // we ever see is the generic "no image in response").
    submission = client.submit(resolvedProvider === "kolors" ? endpoint : `/${endpoint}`, payload, null, null, true);
  } catch (err) {
    // e.g. the Space's API is closed / the endpoint was renamed / a stale HF_SPACE_ID
    // points at the wrong Space. Name the Space in the error so misconfig is obvious.
    const hint = /no endpoint matching/i.test(err?.message || "")
      ? ` (is HF_SPACE_ID=${spaceId} exposing ${endpoint}?)`
      : "";
    throw new TryOnUnavailableError(`submit to ${spaceId} failed: ${err?.message || err}${hint}`);
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
            if (text.includes("quota") || text.includes("rate limit")) {
              // ZeroGPU quota: the free Space's daily allowance is exhausted.
              return finish(reject, new TryOnUnavailableError(
                "The free AI service has hit its daily quota. Ask the admin to set HF_TOKEN, or try again tomorrow."
              ));
            }
            // Surface the Space's real error text (e.g. an image the Space couldn't read).
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