# 3D Mannequin / Try-On — Implementation Plan & Handoff

> Living doc for the **3D** try-on track (separate from the 2D `VTON_TRYON_PLAN.md`, which uses
> Hugging Face image compositing). This track renders a real 3D body mesh in the browser with
> react-three-fiber, so garments can later be fitted as 3D objects on the mannequin.
>
> **Step 1 (this doc's current scope): get a free 3D mannequin rendering + rotatable. No clothing logic yet.**

---

## 0. Status checklist

- [x] Deps installed: `@react-three/fiber@9.7.0`, `@react-three/drei@10.7.8`, `three@0.186.0`
- [x] Mannequin mesh provided by user (`~/Downloads/character.glb`) → copied to `frontend/public/models/mannequin.glb`
- [x] `frontend/src/components/MannequinViewer.jsx` — Canvas + Stage lighting + OrbitControls + Suspense, with garment slot left open
- [x] `frontend/src/pages/MannequinLab.jsx` — standalone test page
- [x] Route `/mannequin-lab` added in `App.jsx` **outside** the auth Layout (no login needed)
- [x] `npm run build` passes
- [ ] Visually confirmed in browser (dev server) ← **verify next**
- [ ] Draco/meshopt compression of the .glb (production perf)
- [ ] Garment-fitting (future step — architecture is ready)

---

## 1. Stack (verified, not assumed)

- **Frontend:** React **19.1.0** + **JSX (not TypeScript)**, Vite 6, Tailwind 4, react-router-dom v7.
- Dev server runs on **port 4000** (see `vite.config.js`), proxies `/api` → `localhost:5000`.

### ⚠️ Critical dependency gotcha (already solved — don't undo it)
`@react-three/fiber@9` lists Expo/React-Native packages (`expo`, `expo-gl`, `expo-asset`,
`expo-file-system`) as **optional peer deps** (for running r3f on React Native). On a plain Vite
web app, npm still tries to resolve them, pulls in `expo@57` → which demands `react@19.3.0` →
which then violates fiber's own `react <19.3` peer. Circular conflict.

**Fix used:** installed with `--legacy-peer-deps`. If you ever re-install or add r3f packages,
use the same flag:
```
npm install <pkg> --legacy-peer-deps
```
The Expo packages are irrelevant to the browser build; skipping their peer resolution is safe.

### React 19 compatibility
Must use **fiber v9+ and drei v10+**. The older v8 / v9.0-era lines target React 18 and throw
reconciler errors on React 19. Current resolved versions (fiber 9.7.0, drei 10.7.8) are correct.

---

## 2. Files in this feature

| File | Role |
|------|------|
| `frontend/public/models/mannequin.glb` | The body mesh (4.8 MB, uncompressed). Served at `/models/mannequin.glb`. |
| `frontend/src/components/MannequinViewer.jsx` | Reusable 3D viewer. Canvas + Stage + OrbitControls + Suspense. **Garment slot left open inside `<Mannequin>`'s group.** |
| `frontend/src/pages/MannequinLab.jsx` | Standalone dev/test page. |
| `frontend/src/App.jsx` | Route `/mannequin-lab` (outside auth Layout). |

---

## 3. How to test (do this next)

```
cd frontend
npm run dev
```
Open **http://localhost:4000/mannequin-lab** (no login required).

Expect: the mannequin auto-framed and lit, "Loading mannequin…" flashing briefly first.
Drag to rotate, scroll to zoom. If you see a blank canvas:
- Check the browser console for a 404 on `/models/mannequin.glb` (file path).
- Check for a WebGL context error (GPU/driver).

---

## 4. Garment-fitting readiness (future step — nothing to build yet)

The seams are deliberately left open so garments drop in without rearchitecting:

1. `MannequinViewer` already threads an **`activeGarment` prop** down to `<Mannequin>` (currently unused).
2. Inside `<Mannequin>`'s `<group name="mannequin-root">` there's a commented **GARMENT SLOT**.
   A future `<Garment garment={activeGarment} />` rendered there inherits the body's transform,
   so it can be offset/positioned relative to the mannequin.
3. Build `<Garment />` to load a garment `.glb` the same way (`useGLTF`), then map product →
   garment mesh (this is where the `garmentImage`/a new `garmentModel` field on the Product
   schema would come in — see `VTON_TRYON_PLAN.md` for the schema work already started).

---

## 5. Production TODOs (flagged, not yet done)

- **Compress the mesh.** 4.8 MB is too heavy for a product page. Use:
  ```
  npx gltf-transform optimize public/models/mannequin.glb public/models/mannequin_opt.glb --compress draco
  ```
  Expect ~0.5–1.5 MB. If you switch to Draco, update `useGLTF(URL, "/draco/")` in
  `MannequinViewer.jsx` and drop the Draco decoder files into `public/draco/`
  (from `three/examples/jsm/libs/draco`). There's a commented line marking exactly where.
- **Code-split three.js.** `npm run build` warns the JS bundle is ~2.1 MB (three + drei). When
  the mannequin moves onto real product pages, lazy-load the viewer with `React.lazy` /
  dynamic `import()` so three.js isn't in the main bundle.
- **License:** user chose **free / commercial-safe only (CC0/MIT)**. The current mesh was
  user-provided — confirm its license is CC0/MIT before shipping commercially. SMPL/SMPL-X
  meshes are NOT free for commercial use (Max Planck / Meshcapade license).

---

## 6. Decisions locked in

- Mannequin source: **user provides own .glb** (currently `character.glb`).
- Exposure: **standalone page, no auth** (`/mannequin-lab`).
- License tier: **free / commercial-safe only (CC0/MIT)**.
