// [NORTH] GSAP owns scroll reveals; CSS hover effects target separate children.
import { useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "../lib/northMotion";

export default function useScrollReveal(root, contentKey = 0) {
  useLayoutEffect(() => {
    if (!root.current) return;
    const element = root.current;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", (context) => {
      const targets = Array.from(element.querySelectorAll("[data-north-scroll]"))
        .filter((node) => node.closest("[data-north-scroll-scope]") === element && node.dataset.northScrollRevealed !== "true");
      if (!targets.length) return;
      gsap.set(targets, { opacity: 0, transform: "translateY(24px)" });
      context.add("reveal", (batch, immediate = false) => {
        batch.forEach((node) => { node.dataset.northScrollRevealed = "true"; });
        gsap.to(batch, { opacity: 1, transform: "translateY(0px)", duration: immediate ? 0 : 0.5,
          stagger: immediate ? 0 : 0.06, ease: "power2.out", overwrite: true, clearProps: "opacity,transform" });
      });
      ScrollTrigger.batch(targets, { start: "top 88%", once: true, onEnter: (batch) => context.reveal(batch) });
      // Keyboard navigation never lands inside a visually hidden card.
      const onFocus = (event) => {
        const target = event.target.closest("[data-north-scroll]");
        if (targets.includes(target)) context.reveal([target], true);
      };
      element.addEventListener("focusin", onFocus);
      ScrollTrigger.refresh();
      return () => element.removeEventListener("focusin", onFocus);
    }, element);
    return () => media.revert();
  }, [root, contentKey]);
}
