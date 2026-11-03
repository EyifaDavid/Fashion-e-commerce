// [NORTH] Reserve space and fade loaded images without shifting the layout.
import { useState } from "react";

export default function NorthImage({
  src, alt, fallback, aspect = "4 / 5", fit = "cover", eager = false, reveal = false,
}) {
  const [failed, setFailed] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [loadedSrc, setLoadedSrc] = useState("");
  const displaySrc = failed ? fallback : src;

  return (
    <div className="north-image-media" style={{ aspectRatio: aspect }}>
      {displaySrc && !unavailable ? (
        <img
          src={displaySrc}
          alt={alt}
          width="640"
          height="800"
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          data-north-reveal={reveal ? "" : undefined}
          className={reveal ? "north-reveal-image" : "north-image-fade" + (loadedSrc === displaySrc ? " is-loaded" : "")}
          style={{ objectFit: fit }}
          onLoad={(event) => setLoadedSrc(event.currentTarget.getAttribute("src"))}
          onError={() => {
            if (!failed && fallback && fallback !== src) setFailed(true);
            else setUnavailable(true);
          }}
        />
      ) : (
        <span className="north-image-unavailable">Image unavailable</span>
      )}
    </div>
  );
}
