export function Hanger({ className = "", stroke = "currentColor", width = 120 }) {
  return (
    <svg
      viewBox="0 0 120 74"
      width={width}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M60 20c0-9-11-11-11-3 0 5 6 6 11 9"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M60 26 16 50h88L60 26Z"
        stroke={stroke}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M16 50h88"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Swatches({ colors, onPick, active }) {
  return (
    <div className="flex items-center gap-1.5">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          aria-label={`Colour ${c}`}
          onClick={(e) => {
            e.stopPropagation();
            onPick?.(c);
          }}
          className="h-4 w-4 rounded-full border transition-transform duration-150 ease-out hover:scale-110"
          style={{
            backgroundColor: c,
            boxShadow:
              active === c
                ? "0 0 0 2px #fff, 0 0 0 3.5px #0b0b0b"
                : "0 0 0 1px rgba(0,0,0,.14) inset",
          }}
        />
      ))}
    </div>
  );
}

export function AddToBag({ added, onClick, className = "", dark = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-200 ease-out active:scale-[.97] ${
        dark
          ? "bg-white text-black hover:bg-white/90"
          : "bg-black text-white hover:bg-neutral-800"
      } ${className}`}
    >
      {added ? (
        <>
          <span aria-hidden="true">✓</span> Added
        </>
      ) : (
        <>
          Add to bag
          <span aria-hidden="true">→</span>
        </>
      )}
    </button>
  );
}
