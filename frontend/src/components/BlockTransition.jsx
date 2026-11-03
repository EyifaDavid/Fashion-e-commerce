// [NORTH] GSAP-only tile overlay. The router calls cover(), then reveal().
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "../lib/northMotion";
import { BLOCK_TRANSITION as SETTINGS } from "../lib/blockTransition";

const gridForViewport = () => window.innerWidth < SETTINGS.mobileBreakpoint ? SETTINGS.mobile : SETTINGS.desktop;

const BlockTransition = forwardRef(function BlockTransition({ colour = SETTINGS.colour }, ref) {
  const root = useRef(null);
  const context = useRef(null);
  const tween = useRef(null);
  const resolveAnimation = useRef(null);
  const generation = useRef(0);
  const deadline = useRef(null);
  const active = useRef(false);
  const activeGrid = useRef(null);
  const [grid, setGrid] = useState(gridForViewport);

  const cancel = () => {
    generation.current++;
    tween.current?.kill();
    tween.current = null;
    resolveAnimation.current?.(false);
    resolveAnimation.current = null;
    clearTimeout(deadline.current);
    active.current = false;
    if (root.current) {
      root.current.dataset.active = "false";
      root.current.dataset.phase = "idle";
      root.current.style.pointerEvents = "none";
      gsap.set(root.current.children, { opacity: 0 });
    }
  };

  useLayoutEffect(() => {
    context.current = gsap.context(() => {}, root);
    return () => {
      cancel();
      context.current?.revert();
    };
  }, []);

  useEffect(() => {
    const resized = () => { if (!active.current) setGrid(gridForViewport()); };
    window.addEventListener("resize", resized);
    return () => window.removeEventListener("resize", resized);
  }, []);

  const animateTiles = (opacity, currentGrid) => new Promise((resolve) => {
    if (!root.current || !context.current) { resolve(false); return; }
    resolveAnimation.current = resolve;
    context.current.add(() => {
      tween.current = gsap.to(root.current.children, {
        opacity,
        duration: 0, // Snap each block rather than fading it.
        ease: "none",
        stagger: { each: SETTINGS.stagger, from: "random", grid: [currentGrid.rows, currentGrid.columns] },
        onComplete: () => {
          resolveAnimation.current = null;
          if (root.current) root.current.dataset.phase = opacity ? "covered" : "idle";
          resolve(true);
        },
      });
      // [NORTH] 96 x 12ms exceeds the requested budget: preserve the stagger
      // definition but scale the complete random sequence to 350ms.
      const duration = tween.current.duration();
      if (duration > 0) tween.current.timeScale(duration / SETTINGS.phaseDuration);
    });
  });

  useImperativeHandle(ref, () => ({
    async cover() {
      cancel();
      const token = generation.current;
      const nextGrid = gridForViewport();
      activeGrid.current = nextGrid;
      setGrid(nextGrid);
      active.current = true;
      root.current.dataset.active = "true";
      root.current.dataset.phase = "cover";
      root.current.style.pointerEvents = "auto";
      // [NORTH] Never leave a click-blocking overlay behind, even after interruption.
      deadline.current = setTimeout(cancel, SETTINGS.maxBlockingMs);
      await new Promise(requestAnimationFrame);
      if (generation.current !== token) return false;
      return animateTiles(1, nextGrid);
    },
    async reveal() {
      if (!active.current) return false;
      const token = generation.current;
      root.current.dataset.phase = "reveal";
      const revealed = await animateTiles(0, activeGrid.current);
      // [NORTH] An old reveal must never cancel a newer navigation.
      if (generation.current !== token) return false;
      cancel();
      context.current?.revert();
      setGrid(gridForViewport());
      return revealed;
    },
    cancel,
  }));

  return (
    <div ref={root} aria-hidden="true" data-active="false" data-phase="idle"
      className="north-block-overlay fixed inset-0 z-50 pointer-events-none"
      style={{ "--block-columns": grid.columns, "--block-rows": grid.rows, "--block-colour": colour }}>
      {Array.from({ length: grid.columns * grid.rows }, (_, index) => (
        <div key={index} className="north-block-tile" />
      ))}
    </div>
  );
});

export default BlockTransition;
