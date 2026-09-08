# Virtual Try-On (VTON) — Implementation Plan & Handoff

> Living doc. Purpose: let anyone (or a future session) continue this feature without re-discovering the codebase.
> Created for the free-tier MVP approach: upload a customer photo on a product page → composite it with the
> product's garment image via a **free Hugging Face Space** → show the result. No paid API, no local model.

---

## 0. Status checklist (update as you go)

- [x] Backend deps installed (`@gradio/client` 2.5.1, `express-rate-limit` 8.7.0)
- [x] `garmentImage` field added to Product model + accepted in add/update controllers
- [x] `backend/utils/hfTryon.js` — Kolors Space caller (timeout, cancel, error classes, migration flags)
- [x] `backend/controllers/tryonController.js` — validation, garment lookup, no persistence
- [x] `backend/middleware/tryonRateLimit.js` — per-user/IP limiter
- [x] `backend/routes/tryonRoutes.js` — rewritten (protect + limit + upload + controller)
- [x] `frontend/src/redux/slices/api/tryonApiSlice.js` — RTK Query mutation (FormData)
- [x] `frontend/src/components/TryOnButton.jsx` — the UI component
- [x] `frontend/src/pages/Catalogue.jsx` — `<TryOnButton />` mounted
- [x] `frontend/src/components/AddProductForm.jsx` — optional garment image uploader
- [x] `HF_TOKEN` env var documented in §3 + empty placeholder added to `backend/.env` (fill in your token value to improve queue priority)
- [x] Smoke-tested against the live Kolors Space — **SUCCESS 35.7s** (2026-09-08), real composite URL returned
- [ ] Tested on Render (cold start + timeout behaviour) — needs a deploy + logged-in user test; see §10

---

## 1. Decisions locked (2026-09-08)

| Decision | Choice | Notes |
|---|---|---|
| Provider (MVP) | **Free HF Space** | Kwai-Kolors/Kolors-Virtual-Try-On |
| Client library | **`@gradio/client`** (JS) | Python `gradio_client` equivalent; works in ESM Node |
| Garment source | **`product.garmentImage` → fallback `product.images[0]`** | New optional schema field |
| Auth | **Route is protected** (`protectRoute`) | Whole site is already behind login; lets us rate-limit per user |
| Customer photo storage | **None** (memory only, `req.file.buffer`) | Never written to disk or Cloudinary. See §7 |
| Rate limit | **5 / 10 min per user** (tunable) | Shared free resource; conservative default |
| Result image | Return **HF Space URL** directly | Ephemeral; optional Cloudinary persistence flagged for later |

---

## 2. The Kolors Space API (verified live 2026-09-08)

Space: `Kwai-Kolors/Kolors-Virtual-Try-On`
Base URL: `https://kwai-kolors-kolors-virtual-try-on.hf.space`

The try-on function is **fn_index `2`** (the "Run" button click):

- **Inputs (in order):**
  1. `person_img` — image (the customer photo)
  2. `garment_img` — image (the product garment)
  3. `seed` — number (slider)
  4. `randomize_seed` — boolean (checkbox)
- **Outputs (in order):**
  1. `result` — image ← this is what we return
  2. `seed_used` — number
  3. `response` — text (status/tips)

⚠️ **Fragility (important):** this Space has `api_name: false` and `show_api: false`, so the endpoint is **not
officially published**. We call it **by function index (`2`)**. Free Spaces can change fn order, sleep, close the
API (`api_open=false`), or disappear with zero notice. Design assumes this WILL happen and fails gracefully. If the
index call ever stops working:
  1. Re-check the live config: `GET https://kwai-kolors-kolors-virtual-try-on.hf.space/config` → find the
     `dependencies` entry whose inputs are [image, image, slider, checkbox]; its array position is the fn_index.
  2. Or **duplicate the Space** to your own HF account (duplicating re-opens the API on your copy) and point
     `HF_SPACE_ID` at it.
  3. Or migrate to a paid provider (see §8).

---

## 3. Environment variables

**Backend `.env`** (add):
```
# Optional but recommended: a free HF account token improves queue priority on shared Spaces.
# Create at https://huggingface.co/settings/tokens (read scope is enough). Format: hf_xxx
HF_TOKEN=
# Which Space to call. Override to point at your own duplicated Space if the public one closes its API.
HF_SPACE_ID=Kwai-Kolors/Kolors-Virtual-Try-On
```

**Frontend** already exposes the API base via `VITE_APP_BASE_URL` (RTK Query uses `VITE_APP_BASE_URL + "/api"`).
No new frontend env var required. Try-on calls go to `${VITE_APP_BASE_URL}/api/tryon`.

---

## 4. Dependencies

```bash
# backend/
npm install @gradio/client express-rate-limit
```
- `@gradio/client` — call the Space (upload blobs, join queue, stream events).
- `express-rate-limit` — per-user/IP throttling.

No new frontend deps (uses existing RTK Query + sonner).

---

## 5. Backend implementation

### 5.1 `models/product.js` — add garment field
Add inside the schema (near `images`):
```js
garmentImage: { type: String, default: "" }, // [VTON] flat/on-model garment shot; falls back to images[0]
```

### 5.2 `controllers/productController.js`
- In `addProduct`: destructure `garmentImage` from `req.body` and include it in `new Product({...})`.
- `updateProduct` already spreads `req.body`, so it passes through automatically.

### 5.3 `utils/hfTryon.js` (NEW) — the Space caller
Responsibilities:
- `Client.connect(HF_SPACE_ID, { hf_token })`.
- Convert person `Buffer` → `Blob`; fetch garment URL → `Blob`.
- `client.submit(2, [personBlob, garmentBlob, seed, randomize])`, iterate events.
- Enforce a **timeout** (`TRYON_TIMEOUT_MS`, default 90_000 — must be < platform request timeout, see §9);
  call `.cancel()` on timeout to free the queue slot.
- Classify failures into typed errors: `TryOnBusyError`, `TryOnTimeoutError`, `TryOnUnavailableError`.
- Return `{ imageUrl, seed }` where `imageUrl` is `result.data[0].url`.
- Everything provider-specific is marked `// [MIGRATION]` so a swap to Replicate/fal.ai is a single-file change.

### 5.4 `middleware/tryonRateLimit.js` (NEW)
`express-rate-limit`, `windowMs = 10*60*1000`, `max = 5`, `keyGenerator = req.user?._id || req.ip`,
friendly JSON message, `standardHeaders: true`.

### 5.5 `routes/tryonRoutes.js` (REWRITE — currently uses paid Replicate)
```
POST /api/tryon
  protectRoute
  tryonRateLimit
  multer(memory, limits.fileSize=8MB, fileFilter=jpeg/png/webp).single("photo")
  → multer error catcher (friendly 400 for too-large / wrong-type)
  → tryonController
```
Body: `photo` (file) + `productId` (text). Look up product → resolve garment
(`product.garmentImage || product.images[0]`) → call `hfTryon` → `res.json({ imageUrl })`.

Mounting is already done: `routes/index.js` has `router.use('/tryon', tryonRoutes)` → `/api/tryon`.

### 5.6 Error → HTTP mapping (controller)
| Situation | Status | User message |
|---|---|---|
| No file / wrong type / too large | 400 | "Please upload a JPG, PNG or WebP under 8MB." |
| Product/garment missing | 404 | "This product can't be tried on yet." |
| Space sleeping / connect fail | 503 | "Try-on is starting up (free service). Try again in a minute." |
| Queue full / timeout | 503 | "Try-on is busy right now — please try again shortly." |
| Rate limited | 429 | "You've hit the try-on limit. Please wait a few minutes." |
| Anything else | 500 | "Try-on failed. Please try again." |

---

## 6. Frontend implementation

### 6.1 `redux/slices/api/tryonApiSlice.js` (NEW)
RTK Query mutation; `fetchBaseQuery` sends `FormData` correctly and already has `credentials:'include'`.
```js
tryOn: builder.mutation({ query: (formData) => ({ url: "/tryon", method: "POST", body: formData }) })
// export useTryOnMutation
```

### 6.2 `components/TryOnButton.jsx` (NEW)
Props: `productId`, `productName`, `canTryOn` (bool — whether a garment image exists).
- Hidden `<input type="file" accept="image/*">` + "Try it on" button.
- Client-side validation (type in jpeg/png/webp, size ≤ 8MB) before upload.
- Builds `FormData` (`photo`, `productId`), calls `useTryOnMutation`.
- **Loading UX**: modal/inline with a spinner (reuse the app's `animate-spin` pattern) + copy:
  "Creating your try-on… this can take 30s–2min on our free service." Optionally an elapsed-seconds counter.
- **Result**: show returned image + "Try again" (reset) + "Use a different photo".
- **Errors**: `toast.error(err?.data?.message || "Try-on is busy, please try again shortly.")`.
- Never stores the photo; only keeps an in-memory object URL for the local preview.

### 6.3 `pages/Catalogue.jsx` — mount it
Under the Add-to-Cart block:
```jsx
<TryOnButton
  productId={product._id}
  productName={product.name}
  canTryOn={Boolean(product.garmentImage || product.images?.[0])}
/>
```

### 6.4 `components/AddProductForm.jsx` — optional garment uploader
Add a single-image uploader (reuse `handleUploadImage`) storing one URL in `garmentImage` state; include it in
`productData` in `submitHandler`. Hydrate it in the edit `useEffect`. Label: "Garment image for Try-On (optional —
a clean, front-facing shot works best; defaults to the first product image)."

---

## 7. Safeguards (maps to the original request)

- **No photo persistence:** multer `memoryStorage()` → `req.file.buffer`, used for the request only, never
  written to disk/Cloudinary. The only third party that receives it is the HF Space itself (inherent to the
  feature — noted in code + can be surfaced in UI copy). To OPT INTO storage later, upload `req.file.buffer` to
  Cloudinary in the controller — search `// [OPT-IN STORAGE]`.
- **Rate limiting:** per-user (falls back to IP) — protects the *shared* free Space quota, not just ours.
- **Validation:** type (jpeg/png/webp) + size (8MB) on BOTH client and server; server is the source of truth.

---

## 8. Migration to a paid provider (production reliability)

Every free-tier-specific spot is tagged `// [MIGRATION]` (and storage opt-ins `// [OPT-IN STORAGE]`).
Grep for them: `grep -rn "\[MIGRATION\]" backend/`.

To move to **Replicate** (already a dependency!) or **fal.ai**:
1. Replace the body of `utils/hfTryon.js` with a Replicate/fal call (keep the same
   `runTryOn({ personBuffer, garmentUrl }) → { imageUrl }` signature, so nothing else changes).
2. Prefer their **async webhook/polling** flow over a long synchronous request (fixes the §9 timeout risk).
3. Drop or relax the rate limit (you're paying for quota, not sharing).
4. Add `REPLICATE_API_TOKEN` / `FAL_KEY` to `.env`.
The route, controller, middleware, and entire frontend stay untouched.

---

## 9. Known risks / gotchas

- **Render free tier spins down** → first request after idle pays a cold start on TOP of the HF queue. The
  30s–2min UX copy accounts for this. Keep-alive ping is an option.
- **Platform request timeout:** long synchronous requests can be cut by the host proxy. Keep
  `TRYON_TIMEOUT_MS` (default 90s) **below** the platform limit so we return a friendly message first. The real
  fix is the async pattern in §8 step 2.
- **HF result URL is ephemeral** — fine for immediate display; persist to Cloudinary (`// [OPT-IN STORAGE]`) if
  you need it to survive.
- **Space API can close/change** — see §2 fallbacks.
- **VTON quality** depends on inputs: a clean, front-facing garment image + a clear, single-person photo. This is
  why the `garmentImage` field exists (so primary lifestyle shots don't degrade results).

---

## 10. Testing

**Local**
```bash
# backend
npm start   # http://localhost:5000
# frontend
npm run dev
```
1. Log in (site is gated). Open a product: `/product/:id`.
2. Click "Try it on", pick a clear full/upper-body photo. Expect spinner → result in ~30s–2min.
3. Force errors: upload a .txt (→ 400), a >8MB image (→ 400), spam >5 times/10min (→ 429).

**cURL** (needs auth cookie `token`):
```bash
curl -X POST http://localhost:5000/api/tryon \
  -H "Cookie: token=<JWT>" \
  -F "productId=<PRODUCT_ID>" \
  -F "photo=@/path/to/person.jpg"
```

**Space reachability**
```bash
curl -s https://kwai-kolors-kolors-virtual-try-on.hf.space/config | grep -o '"api_open":[a-z]*'
```
