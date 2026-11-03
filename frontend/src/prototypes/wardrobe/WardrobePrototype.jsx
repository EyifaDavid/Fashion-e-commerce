import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./picker.css";
import AtelierRail from "./AtelierRail";
import BoutiqueTurntable from "./BoutiqueTurntable";
import EditorialWall from "./EditorialWall";
// [NORTH] Keep preview shipping copy consistent with shop currency.
import { formatMoney } from "../../utils/money";

const variants = [
  { name: "Atelier", Comp: AtelierRail },
  { name: "Turntable", Comp: BoutiqueTurntable },
  { name: "Editorial", Comp: EditorialWall },
];

const readIndex = () => {
  const v = parseInt(new URLSearchParams(window.location.search).get("v"), 10);
  return v >= 1 && v <= variants.length ? v - 1 : 0;
};

function ContextChrome({ children }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <header className="flex items-center justify-between border-b border-neutral-100 px-6 py-4 md:px-10">
        <span className="text-lg font-extrabold tracking-[0.18em]">DEVX</span>
        <nav className="hidden items-center gap-7 text-[13px] text-neutral-500 sm:flex">
          <span className="text-neutral-900">New in</span>
          <span>Women</span>
          <span>Men</span>
          <span>Wardrobe</span>
          <span>Gifts</span>
        </nav>
        <div className="flex items-center gap-4 text-[13px] text-neutral-500">
          <span>Search</span>
          <span>Bag (2)</span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="mt-4 border-t border-neutral-100 px-6 py-8 text-[12px] text-neutral-400 md:px-10">
        Free shipping over {formatMoney(50)} · 30-day returns · Atelier-made
      </footer>
    </div>
  );
}

export default function WardrobePrototype() {
  const [index, setIndex] = useState(readIndex);
  const [nonce, setNonce] = useState(0);
  const [ready, setReady] = useState(false);

  const pickerRef = useRef(null);
  const highlightRef = useRef(null);
  const itemRefs = useRef([]);

  const moveHighlight = useCallback(() => {
    const el = itemRefs.current[index];
    const hl = highlightRef.current;
    if (!el || !hl) return;
    hl.style.width = `${el.offsetWidth}px`;
    hl.style.transform = `translateX(${el.offsetLeft}px)`;
  }, [index]);

  useLayoutEffect(() => {
    moveHighlight();
  }, [moveHighlight, ready]);

  useEffect(() => {
    const onResize = () => moveHighlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [moveHighlight]);

  useEffect(() => {
    let raf1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(raf1);
  }, []);

  const setActive = useCallback((i) => {
    if (i < 0 || i >= variants.length) return;
    setIndex(i);
    const url = new URL(window.location.href);
    url.searchParams.set("v", String(i + 1));
    window.history.replaceState(null, "", url);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.target?.isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= variants.length) setActive(num - 1);
      else if (e.key === "ArrowRight") setActive((index + 1) % variants.length);
      else if (e.key === "ArrowLeft")
        setActive((index - 1 + variants.length) % variants.length);
      else if (e.key === "r" || e.key === "R") setNonce((n) => n + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, setActive]);

  const Active = variants[index].Comp;

  return (
    <ContextChrome>
      <Active key={`${index}-${nonce}`} />

      <nav
        ref={pickerRef}
        className="proto-picker"
        aria-label="Prototype variants"
        data-ready={ready ? "" : undefined}
      >
        <span
          ref={highlightRef}
          className="proto-picker-highlight"
          aria-hidden="true"
        />
        {variants.map((v, i) => (
          <button
            key={v.name}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            type="button"
            className="proto-picker-item"
            data-active={i === index ? "true" : undefined}
            aria-current={i === index ? "true" : undefined}
            onClick={() => setActive(i)}
          >
            {v.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button
          type="button"
          className="proto-picker-item proto-picker-replay"
          aria-label="Replay animation (R)"
          onClick={() => setNonce((n) => n + 1)}
        >
          ↻
        </button>
      </nav>
    </ContextChrome>
  );
}
