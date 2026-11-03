// [RACK] Preserve the original rail artwork and layout while opening a product.
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useReducedMotion } from "motion/react";
import GarmentRack from "../components/rack/GarmentRack";
import RackProductPanel from "../components/rack/RackProductPanel";
// [NORTH] The landing page embeds the same rail with a section-sized header.
import { Link } from "react-router-dom";
import { rackProducts, priceFmt } from "../prototypes/wardrobe/products";
const EASE_OUT = [0.23, 1, 0.32, 1];

export default function Rack({ embedded = false }) {
  const [selected, setSelected] = useState(null);
  const returnFocusRef = useRef(null);
  const reduce = useReducedMotion();
  const items = useMemo(
    () => rackProducts.map((item) => ({ ...item, product: null })),
    []
  );
  const transition = { duration: reduce ? 0.15 : 0.4, ease: EASE_OUT };
  const Heading = embedded ? "h2" : "h1";
  const titleId = embedded ? "north-rack-title" : "rack-title";
  const closePanel = () => {
    setSelected(null);
    requestAnimationFrame(() => returnFocusRef.current?.focus({ preventScroll: true }));
  };

  return (
    <section id={embedded ? "north-rack" : undefined}
      className={embedded ? "north-rack-section overflow-x-clip bg-white" : "min-h-screen overflow-x-clip bg-white"}
      aria-labelledby={titleId}>
      <header className={embedded ? "north-rack-header px-5 pt-12 md:px-10 md:pt-16" : "px-6 pt-10 md:px-10"}>
        <div className={embedded ? "north-section-heading" : undefined}>
          <Heading id={titleId} className="text-3xl font-semibold tracking-tight text-neutral-900">
            {embedded ? "Shop the rack" : "Shop the rail"}
          </Heading>
          {embedded && <Link to="/shop">View all products</Link>}
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          {embedded ? "Scroll along the rail. Hover to turn a piece, or tap twice to open it." : "Scroll sideways. Hover a piece to turn it toward you."}
        </p>
      </header>
        <div className="grid">
          {/* [RACK] Keeping this mounted preserves scroll and the active garment. */}
          <Motion.div
            className="col-start-1 row-start-1 min-w-0 self-start"
            inert={Boolean(selected)}
            aria-hidden={Boolean(selected)}
            initial={false}
            animate={{ transform: selected && !reduce ? "translateX(-100%)" : "translateX(0%)", opacity: selected ? 0 : 1 }}
            transition={transition}
          >
            <GarmentRack
              items={items}
              suspended={Boolean(selected)}
              formatPrice={priceFmt}
              onOpen={(item, trigger) => {
                returnFocusRef.current = trigger;
                setSelected(item);
              }}
            />
          </Motion.div>
          <AnimatePresence initial={false}>
            {selected && (
              <Motion.div
                key={selected.id}
                className="col-start-1 row-start-1 min-w-0 bg-white"
                initial={{ transform: reduce ? "translateX(0%)" : "translateX(100%)", opacity: 0 }}
                animate={{ transform: "translateX(0%)", opacity: 1 }}
                exit={{ transform: reduce ? "translateX(0%)" : "translateX(100%)", opacity: 0 }}
                transition={transition}
              >
                <RackProductPanel item={selected} product={selected.product} onClose={closePanel} formatPrice={priceFmt} />
              </Motion.div>
            )}
          </AnimatePresence>
        </div>
    </section>
  );
}
