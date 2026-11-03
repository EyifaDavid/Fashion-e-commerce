import { useEffect, useRef, useState } from "react";
import { rackProducts, priceFmt } from "./products";
import { Hanger, Swatches, AddToBag } from "./RackParts";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function AtelierRail() {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const rafRef = useRef(0);
  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScroll: 0,
    lastScroll: 0,
    lastT: 0,
    v: 0,
  });
  const suppressClick = useRef(false);

  const addTimer = useRef(0);

  const [selected, setSelected] = useState(rackProducts[0]);
  const [activeColor, setActiveColor] = useState(rackProducts[0].colors[0]);
  const [added, setAdded] = useState(false);
  const [dragging, setDragging] = useState(false);

  const setSwing = (deg) => {
    const track = trackRef.current;
    if (track) track.style.setProperty("--swing", String(deg));
  };

  const stopMomentum = () => cancelAnimationFrame(rafRef.current);

  const startMomentum = (velocity) => {
    const el = viewportRef.current;
    if (!el || prefersReduced()) {
      setSwing(0);
      return;
    }
    let v = clamp(velocity * 16, -42, 42);
    const step = () => {
      el.scrollLeft += v;
      v *= 0.94;
      setSwing(clamp(v * 0.22, -9, 9));
      if (Math.abs(v) > 0.25) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setSwing(0);
      }
    };
    rafRef.current = requestAnimationFrame(step);
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const el = viewportRef.current;
    if (!el) return;
    stopMomentum();
    drag.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      lastScroll: el.scrollLeft,
      lastT: performance.now(),
      v: 0,
    };
    suppressClick.current = false;
    setDragging(true);
    el.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    const el = viewportRef.current;
    if (!d.active || !el) return;
    const now = performance.now();
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 4) {
      d.moved = true;
      suppressClick.current = true;
    }
    const prev = el.scrollLeft;
    el.scrollLeft = d.startScroll - dx;
    const dt = Math.max(1, now - d.lastT);
    d.v = (el.scrollLeft - prev) / dt;
    d.lastT = now;
    d.lastScroll = el.scrollLeft;
    if (!prefersReduced()) setSwing(clamp(d.v * 16 * 0.22, -9, 9));
  };

  const endDrag = (e) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    setDragging(false);
    viewportRef.current?.releasePointerCapture?.(e.pointerId);
    startMomentum(d.v);
  };

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => () => stopMomentum(), []);

  const pick = (p) => {
    if (suppressClick.current) return;
    setSelected(p);
    setActiveColor(p.colors[0]);
    setAdded(false);
  };

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            The rail
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900">
            Most Loved Gifts
          </h1>
        </div>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="text-sm font-medium text-neutral-600 underline underline-offset-4 hover:text-neutral-900"
        >
          View all
        </a>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div
          className="relative min-h-[430px] flex-1 overflow-hidden rounded-[28px]"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 0%, #fbf7ef 0%, #f2ebdf 60%, #e8dfcf 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.7)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-6 top-[58px] h-[6px] rounded-full"
            style={{
              background:
                "linear-gradient(180deg,#d9d5cd 0%,#8f8b84 45%,#6f6b65 55%,#cfcac2 100%)",
              boxShadow: "0 2px 6px rgba(0,0,0,.18)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[64px] h-[340px]"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,.10), transparent 55%)",
              maskImage:
                "radial-gradient(120% 70% at 50% 0%, #000 30%, transparent 70%)",
              WebkitMaskImage:
                "radial-gradient(120% 70% at 50% 0%, #000 30%, transparent 70%)",
            }}
          />

          <div
            ref={viewportRef}
            data-dragging={dragging}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="proto-hide-scroll relative h-[430px] cursor-grab overflow-x-auto overflow-y-hidden"
            style={{ touchAction: "pan-y" }}
          >
            <div
              ref={trackRef}
              className="flex w-max items-start gap-2 px-10 pt-[54px]"
              style={{ ["--swing"]: 0 }}
            >
              {rackProducts.map((p) => {
                const isSel = selected.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pick(p)}
                    aria-pressed={isSel}
                    className="group relative w-[178px] shrink-0 text-left"
                  >
                    <div
                      className="rail-swing"
                      style={{ transformOrigin: "50% 6px" }}
                    >
                      <div
                        className="flex justify-center"
                        style={{ color: isSel ? "#2b2621" : "#8a8478" }}
                      >
                        <Hanger width={104} />
                      </div>
                      <div className="relative -mt-7">
                        <img
                          src={p.image}
                          alt={p.name}
                          draggable={false}
                          className="proto-garment mx-auto h-[210px] w-[150px] object-contain transition-transform duration-500 ease-out group-hover:-translate-y-1.5"
                          style={{
                            filter: isSel
                              ? "drop-shadow(0 18px 22px rgba(40,30,15,.22))"
                              : "drop-shadow(0 10px 14px rgba(40,30,15,.12))",
                          }}
                        />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-center gap-2">
                      <span
                        className={`h-[3px] rounded-full transition-all duration-300 ${
                          isSel
                            ? "w-6 bg-neutral-900"
                            : "w-3 bg-neutral-900/20 group-hover:w-4"
                        }`}
                      />
                    </div>
                    <span className="mt-2 block text-center text-[12px] font-medium text-neutral-700">
                      {p.name.split(" ").slice(0, 2).join(" ")}
                    </span>
                    <span className="block text-center text-[11px] text-neutral-500">
                      {priceFmt(p.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.2em] text-neutral-500/80">
            drag the rail
          </p>
        </div>

        <aside className="w-full shrink-0 lg:w-[300px]">
          <div className="rounded-[24px] border border-neutral-200 bg-white p-5 shadow-[0_18px_40px_-24px_rgba(0,0,0,.35)]">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-neutral-600">
                {selected.category}
              </span>
              {selected.tag && (
                <span className="text-[11px] font-medium text-rose-600">
                  {selected.tag}
                </span>
              )}
            </div>
            <h2 className="mt-4 text-xl font-semibold leading-tight text-neutral-900">
              {selected.name}
            </h2>
            <p className="mt-1 text-lg text-neutral-700">
              {priceFmt(selected.price)}
            </p>

            <div className="mt-5 border-t border-neutral-100 pt-4">
              <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-neutral-400">
                Colour
              </p>
              <Swatches
                colors={selected.colors}
                active={activeColor}
                onPick={setActiveColor}
              />
            </div>

            <div className="mt-6">
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
            <p className="mt-4 text-[12px] leading-relaxed text-neutral-500">
              Hangs true to size. Free returns within 30 days.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
