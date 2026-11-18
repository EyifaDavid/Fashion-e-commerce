import { useCallback, useState } from "react";
import { toast } from "sonner";
import { MdCheckroom } from "react-icons/md";
import { openAnywear } from "../utils/anywear";

// Best-effort hint for the widget; an unknown/unisex value falls back to null so
// the widget auto-detects instead of guessing. "female" must be checked first
// because it contains "male" as a substring.
function normalizeGender(value) {
  const raw = String(value ?? "").toLowerCase();
  if (raw.includes("female") || raw.includes("woman") || raw.includes("women")) return "female";
  if (raw.includes("male") || raw.includes("man") || raw.includes("men")) return "male";
  return null;
}

/**
 * Thin launcher for Anywear's live-camera try-on on a product page.
 * The widget owns the camera and the session; this component only opens it and
 * reports a load failure. No shopper photo is captured, uploaded, or persisted.
 */
const TryOnButton = ({ productName, canTryOn = true, garmentCategory, garmentGender }) => {
  const [busy, setBusy] = useState(false);

  // init() runs once, but the loader reads this on every open, so SPA navigation
  // to another product always supplies that product's metadata to the widget.
  const getGarmentMeta = useCallback(
    () => ({
      category: garmentCategory || null,
      gender: normalizeGender(garmentGender),
      categoryRaw: garmentCategory || null,
    }),
    [garmentCategory, garmentGender]
  );

  const handleClick = async () => {
    setBusy(true);
    try {
      await openAnywear({
        domain: import.meta.env.VITE_ANYWEAR_DOMAIN || window.location.hostname,
        getGarmentMeta,
      });
    } catch (err) {
      toast.error(err?.message || "Live try-on couldn't load. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={!canTryOn || busy}
        title={
          canTryOn
            ? `Try ${productName || "this item"} on live`
            : "Live try-on isn't available for this item yet"
        }
        className="flex items-center gap-2 border border-black px-6 py-3 rounded-full hover:bg-black hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <MdCheckroom size={20} />
        {busy ? "Opening…" : "Try it on"}
      </button>
      <p className="mt-2 text-[11px] leading-snug text-gray-500">
        Free beta — live try-on is powered by Decart. Your camera is processed only during the session and
        isn’t stored by us. Occasional rate limits may apply.
      </p>
    </div>
  );
};

export default TryOnButton;
