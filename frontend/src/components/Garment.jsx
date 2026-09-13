import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

/**
 * Garment (v1 — 2D image on a plane)
 * -----------------------------------
 * The first garment representation for the 3D try-on: a product image mapped
 * onto a flat, transparent plane placed in front of the mannequin's torso.
 * This is intentionally the simplest thing that proves the fitting architecture:
 *   - it mounts as a CHILD of the mannequin group (see MannequinViewer), so it
 *     inherits the body's position/scale/rotation;
 *   - its own placement on the body is controlled by fixed transform props
 *     (position / scale / rotation) that you tune by editing values.
 *
 * MIGRATION PATH (when you move to true 3D garments):
 *   Replace the <planeGeometry> + texture below with a useGLTF load of a garment
 *   mesh. The component's PROP CONTRACT stays identical (garment, position,
 *   scale, rotation), so MannequinViewer and the product mapping won't change.
 *   That's the whole point of isolating this here.
 *
 * NOTE: this is a flat billboard, not real cloth. It won't wrap around the body
 * or respond to pose. It's a visual placeholder to validate placement + the
 * activeGarment data flow, per the current step's scope.
 *
 * @param {object} props
 * @param {string} props.garment            Image URL/texture path for the garment.
 * @param {[number,number,number]} [props.position]  Local offset from the mannequin origin.
 * @param {[number,number,number]} [props.rotation]  Euler rotation (radians).
 * @param {number} [props.scale]            Uniform scale multiplier for the plane.
 * @param {number} [props.aspect]           width/height of the source image, to avoid stretching.
 */
export default function Garment({
  garment,
  position = [0, 1.35, 0.18],
  rotation = [0, 0, 0],
  scale = 1,
  aspect = 1,
}) {
  const texture = useTexture(garment);

  // Improve texture appearance and correct color space.
  useMemo(() => {
    if (!texture) return;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);

  // Base plane is 1 unit tall; width follows the image aspect so it isn't stretched.
  const planeW = aspect;
  const planeH = 1;

  return (
    <group name="garment-root" position={position} rotation={rotation} scale={scale}>
      <mesh>
        <planeGeometry args={[planeW, planeH]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.5} // hides fully-transparent PNG background pixels cleanly
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
