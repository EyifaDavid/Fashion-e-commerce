import { useEffect, useRef, useState } from "react";
import { motion as Motion, useReducedMotion } from "motion/react";

// Layout constants. Idle slots are narrow so garments sit close together like on
// a real rail; the hovered slot opens up and its neighbours slide aside.
const IDLE_W = 112;
const ACTIVE_W = 260;
const GARMENT_H = 340;
// [RACK] All rack artwork is 640x800 and already includes its own hanger.
const ART_W = 640;
const ART_H = 800;
// [RACK] Rendered height of the artwork inside object-contain (width-limited).
const GARMENT_SCALE = Math.min(ACTIVE_W / ART_W, GARMENT_H / ART_H);
// [RACK] Hook tip in the artwork is 8px from the top edge, at 800px tall.
const HOOK_INSET = Math.round(8 * GARMENT_SCALE);
// [RACK] The rail sits 8px below the slot's top edge (48px rail, 40px padding).
const RAIL_TOP = 8;
// [RACK] Small offset so the artwork's hook tip meets the rail line. Every piece
// is drawn with its hook tip at row 8, so this one offset hangs the whole rail
// consistently - never lift an individual garment or its hook will float above
// the rail.
// [RACK] One shared nudge upward, so the hook's curve sits over the bar instead
// of hanging under it; the bar then passes through the hook mouth. The rail is
// painted over the artwork, so this needs to expose a few px of hook above it.
const HOOK_LIFT = 8;
const GARMENT_OFFSET = RAIL_TOP - HOOK_INSET - HOOK_LIFT;
// [RACK] Longest hem reaches 323px below the slot's top edge (315 after the
// nudge above), so the label sits just under it.
const LABEL_TOP = 330;
// [RACK] Slot height: the label line plus a little breathing room.
const SLOT_HEIGHT = LABEL_TOP + 28;
// Used only when a product has no real side photo: the front image is turned
// edge-on with CSS so the rack still works before side images are generated.
const FAKE_SIDE_ANGLE = 72;

const spring = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 };

function Garment({ item, active, transition, reduce }) {
  const hasSide = Boolean(item.side);
  const idleAngle = hasSide ? 0 : FAKE_SIDE_ANGLE;
  // [RACK] Reduced motion also covers the front/side image crossfade.
  const fade = { duration: reduce ? 0.15 : 0.28 };
  // [RACK] Optional per-piece downward nudge; moves the artwork only, so the
  // label and slot layout stay put.
  const drop = item.drop || 0;

  return (
    <Motion.div
      className="relative"
      style={{
        height: GARMENT_H,
        transformPerspective: 900,
        // [RACK] Pivot at the hook so the hanger stays on the rail when turning.
        transformOrigin: "50% 2%",
      }}
      initial={false}
      animate={{ rotateY: reduce || active ? 0 : idleAngle, y: drop }}
      transition={transition}
    >
      {hasSide && (
        <Motion.img
          src={item.side}
          width={ART_W}
          height={ART_H}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-contain object-top"
          initial={false}
          animate={{ opacity: active ? 0 : 1 }}
          transition={fade}
        />
      )}
      <Motion.img
        src={item.front}
        width={ART_W}
        height={ART_H}
        onError={(event) => {
          // [RACK] Try the ordinary product photo once, then stop retrying.
          const fallback = item.product?.images?.[0];
          if (fallback && event.currentTarget.getAttribute("src") !== fallback) {
            event.currentTarget.src = fallback;
          }
        }}
        alt=""
        draggable={false}
        className="absolute inset-0 h-full w-full object-contain object-top"
        style={{
          filter: "drop-shadow(0 8px 10px rgba(0,0,0,.10))",
        }}
        initial={false}
        animate={{ opacity: hasSide ? (active ? 1 : 0) : 1 }}
        transition={fade}
      />
    </Motion.div>
  );
}

/**
 * Horizontal clothing rack.
 */
export default function GarmentRack({ items, onOpen, suspended = false, formatPrice = (n) => n }) {
  const reduce = useReducedMotion();
  const transition = reduce ? { duration: 0 } : spring;
  const [activeId, setActiveId] = useState(null);
  const viewportRef = useRef(null);
  // [RACK] Some browsers emit a MouseEvent for touch clicks. Track the pointer too.
  const pointerTypeRef = useRef("mouse");

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if (e.deltaY < 0 && el.scrollLeft <= 0) return;
      if (e.deltaY > 0 && el.scrollLeft >= max - 1) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleClick = (e, item) => {
    if (suspended) return;
    const touch = e.detail !== 0 && (e.nativeEvent?.pointerType === "touch" || pointerTypeRef.current === "touch");
    if (touch && activeId !== item.id) {
      setActiveId(item.id);
      return;
    }
    setActiveId(item.id);
    onOpen?.(item, e.currentTarget);
  };

  return (
    <div
      ref={viewportRef}
      className="overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="relative flex w-max min-w-full items-start justify-center gap-1 px-[8vw] pb-10 pt-10">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[48px] h-[3px] bg-gradient-to-b from-neutral-300 to-neutral-500/70"
        />
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <Motion.button
              key={item.id}
              data-rack-garment={item.id}
              type="button"
              aria-label={`${item.name}, ${formatPrice(item.price)}`}
              className={`relative shrink-0 cursor-pointer text-left outline-none focus-visible:[&_.rack-label]:underline ${active ? "z-20" : "z-0"}`}
              style={{ height: SLOT_HEIGHT }}
              initial={false}
              animate={{ width: active ? ACTIVE_W : IDLE_W }}
              transition={transition}
              onPointerDown={(e) => { pointerTypeRef.current = e.pointerType; }}
              onPointerEnter={(e) => {
                if (!suspended && e.pointerType === "mouse") setActiveId(item.id);
              }}
              onPointerLeave={(e) => {
                if (!suspended && e.pointerType === "mouse") setActiveId(null);
              }}
              onFocus={(e) => {
                if (!suspended && e.currentTarget.matches(":focus-visible")) setActiveId(item.id);
              }}
              onBlur={() => { if (!suspended) setActiveId((id) => (id === item.id ? null : id)); }}
              onClick={(e) => handleClick(e, item)}
            >
              <div className="relative mx-auto" style={{ width: ACTIVE_W }}>
                {/* [RACK] Artwork carries its own hanger; offset only stands the hook on the rail. */}
                <div style={{ marginTop: GARMENT_OFFSET }}>
                  <Garment item={item} active={active} transition={transition} reduce={reduce} />
                </div>
                {/* [RACK] Price tag hanging from the hanger's right arm. */}
                <Motion.div
                  className="pointer-events-none absolute z-20"
                  style={{ left: "62%", top: "12%", transformOrigin: "50% 0%" }}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, rotateZ: 16, y: -6 }}
                  animate={
                    reduce
                      ? { opacity: active ? 1 : 0 }
                      : active
                      ? { opacity: 1, rotateZ: [16, -9, 5, -2, 0], y: 0 }
                      : { opacity: 0, rotateZ: 0, y: -6 }
                  }
                  transition={
                    reduce
                      ? { duration: 0.15 }
                      : active
                      ? { duration: 1.1, ease: "easeOut" }
                      : { duration: 0.15 }
                  }
                >
                  <div className="relative h-8 w-16 rounded-sm border border-neutral-300 bg-white shadow-md">
                    <span className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full border border-neutral-300 bg-neutral-100" />
                    <span className="flex h-full items-center justify-center text-xs font-medium text-neutral-900">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                </Motion.div>
                <div
                  className="rack-label text-center"
                  style={{ marginTop: LABEL_TOP - (GARMENT_OFFSET + GARMENT_H) }}
                >
                  <Motion.span
                    className="block text-sm font-medium text-neutral-900"
                    initial={false}
                    animate={{ opacity: active ? 1 : 0, y: active ? 0 : 4 }}
                    transition={{ duration: reduce ? 0 : 0.22 }}
                  >
                    {item.name}
                  </Motion.span>
                </div>
              </div>
            </Motion.button>
          );
        })}
      </div>
    </div>
  );
}
