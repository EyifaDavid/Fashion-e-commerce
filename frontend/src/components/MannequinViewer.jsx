import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, useGLTF, Html } from "@react-three/drei";
import Garment from "./Garment";

/**
 * MannequinViewer
 * ----------------
 * Step 1 of the 3D try-on feature: render a rotatable/zoomable body mannequin.
 *
 * ARCHITECTURE NOTE (garment-fitting comes later):
 *   The <Mannequin /> below renders the body mesh AND leaves a clear slot for a
 *   future <Garment /> child. When you build garment-fitting, you will:
 *     1. Create a <Garment /> component (loads a garment .glb the same way).
 *     2. Render it *inside* <Mannequin />'s <group> so it inherits the
 *        mannequin's position/scale/rotation and can be offset relative to it.
 *     3. Drive it with the `activeGarment` prop already threaded through here.
 *   No clothing logic exists yet on purpose — the seams are just left open.
 *
 * MIGRATION / PERF NOTE:
 *   mannequin.glb is currently ~4.8 MB (uncompressed). Fine for this isolated
 *   test page, but TOO HEAVY for a product page. Before production:
 *     - Compress with Draco or meshopt (e.g. `npx gltf-transform optimize
 *       public/models/mannequin.glb public/models/mannequin.glb --compress draco`),
 *       expect ~0.5-1.5 MB.
 *     - If you switch to Draco, add drei's <useGLTF> Draco decoder path (see
 *       the commented line in <Mannequin />).
 */

// Path is relative to the web root; Vite serves /public at "/".
//
// NOTE: using the *sanitized static* mesh. The original character.glb (also in
// public/models/) was exported by THREE.GLTFExporter r185 with a BROKEN skin —
// its 52 skin joints all had null node indices, which crashes GLTFLoader with
// "Cannot set properties of undefined (setting 'isBone')". Since step 1 only
// needs display + rotate (no posing), we strip the skin and load it static.
// To make the body posable later (for garment-fitting), replace this with a
// validly-rigged .glb — see MANNEQUIN_3D_PLAN.md §"Rig".
const MANNEQUIN_URL = "/models/mannequin_static.glb";

function Mannequin({ activeGarment = null }) {
  // If you later ship a Draco-compressed .glb, use:
  //   const { scene } = useGLTF(MANNEQUIN_URL, "/draco/");
  // and drop the decoder files into public/draco/ (from three/examples/jsm/libs/draco).
  const { scene } = useGLTF(MANNEQUIN_URL);

  return (
    <group name="mannequin-root">
      {/* The body mesh */}
      <primitive object={scene} />

      {/*
        GARMENT SLOT — the garment renders as a child of this group, so it
        inherits the mannequin's transform. v1 is a 2D product image on a plane
        (see Garment.jsx); the prop contract (garment/position/scale/rotation)
        is stable, so swapping in a true 3D garment mesh later won't touch this.

        `activeGarment` shape: { src, position?, rotation?, scale?, aspect? } | null
      */}
      {activeGarment && (
        <Garment
          garment={activeGarment.src}
          position={activeGarment.position}
          rotation={activeGarment.rotation}
          scale={activeGarment.scale}
          aspect={activeGarment.aspect}
        />
      )}
    </group>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div
        style={{
          color: "#374151",
          fontSize: 14,
          fontFamily: "system-ui, sans-serif",
          background: "rgba(255,255,255,0.85)",
          padding: "8px 14px",
          borderRadius: 8,
          whiteSpace: "nowrap",
        }}
      >
        Loading mannequin…
      </div>
    </Html>
  );
}

/**
 * @param {object}  props
 * @param {object|null} [props.activeGarment]  Garment to fit on the mannequin, or null for none.
 *        Shape: { src: string, position?: [x,y,z], rotation?: [x,y,z], scale?: number, aspect?: number }
 * @param {string}  [props.className]      Wrapper classes (sizing controlled by parent).
 */
export default function MannequinViewer({ activeGarment = null, className = "" }) {
  return (
    <div className={className || "w-full h-full"}>
      <Canvas
        // dpr caps pixel ratio so high-DPI screens don't tank performance.
        dpr={[1, 2]}
        camera={{ position: [0, 1, 4], fov: 45 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Stage gives clean, centered, auto-framed lighting out of the box. */}
          <Stage environment="city" intensity={0.5} adjustCamera={1.2}>
            <Mannequin activeGarment={activeGarment} />
          </Stage>
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={1.5}
          maxDistance={8}
          // Keep the camera from going under the floor.
          maxPolarAngle={Math.PI / 1.9}
        />
      </Canvas>
    </div>
  );
}

// Preload so the model starts fetching as soon as this module is imported.
useGLTF.preload(MANNEQUIN_URL);
