// [NORTH] Motion manages route presence only; GSAP owns every visual transition.
import { AnimatePresence, motion as Motion } from "motion/react";
import BlockTransition from "../BlockTransition";
import usePageTransition from "../../hooks/usePageTransition";

export default function PageTransition({ children }) {
  const { displayedLocation, overlayRef, mountRoute, routeKey } = usePageTransition();
  return (
    <>
      <AnimatePresence initial={false} mode="wait">
        <Motion.div key={routeKey} initial={false}>
          <div ref={mountRoute} className="north-route-content" data-north-route={displayedLocation.pathname}>
            {children(displayedLocation)}
          </div>
        </Motion.div>
      </AnimatePresence>
      <BlockTransition ref={overlayRef} />
    </>
  );
}
