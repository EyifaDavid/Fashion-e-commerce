// [NORTH] One intro per session; only the text wrapper moves with scroll.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { NORTH_HERO_VIDEO } from "../../config";
import { gsap } from "../../lib/northMotion";
import useNorthReducedMotion from "../../hooks/useNorthReducedMotion";
import hero from "../../assets/images/hero.jpg";
import ShopActions from "../ShopActions";

const introKey = "north:intro:seen";
export default function NorthHero() {
  const root = useRef(null);
  const videoRef = useRef(null);
  const reduce = useNorthReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const introCompleted = useRef(false);
  const [showIntro] = useState(() => {
    try { return sessionStorage.getItem(introKey) !== "1"; } catch { return true; }
  });

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    media.add(
      { standard: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" },
      (context) => {
        if (showIntro && !introCompleted.current) {
          try { sessionStorage.setItem(introKey, "1"); } catch { /* Storage may be unavailable. */ }
          const intro = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: () => { introCompleted.current = true; } });
          intro.fromTo(".north-headline-line",
            { yPercent: context.conditions.reduced ? 0 : 110, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: context.conditions.reduced ? 0.15 : 0.7,
              stagger: context.conditions.reduced ? 0 : 0.18 }, 0)
            .fromTo(".north-hero-nav", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 },
              context.conditions.reduced ? 0.1 : 0.7);
        }
        if (!context.conditions.reduced) {
          gsap.to(".north-hero-copy", {
            yPercent: 8, ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
          });
        }
      },
      root
    );
    return () => media.revert();
  }, [showIntro]);

  useEffect(() => {
    if (reduce || paused) videoRef.current?.pause();
    else if (!videoFailed) videoRef.current?.play().catch(() => {});
  }, [reduce, paused, videoFailed]);

  return (
    <section className="north-hero" ref={root} aria-labelledby="north-hero-title">
      <img className="north-hero-media" src={hero} alt="" width="1920" height="1228" fetchPriority="high" />
      {!reduce && !videoFailed && (
        <video ref={videoRef} className="north-hero-media" src={NORTH_HERO_VIDEO} poster={hero}
          autoPlay={!paused} muted loop playsInline preload="metadata" aria-hidden="true"
          onCanPlay={() => setVideoReady(true)} onError={() => setVideoFailed(true)} />
      )}
      <div className="north-hero-shade" aria-hidden="true" />
      <header className="north-hero-nav">
        <Link to="/Landing" className="north-wordmark" aria-label="Ubiquitous home">UBIQUITOUS</Link>
        <nav aria-label="Main navigation">
          <Link to="/shop">Shop</Link><Link to="/wardrobe">Wardrobe</Link><Link to="/About">About</Link>
        </nav>
        <div className="north-nav-account">
          <ShopActions />
        </div>
      </header>
      <div className="north-hero-copy">
        <h1 id="north-hero-title">
          <span className="north-headline-mask"><span className="north-headline-line">The Gift</span></span>
          <span className="north-headline-mask"><span className="north-headline-line">Guide</span></span>
        </h1>
        <p>Gifts that mean more, for those who mean the most.</p>
        <div className="north-hero-links">
          <Link to="/shop/women">Shop for her</Link><Link to="/shop/men">Shop for him</Link>
        </div>
      </div>
      <div className="north-hero-bottom">
        <a href="#north-collections">Explore the collection</a>
        {videoReady && !videoFailed && !reduce && (
          <button type="button" aria-label={paused ? "Play background video" : "Pause background video"}
            onClick={() => setPaused((value) => !value)}>
            {paused ? "Play video" : "Pause video"}
          </button>
        )}
      </div>
    </section>
  );
}
