# Design: Replace per-customer try-on with Anywear (Decart)

Date: 2026-11-18

## Intent / why

The current per-customer try-on uploads a selfie, calls a free Hugging Face Gradio Space (Kolors), waits 30s–2min, and rehosts the result on Cloudinary. It is slow and fragile (sleeping Spaces, queues, quota exhaustion). `tryanywear.ai` (the same product as `anywear.decart.ai`) is a free-during-beta **live camera** try-on from Decart. Replacing the per-customer path with its widget removes server-side generation for shoppers and gives instant, real-time results.

## Goals

- "Try it on" on a product page opens Anywear's live try-on for that product.
- No shopper photo upload, no server-side generation, no Cloudinary rehost for the customer path.
- Catalog/Wardrobe **pre-generated previews stay exactly as they are** (CatVTON + HF). Anywear cannot generate still images.
- Remove the dead per-customer backend/Redux code so there is one clear implementation.

## Non-goals / anti-goals

- Not replacing the CatVTON preview pipeline or changing product schema/preview admin UI.
- Not adding a paid fallback provider or a photo-upload fallback (approach A explicitly).
- Not building our own VTON model or proxying Decart's video stream through our backend.

## Constraints and findings

- Anywear's store integration is a single async script: `https://anywear.decart.ai/widget/latest/anywear.js?domain=<store-domain>`. Its loader exposes `window.DecartWidget` with `init(config)` and `open(options)`.
- The default `isProductPage` check looks for JSON-LD `@type: Product`/`ProductGroup`; our React SPA emits none. The widget's floating pill is on by default on desktop; `init({ showPill: false })` hides it.
- `init()` resets `widgetUrl` unless passed, so reconfiguring must pass `widgetUrl` derived from the loaded script's own `src` (strip `/anywear.js...`, append `/widget.html`).
- Free beta is limited-time/rate-limited; heavier use is a paid conversation. Camera video is processed by Decart during the session (see their privacy policy). A short disclosure belongs next to the button.
- Local dev runs at `localhost:4000`; verify early that the script loads and injects with a localhost/unconfigured domain. If it does not, the fix is an Anywear install/domain setting, not application code.

## Approaches considered

1. **A — Replace the photo flow (chosen).** One entry point, no backend generation. Trade-offs: camera required, result is a live session (no saved image), beta availability is outside our control.
2. B — Offer both photo upload and live Anywear. Preserves saved images and camera-less users, but keeps the flaky HF path and duplicates UI/code. Rejected by the user.
3. C — Swap to another photo VTON API (TryOnCloud/PixelAPI). Not Anywear and only free on trial credits. Rejected.

## Implementation shape (builder's brief)

**Frontend**

- New small loader, e.g. `frontend/src/utils/anywear.js` (or a hook): injects the official script once with `domain` from `import.meta.env.VITE_ANYWEAR_DOMAIN || location.hostname`; waits for `window.DecartWidget`; calls `init()` once with `widgetUrl` derived from the script URL, `showPill: false`, `isProductPage: () => true`, and `getGarmentMeta` returning the current product's category/gender when available. Export an `openAnywear()` promise that rejects with a friendly message if the widget never becomes ready (timeout ~10s).
- Rewrite `frontend/src/components/TryOnButton.jsx` as a thin button: keeps `productId`, `productName`, `canTryOn`, calls `openAnywear()`, shows a toast on load failure. Remove photo picker, webcam capture, Redux photo state, elapsed timer, result image, retry states. Keep the `.north-product-tryon button` hook used by `scripts/check-north-phase4.mjs`. Add a one-line privacy/beta note near the button.
- In `frontend/src/pages/Catalogue.jsx`, add a Product JSON-LD `<script type="application/ld+json">` with the product name, image (prefer `garmentImage || images[0]`), and canonical URL; pass garment info to the loader's `getGarmentMeta`.
- Delete `frontend/src/redux/slices/api/tryonApiSlice.js` and `frontend/src/redux/slices/tryonSlice.js`; remove the `tryon` reducer from `frontend/src/redux/store.js`. Add `VITE_ANYWEAR_DOMAIN` to `frontend/.env` (and any env example/template if present).
- Verify in a real browser that clicking the button opens the live try-on with the correct garment image. If auto-detection picks the wrong image, fix via the JSON-LD `image` and/or the widget's per-image button hook before considering custom code.

**Backend**

- Delete `backend/routes/tryonRoutes.js`, `backend/controllers/tryonController.js`, `backend/middleware/tryonRateLimit.js`, and their mount in `backend/routes/index.js`. Delete the throwaway `backend/_tryon_smoke.mjs`.
- Keep `backend/utils/hfTryon.js` (still used by `modelPreview.js` with CatVTON), `backend/utils/rehost.js`, and `resolveGarment`. Remove the now-unused Kolors-specific code/config if it is trivial; do not touch preview generation. Legacy commented snippets in `backend/index.js` may stay.

**Verification**

- `npm run build` in `frontend/` and a syntax check/start in `backend/`.
- Manual smoke: product page → click "Try it on" → camera permission → widget opens with the right garment → no console errors → close and reopen. Confirm no `/api/tryon` request is made.
- Re-run `frontend/scripts/check-north-phase4.mjs` if it is part of the normal checks.

## What is left to the builder

Minor sequencing choices (script loader location, exact disclosure wording) are the builder's call. Any finding that the widget cannot run on our domain, or cannot accept our garment image reliably, comes back to the user before adding custom infrastructure.

## Approval

Awaiting user approval of this design before implementation begins.
