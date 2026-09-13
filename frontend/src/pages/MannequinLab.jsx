import { useState } from "react";
import MannequinViewer from "../components/MannequinViewer";
import blueHoodie from "../assets/images/blue_hoodie.png";

/**
 * First garment fitted as static geometry (2D image on a plane).
 * These transform numbers are a STARTING GUESS over the torso — tune them
 * against what you see. `aspect` = source image width/height (768/1023) so the
 * garment isn't stretched. scale multiplies the 1-unit-tall plane.
 */
const DEMO_GARMENT = {
  src: blueHoodie,
  position: [0, 1.35, 0.18], // x (left/right), y (up), z (forward, toward camera)
  rotation: [0, 0, 0],
  scale: 0.9,
  aspect: 0.751,
};

/**
 * MannequinLab
 * -------------
 * Standalone test page for the 3D mannequin, mounted OUTSIDE the auth Layout
 * (see App.jsx route "/mannequin-lab") so it can be opened without logging in
 * during development.
 *
 * This is a dev/test surface only — not linked from the main nav. Garment
 * selection UI will grow here later; for now it's the rotatable body plus a
 * first garment fitted as static geometry (toggle to compare with/without).
 */
export default function MannequinLab() {
  const [showGarment, setShowGarment] = useState(true);

  return (
    <div className="w-full min-h-screen bg-neutral-100 flex flex-col">
      <header className="px-6 py-4 border-b border-neutral-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-neutral-800">
            Mannequin Lab
          </h1>
          <p className="text-sm text-neutral-500">
            Drag to rotate · scroll to zoom · garment fitted as static geometry
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700 select-none">
          <input
            type="checkbox"
            checked={showGarment}
            onChange={(e) => setShowGarment(e.target.checked)}
          />
          Show garment
        </label>
      </header>

      <main className="flex-1 p-4">
        {/* Fixed-height stage so the Canvas has real dimensions to fill. */}
        <div className="w-full h-[75vh] rounded-xl overflow-hidden border border-neutral-200 bg-white shadow-sm">
          <MannequinViewer activeGarment={showGarment ? DEMO_GARMENT : null} />
        </div>
      </main>
    </div>
  );
}
