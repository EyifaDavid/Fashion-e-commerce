# Anywear Live Try-On Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the photo-upload/Hugging Face per-customer try-on with Anywear's live camera widget, leaving the CatVTON catalog preview pipeline untouched.

**Architecture:** A single small frontend loader injects Anywear's official async script, reconfigures `DecartWidget` (pill off, product page on), and exposes `openAnywear()`. The existing "Try it on" button becomes a thin launcher. All per-customer backend/RTK/Redux try-on code is deleted; previews keep using `hfTryon.js` CatVTON.

**Tech Stack:** React 19 + Vite 6, Redux Toolkit, Node `node:test` for pure-module tests, existing CDP browser smoke script, Anywear widget script (no new npm dependencies).

**Spec:** `docs/superpowers/specs/2026-11-18-anywear-tryon-design.md`

## Global Constraints

- Keep the CSS/DOM hook `.north-product-tryon button` used by `frontend/scripts/check-north-phase4.mjs`.
- Do **not** modify `backend/utils/hfTryon.js` CatVTON behavior, `backend/utils/modelPreview.js`, `backend/utils/rehost.js`, the product schema, or preview admin UI.
- No `/api/tryon` request may remain in the frontend; no shopper photo may be uploaded or persisted.
- Widget domain: `import.meta.env.VITE_ANYWEAR_DOMAIN || location.hostname`. Script URL: `https://anywear.decart.ai/widget/latest/anywear.js?domain=<encoded-domain>`.
- Re-init must pass `widgetUrl` derived from the loaded script's `src`; `showPill: false`; `isProductPage: () => true`.
- Show a short beta/privacy note near the button (camera processed by Decart during the session; free beta, rate-limited).
- No new npm dependencies. Commit messages use conventional `feat:` / `chore:` prefixes.

## Review Focus

1. **Widget script blocked/slow on localhost or an unregistered domain** — button must show a friendly toast, not spin forever. Test: `ensureAnywear` timeout rejection message (unit); smoke confirms no uncaught error, manual check confirms the toast on a blocked script.
2. **Wrong or missing garment image** — JSON-LD `Product.image` must point to `garmentImage || images[0]`. Test: smoke fetches `/api/products/<id>` in the page and compares its `data.garmentImage || data.images[0]` with the JSON-LD `image`; manual browser check confirms the rendered garment.
3. **Duplicate floating pill / duplicate script injection** — must be one script tag and one `init()`. Test: fake-DOM unit test counts script insertions and init calls.
4. **Legacy try-on route still referenced** — deletion must be complete. Test: `backend/tests/no-legacy-tryon.test.mjs` plus grep across `frontend/src` and `backend`.
5. **Camera permission denial inside the widget** — button must remain usable and no app state should break. Test: manual browser check in Task 4 (widget owns this behavior; no custom recovery code).

---

### Task 1: Anywear loader utility (unit-tested)

**Files:**
- Create: `frontend/src/utils/anywear.js`
- Create: `frontend/src/utils/anywear.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `buildAnywearScriptUrl(domain: string): string`
  - `widgetHtmlUrl(scriptSrc: string): string | null`
  - `ensureAnywear({ domain: string, getGarmentMeta?: () => object, timeoutMs?: number, doc?: Document, win?: Window }): Promise<{ open: (options?: object) => void }>` — injects once, waits for `window.DecartWidget`, calls `init()` once with derived `widgetUrl`, `showPill: false`, `isProductPage: () => true`, and the supplied `getGarmentMeta` (or widget default). Rejects with `Error("Live try-on couldn't load. Please try again in a moment.")` on timeout.
  - `openAnywear(options: object): Promise<void>` — calls `ensureAnywear(options)` then `widget.open(options.openOptions)`; propagates the friendly error.

- [ ] **Step 1: Write the failing tests** in `frontend/src/utils/anywear.test.mjs` using `node:test` + `node:assert/strict`:
  - `buildAnywearScriptUrl("MyStore.com?x=1")` equals `https://anywear.decart.ai/widget/latest/anywear.js?domain=MyStore.com%3Fx%3D1`.
  - `widgetHtmlUrl("https://anywear.decart.ai/widget/latest/anywear.js?domain=x")` equals `https://anywear.decart.ai/widget/latest/widget.html`; a non-matching src returns `null`.
  - With a fake `doc`/`win`, `ensureAnywear({ domain: "store.test", timeoutMs: 30, doc, win })` injects exactly one `<script>` whose `src` matches `buildAnywearScriptUrl`, then (after the test sets `win.DecartWidget = { init, open }` and fires the script's load handler) calls `init` exactly once with `showPill === false`, `isProductPage() === true`, and a `widgetUrl` ending in `/widget.html`; returns the widget object.
  - A second `ensureAnywear` call with the same fake DOM injects no new script and calls `init` no further times.
  - With no `DecartWidget` appearing, `ensureAnywear({ timeoutMs: 30 })` rejects with the exact friendly message above.

- [ ] **Step 2: Run the tests to verify they fail**

Run from `frontend/`: `node --test src/utils/anywear.test.mjs`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `frontend/src/utils/anywear.js`**

Pure helpers are plain functions; `ensureAnywear` uses injectable `doc`/`win` (defaulting to globals), a module-level `initDone` flag, and a polling interval cleared on success/timeout. Keep DOM work inside these functions so the module is import-safe in Node. `openAnywear` is the only function that calls `widget.open()`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test src/utils/anywear.test.mjs` — Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/anywear.js frontend/src/utils/anywear.test.mjs
git commit -m "feat: add Anywear widget loader with unit tests"
```

---

### Task 2: Product page launches live try-on

**Files:**
- Modify: `frontend/src/components/TryOnButton.jsx` (replace contents)
- Modify: `frontend/src/pages/Catalogue.jsx:133-135` (button props + JSON-LD)
- Modify: `frontend/.env:1-8` (add `VITE_ANYWEAR_DOMAIN`)
- Modify: `frontend/scripts/check-north-phase4.mjs:193-196` (new assertions)

**Interfaces:**
- Consumes: `openAnywear(options)` from Task 1.
- Produces: `TryOnButton({ productId, productName, canTryOn, garmentUrl })` — button only; `garmentUrl` used for JSON-LD/auto-detection support. Catalogue emits one `<script type="application/ld+json">` with `@type: "Product"`, `name`, `image: garmentImage || images[0]`, `url: window.location.href`.

- [ ] **Step 1: Add failing smoke assertions** to `frontend/scripts/check-north-phase4.mjs` near the existing try-on check (line 193):
  - `document.querySelectorAll('.north-product-tryon button').length === 1` and its text is exactly `Try it on`.
  - `document.querySelector('.north-product-tryon input[type=file]')` is `null`.
  - A `script[type="application/ld+json"]` parses to an object whose `@type` is `Product`. In the page context, `fetch('/api/products/' + id, { credentials: 'include' }).then(r => r.json())` yields `json.data.garmentImage || json.data.images[0]`; assert it equals the JSON-LD `image`. (Use the product `id` already captured by the script at line 171.)
  - Subscribe to `Network.requestWillBeSent` before the product-page section and assert no request URL contains `/api/tryon` through the end of the product checks.

- [ ] **Step 2: Run the smoke script to verify it fails**

Run from `frontend/` with the dev server and a Chrome CDP endpoint running: `NORTH_CDP_ORIGIN=http://127.0.0.1:9222 node scripts/check-north-phase4.mjs`
Expected: FAIL at the new JSON-LD / no-file-input assertion. If CDP is unavailable, record that honestly and rely on Task 4's build + manual check; do not claim a pass.

- [ ] **Step 3: Rewrite `TryOnButton.jsx`**

Keep props `productId`, `productName`, `canTryOn`; add `garmentUrl`. Render one `<button type="button" className="flex items-center gap-2 border border-black px-6 py-3 rounded-full hover:bg-black hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed">` with `MdCheckroom` icon and text `Try it on`, `disabled={!canTryOn}`, plus a small `<p>` with the beta/privacy note. On click: `setBusy(true)`, `await openAnywear({ domain: import.meta.env.VITE_ANYWEAR_DOMAIN || location.hostname })`, `toast.error(err.message)` on failure, `setBusy(false)` in `finally`. Remove all photo/file/camera/Redux/modal/result code and the now-unused imports. `productId`/`productName` remain accepted for call-site compatibility and appear in `title` only.

- [ ] **Step 4: Update `Catalogue.jsx`**

Pass `garmentUrl={product.garmentImage || product.images?.[0]}` to `TryOnButton`. Add the JSON-LD `<script>` inside the returned product page markup using `JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: product.name, image: product.garmentImage || product.images?.[0], url: window.location.href })`. Do not inject HTML; React escapes script text content.

- [ ] **Step 5: Set the domain env**

Add `VITE_ANYWEAR_DOMAIN=mavraudercollections.netlify.app` to `frontend/.env` (keep existing lines unchanged). This is the storefront origin (Netlify), not the backend API host on Render - the live bundle at `mavraudercollections.netlify.app` hardcodes `https://fashion-e-commerce-aqgt.onrender.com/api` as its API base, and Render's root returns 404.

- [ ] **Step 6: Run the smoke script to verify it passes**

Run: `NORTH_CDP_ORIGIN=http://127.0.0.1:9222 node scripts/check-north-phase4.mjs`
Expected: all prior checks still PASS plus the 4 new assertions.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/TryOnButton.jsx frontend/src/pages/Catalogue.jsx frontend/.env frontend/scripts/check-north-phase4.mjs
git commit -m "feat: open Anywear live try-on from product page"
```

---

### Task 3: Remove the legacy per-customer try-on stack

**Files:**
- Delete: `backend/routes/tryonRoutes.js`, `backend/controllers/tryonController.js`, `backend/middleware/tryonRateLimit.js`, `backend/_tryon_smoke.mjs`, `frontend/src/redux/slices/api/tryonApiSlice.js`, `frontend/src/redux/slices/tryonSlice.js`
- Modify: `backend/routes/index.js:7,16`, `frontend/src/redux/store.js:7,17`, `backend/.env` (remove `HF_KOLORS_SPACE_ID` if present)
- Create: `backend/tests/no-legacy-tryon.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces: no `/api/tryon` route, no `tryon` Redux key, no `tryonApiSlice` module; `hfTryon.js` still exports `runTryOn` for previews.

- [ ] **Step 1: Write the failing cleanup test** in `backend/tests/no-legacy-tryon.test.mjs` using `node:test`, `node:assert/strict`, and `node:fs`:
  - Each deleted path listed above does not exist (resolve relative to the test file: `../routes/tryonRoutes.js`, `../controllers/tryonController.js`, `../middleware/tryonRateLimit.js`, `../_tryon_smoke.mjs`, and `../../frontend/src/redux/slices/api/tryonApiSlice.js`, `../../frontend/src/redux/slices/tryonSlice.js`).
  - `backend/routes/index.js` text contains neither `tryonRoutes` nor `'/tryon'`.
  - `frontend/src/redux/store.js` text contains neither `tryonReducer` nor `tryon:`.

- [ ] **Step 2: Run the test to verify it fails**

Run from `backend/`: `node --test tests/no-legacy-tryon.test.mjs`
Expected: FAIL on the first existing-file assertion.

- [ ] **Step 3: Remove the legacy stack**

Delete the six files; remove the import and both `router.use('/tryon', ...)`-related lines from `backend/routes/index.js`; remove the `tryonReducer` import and `tryon:` entry from `frontend/src/redux/store.js`; remove `HF_KOLORS_SPACE_ID` from `backend/.env` only. Leave `hfTryon.js`, `rehost.js`, `modelPreview.js`, and commented legacy snippets in `backend/index.js` untouched.

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/no-legacy-tryon.test.mjs` — Expected: all PASS.
Also run from repo root: `grep -R "tryonApiSlice\|useTryOnMutation\|/api/tryon" frontend/src backend --include='*.js' --include='*.jsx' --include='*.mjs'` — Expected: no matches.

- [ ] **Step 5: Commit**

```bash
git add -A backend/routes/index.js backend/.env backend/tests/no-legacy-tryon.test.mjs frontend/src/redux/store.js frontend/src/redux/slices/api/tryonApiSlice.js frontend/src/redux/slices/tryonSlice.js backend/routes/tryonRoutes.js backend/controllers/tryonController.js backend/middleware/tryonRateLimit.js backend/_tryon_smoke.mjs
git commit -m "chore: remove legacy photo try-on backend and redux state"
```
`git add -A` with explicit pathspecs records the deletions in the same commit.

---

### Task 4: Full verification

**Files:** none (verification only)

**Interfaces:**
- Consumes: Tasks 1–3 outputs.

- [ ] **Step 1: Unit tests**

Run from `frontend/`: `node --test src/utils/anywear.test.mjs`
Run from `backend/`: `node --test tests/no-legacy-tryon.test.mjs`
Expected: all PASS.

- [ ] **Step 2: Builds**

Run from `frontend/`: `npm run build`. Expected: success, no unresolved imports of deleted slices.
Run from `backend/`: `node --check index.js && node --check routes/index.js`. Expected: no syntax errors.

- [ ] **Step 3: Browser smoke (CDP script)**

Run: `NORTH_CDP_ORIGIN=http://127.0.0.1:9222 node scripts/check-north-phase4.mjs` from `frontend/`. Expected: PASS, including no runtime exceptions and no `/api/tryon` request.

- [ ] **Step 4: Manual live check**

With dev server running, open a product page, click "Try it on", grant camera permission, confirm the Anywear panel opens with the correct garment, close/reopen it, and observe the console has no errors. Confirm the floating Anywear pill is **not** shown before clicking. If the widget does not load on localhost, record the exact symptom and stop for a decision (domain registration) rather than adding a proxy.

- [ ] **Step 5: Commit any follow-up fixes** with a descriptive conventional message, then report the final diff and verification output.
