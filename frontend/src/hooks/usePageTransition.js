// [NORTH] Delay route rendering until the tiles fully cover the old page.
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { gsap } from "../lib/northMotion";
import { BLOCK_TRANSITION as SETTINGS } from "../lib/blockTransition";
import useNorthReducedMotion from "./useNorthReducedMotion";

const pageKey = (path) => path === "/" || path.toLowerCase() === "/landing" ? "home" : path.toLowerCase();

export default function usePageTransition() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const reduce = useNorthReducedMotion();
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const previous = useRef(location);
  const displayed = useRef(location);
  const pendingCommit = useRef(null);
  const [displayedLocation, setDisplayedLocation] = useState(location);

  // [NORTH] AnimatePresence can retain the outgoing DOM for another render.
  // Resolve only when the incoming route's actual content node is attached.
  const mountRoute = useCallback((node) => {
    contentRef.current = node;
    if (!node) return;
    displayed.current = displayedLocation;
    if (pendingCommit.current?.key === displayedLocation.key) {
      pendingCommit.current.resolve(true);
      pendingCommit.current = null;
    }
  }, [displayedLocation]);

  useEffect(() => {
    const changedPage = pageKey(displayed.current.pathname) !== pageKey(location.pathname);
    const changedLocation = previous.current.key !== location.key;
    const initialRedirect = previous.current.key === "default" && navigationType === "REPLACE";
    previous.current = location;
    if (!changedLocation && displayed.current.key === location.key) return; // First load, including React Strict Mode.

    let cancelled = false;
    const context = gsap.context(() => {}, contentRef);
    let observer;
    let title;
    let revealed = false;
    const current = () => !cancelled;
    const commit = () => new Promise((resolve) => {
      pendingCommit.current?.resolve(false);
      pendingCommit.current = { key: location.key, resolve };
      setDisplayedLocation(location);
    });
    const revealTitle = () => {
      if (!title || !current()) return;
      context.add(() => {
        title.dataset.northTitleReveal = "running";
        gsap.to(title, {
          clipPath: "inset(0 0 0 0%)",
          duration: SETTINGS.titleDuration,
          ease: "power2.out",
          clearProps: "clipPath",
          onComplete: () => { title.dataset.northTitleReveal = "complete"; },
        });
      });
    };
    const prepareTitle = () => {
      if (!current() || title) return;
      title = Array.from(contentRef.current?.querySelectorAll("h1, h2") || [])
        .find((heading) => !heading.closest("footer, nav, aside"));
      if (!title) return;
      observer?.disconnect();
      context.add(() => {
        // [NORTH] Start at the right edge, revealing towards the left.
        gsap.set(title, { clipPath: "inset(0 0 0 100%)" });
      });
      if (revealed) revealTitle();
    };

    const run = async () => {
      if (!changedPage || initialRedirect || navigationType === "POP" || reduce) {
        await commit();
        if (!current()) return;
        if (changedPage && navigationType !== "POP") window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (reduce && changedPage) context.add(() => {
          gsap.fromTo(contentRef.current, { opacity: 0 }, { opacity: 1, duration: SETTINGS.fadeDuration, ease: "none", clearProps: "opacity" });
        });
        return;
      }

      const covered = await overlayRef.current.cover();
      if (!current()) return;
      await commit();
      if (!current()) return;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (!covered) return; // A slow/interrupted frame falls back to an instant switch.

      prepareTitle();
      if (!title && contentRef.current) {
        // [NORTH] Product data may arrive after the route mounts.
        observer = new MutationObserver(prepareTitle);
        observer.observe(contentRef.current, { childList: true, subtree: true });
      }
      await overlayRef.current.reveal();
      if (!current()) return;
      revealed = true;
      // [NORTH] The watchdog may release the tiles before a slow render finishes.
      // Keep the title reveal independent, including headings arriving with data.
      revealTitle();
    };

    run().catch(() => {
      if (!current()) return;
      overlayRef.current?.cancel();
      observer?.disconnect();
      context.revert();
      setDisplayedLocation(location);
    });
    const overlay = overlayRef.current;
    return () => {
      cancelled = true;
      overlay?.cancel();
      observer?.disconnect();
      pendingCommit.current?.resolve(false);
      pendingCommit.current = null;
      context.revert();
    };
  }, [location, navigationType, reduce]);

  return { displayedLocation, overlayRef, mountRoute, routeKey: pageKey(displayedLocation.pathname) };
}
