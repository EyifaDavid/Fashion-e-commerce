import { useRef, useState } from "react";
import { rackProducts, priceFmt } from "./products";
import { Hanger, Swatches, AddToBag } from "./RackParts";

const rows = [rackProducts.slice(0, 3), rackProducts.slice(3)];

export default function EditorialWall() {
  const [selectedId, setSelectedId] = useState(rackProducts[0].id);
  const [activeColor, setActiveColor] = useState(rackProducts[0].colors[0]);
  const [added, setAdded] = useState(false);
  const addTimer = useRef(0);

  const selected =
    rackProducts.find((p) => p.id === selectedId) || rackProducts[0];

  const pick = (p) => {
    setSelectedId(p.id);
    setActiveColor(p.colors[0]);
    setAdded(false);
  };

  return (
    <section className="mx-auto w-full max-w-[1180px] px-4 py-8">
      <div className="mb-8 flex items-end justify-between border-b border-neutral-200 pb-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-neutral-400">
            Issue 04 — The Edit
          </p>
          <h1 className="mt-2 text-[34px] font-semibold leading-none tracking-tight text-neutral-900">
            Most Loved Gifts
          </h1>
        </div>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="pb-1 text-sm font-medium text-neutral-500 underline underline-offset-4 hover:text-neutral-900"
        >
          View all
        </a>
      </div>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch">
        {/* Feature */}
        <div className="w-full lg:w-[42%]">
          <div key={selected.id} className="feature-in">
            <div className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-[26px] bg-[#f4efe4]">
              <div
                aria-hidden="true"
                className="absolute inset-x-8 top-8 h-px"
                style={{ background: "rgba(0,0,0,.14)" }}
              />
              <div className="absolute left-5 top-4 text-[10px] uppercase tracking-[0.22em] text-neutral-400">
                {selected.category}
              </div>
              <div className="flex flex-col items-center pt-6">
                <div style={{ color: "#3b352c" }}>
                  <Hanger width={130} />
                </div>
                <img
                  src={selected.image}
                  alt={selected.name}
                  draggable={false}
                  className="proto-garment -mt-8 h-[280px] w-[240px] object-contain"
                  style={{ filter: "drop-shadow(0 26px 30px rgba(40,30,15,.22))" }}
                />
              </div>
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold leading-tight text-neutral-900">
                  {selected.name}
                </h2>
                <p className="mt-1 text-neutral-500">{priceFmt(selected.price)}</p>
              </div>
              <span className="mt-1 shrink-0 rounded-full border border-neutral-300 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-neutral-600">
                {selected.tag || "The edit"}
              </span>
            </div>

            <p className="mt-3 max-w-[380px] text-[13px] leading-relaxed text-neutral-500">
              A considered staple in soft, breathable cotton. Cut for an easy
              drape that moves with you, finished by hand at our atelier.
            </p>

            <div className="mt-5 flex items-center gap-5">
              <Swatches
                colors={selected.colors}
                active={activeColor}
                onPick={setActiveColor}
              />
              <span className="text-[11px] uppercase tracking-[0.14em] text-neutral-400">
                {selected.colors.length} colours
              </span>
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
          </div>
        </div>

        {/* Wall */}
        <div className="flex flex-1 flex-col justify-center gap-12">
          {rows.map((row, ri) => (
            <div key={ri} className="relative">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-[26px] h-[3px] rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg,#cfc8bb 0%,#9d968a 55%,#d8d2c6 100%)",
                }}
              />
              <div className="flex items-start justify-around gap-2 pt-6">
                {row.map((p, i) => {
                  const isSel = selected.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pick(p)}
                      aria-pressed={isSel}
                      className="editorial-rise group relative flex w-[150px] flex-col items-center text-center"
                      style={{ animationDelay: `${(ri * 3 + i) * 55}ms` }}
                    >
                      <div
                        className="transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1.5"
                        style={{
                          color: isSel ? "#1f1b15" : "#8d877b",
                          transform: isSel ? "translateY(-6px)" : undefined,
                        }}
                      >
                        <Hanger width={86} />
                      </div>
                      <img
                        src={p.image}
                        alt={p.name}
                        draggable={false}
                        className="proto-garment -mt-5 h-[130px] w-[110px] object-contain transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-2.5"
                        style={{
                          filter: isSel
                            ? "drop-shadow(0 16px 16px rgba(40,30,15,.22))"
                            : "drop-shadow(0 8px 12px rgba(40,30,15,.10))",
                        }}
                      />
                      <span
                        className={`mt-3 block h-[2px] transition-all duration-300 ${
                          isSel
                            ? "w-8 bg-neutral-900"
                            : "w-3 bg-neutral-900/15 group-hover:w-5"
                        }`}
                      />
                      <span className="mt-2 text-[12px] font-medium text-neutral-700">
                        {p.name.split(" ").slice(0, 2).join(" ")}
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {priceFmt(p.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
