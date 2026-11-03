import { useEffect, useRef, useState } from "react";
import { rackProducts, priceFmt } from "./products";
import { Hanger, Swatches, AddToBag } from "./RackParts";

const n = rackProducts.length;
const STEP = 360 / n;
const RADIUS = 250;

const normalize = (deg) => {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export default function BoutiqueTurntable() {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [added, setAdded] = useState(false);
  const drag = useRef({ active: false, startX: 0, startRot: 0 });
  const addTimer = useRef(0);

  const index = ((Math.round(-rotation / STEP) % n) + n) % n;
  const selected = rackProducts[index];

  const [activeColor, setActiveColor] = useState(selected.colors[0]);

  useEffect(() => {
    setActiveColor(rackProducts[index].colors[0]);
    setAdded(false);
  }, [index]);

  const snap = (rot) => {
    const k = Math.round(-rot / STEP);
    setRotation(-k * STEP);
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { active: true, startX: e.clientX, startRot: rotation };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    setRotation(drag.current.startRot + dx * 0.32);
  };

  const endDrag = (e) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    snap(rotation);
  };

  const goTo = (k) => {
    setDragging(false);
    setRotation(-k * STEP);
  };

  const next = () => goTo((index + 1) % n);
  const prev = () => goTo((index - 1 + n) % n);

  useEffect(() => {
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 py-8">
      <div className="relative overflow-hidden rounded-[28px]" style={{
        background:
          "radial-gradient(90% 70% at 50% 18%, #2c2a28 0%, #171614 55%, #0c0b0a 100%)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
      }}>
        {/* header */}
        <div className="absolute left-6 top-6 z-20 max-w-[240px]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/45">
            The boutique
          </p>
          <h1
            className="mt-2 text-[26px] font-semibold leading-[1.05] text-white"
            style={{ fontFamily: '"Nunito Sans", sans-serif' }}
          >
            Most Loved
            <br />
            Gifts
          </h1>
          <p className="mt-3 text-[12px] leading-relaxed text-white/50">
            Every piece is hung by hand. Turn the rack to browse.
          </p>
        </div>

        {/* floor + ring */}
        <div className="absolute inset-x-0 bottom-0 h-[55%]" style={{
          background:
            "radial-gradient(60% 90% at 50% 100%, rgba(201,162,39,.18), transparent 70%)",
        }} />

        <div
          className="relative h-[560px] select-none"
          style={{ perspective: "1200px" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[63%] h-[520px] w-[680px] -translate-x-1/2 rounded-[50%]"
            style={{
              transform: "translateX(-50%) rotateX(74deg)",
              border: "1px solid rgba(255,255,255,.16)",
              boxShadow: "0 0 40px rgba(201,162,39,.12)",
            }}
          />

          <div
            className="absolute left-1/2 top-1/2"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              style={{
                position: "absolute",
                transformStyle: "preserve-3d",
                transform: `rotateX(-6deg) rotateY(${rotation}deg)`,
                transition: dragging
                  ? "none"
                  : "transform 640ms cubic-bezier(.22,1,.36,1)",
              }}
            >
              {rackProducts.map((p, i) => {
                const a = normalize(i * STEP + rotation);
                const rad = (a * Math.PI) / 180;
                const visible = Math.abs(a) < 100;
                const front = Math.abs(a) < STEP / 2;
                return (
                  <div
                    key={p.id}
                    className="absolute"
                    style={{
                      left: "-78px",
                      top: "-150px",
                      width: "156px",
                      transform: `rotateY(${i * STEP}deg) translateZ(${RADIUS}px)`,
                      opacity: visible
                        ? clamp(0.35 + 0.65 * Math.cos(rad), 0, 1)
                        : 0,
                      filter: `blur(${clamp((Math.abs(a) - 25) / 30, 0, 2.2)}px)`,
                      zIndex: Math.round(200 - Math.abs(a)),
                      pointerEvents: Math.abs(a) < 45 ? "auto" : "none",
                      transition: "opacity 300ms ease-out, filter 300ms ease-out",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (!front) goTo(i);
                      }}
                      className="block w-full cursor-pointer text-center"
                      aria-label={p.name}
                    >
                      <div
                        className="flex justify-center"
                        style={{ color: front ? "#e8dfcf" : "#8a8478" }}
                      >
                        <Hanger width={92} />
                      </div>
                      <div
                        className="relative -mt-6 overflow-hidden rounded-[14px]"
                        style={{
                          background:
                            "linear-gradient(180deg,#f7f3ea 0%,#efe8da 100%)",
                          boxShadow: front
                            ? "0 26px 40px -18px rgba(0,0,0,.7)"
                            : "0 16px 30px -20px rgba(0,0,0,.6)",
                          border: front
                            ? "1px solid rgba(255,255,255,.55)"
                            : "1px solid rgba(255,255,255,.14)",
                        }}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          draggable={false}
                          className="proto-garment h-[200px] w-full object-contain"
                        />
                        {front && (
                          <span className="absolute right-2 top-2 rounded-full bg-neutral-900/90 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.12em] text-white">
                            {p.tag || "New"}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* controls */}
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous garment"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white/50 hover:text-white active:scale-95"
            >
              ←
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next garment"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:border-white/50 hover:text-white active:scale-95"
            >
              →
            </button>
            <span className="ml-2 text-[11px] uppercase tracking-[0.18em] text-white/35">
              drag / arrows
            </span>
          </div>
          <p className="absolute bottom-6 right-6 z-20 text-[11px] uppercase tracking-[0.18em] text-white/35">
            {index + 1} / {n}
          </p>
        </div>

        {/* detail card */}
        <aside className="absolute right-6 top-24 z-20 w-[236px]">
          <div className="rounded-2xl border border-white/10 bg-white/95 p-4 shadow-[0_24px_50px_-20px_rgba(0,0,0,.8)] backdrop-blur">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-neutral-600">
              {selected.category}
            </span>
            <h2 className="mt-3 text-[17px] font-semibold leading-tight text-neutral-900">
              {selected.name}
            </h2>
            <p className="mt-0.5 text-neutral-600">{priceFmt(selected.price)}</p>
            <div className="mt-4">
              <Swatches
                colors={selected.colors}
                active={activeColor}
                onPick={setActiveColor}
              />
            </div>
            <div className="mt-4">
              <AddToBag
                added={added}
                onClick={() => {
                  setAdded(true);
                  window.clearTimeout(addTimer.current);
                  addTimer.current = window.setTimeout(
                    () => setAdded(false),
                    1600
                  );
                }}
              />
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
