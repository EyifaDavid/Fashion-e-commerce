import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { MdCheckroom, MdClose } from "react-icons/md";
import { useTryOnMutation } from "../redux/slices/api/tryonApiSlice";

// Client-side guards (the backend re-validates — it's the source of truth).
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Virtual try-on entry point for a product page.
 * Props:
 *  - productId   (string, required)
 *  - productName (string, optional) — shown in the modal title
 *  - canTryOn    (bool)   — false when the product has no garment/primary image
 */
const TryOnButton = ({ productId, productName, canTryOn = true }) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | loading | done | error
  const [preview, setPreview] = useState(null); // local object URL of the person photo
  const [resultUrl, setResultUrl] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const [tryOn] = useTryOnMutation();

  // Elapsed-seconds counter while processing — sets the 30s–2min expectation honestly.
  useEffect(() => {
    if (phase !== "loading") return;
    setElapsed(0);
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Revoke the object URL when it changes / on unmount (no leaks, nothing persisted).
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickPhoto = () => fileInputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!ALLOWED.includes(file.type)) {
      toast.error("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("That image is too large. Please use one under 8MB.");
      return;
    }

    // Local preview only — this photo is sent to the try-on request and nowhere else.
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setResultUrl(null);
    setPhase("loading");
    setOpen(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("productId", productId);
      const res = await tryOn(formData).unwrap();
      setResultUrl(res.imageUrl);
      setPhase("done");
    } catch (err) {
      setPhase("error");
      const msg = err?.data?.message || "Try-on is busy, please try again shortly.";
      toast.error(msg);
    }
  };

  const close = () => {
    setOpen(false);
    setPhase("idle");
    setResultUrl(null);
    if (preview) { URL.revokeObjectURL(preview); setPreview(null); }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canTryOn}
        title={canTryOn ? "Try this on with your photo" : "Try-on isn't available for this item yet"}
        className="flex items-center gap-2 border border-black px-6 py-3 rounded-full hover:bg-black hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <MdCheckroom size={20} />
        Try it on
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFile}
        className="hidden"
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              <MdClose size={24} />
            </button>

            <h3 className="text-lg font-semibold mb-4 pr-8">
              Virtual try-on{productName ? ` — ${productName}` : ""}
            </h3>

            {phase === "idle" && (
              <div className="flex flex-col items-center gap-3 pt-2 text-center">
                <MdCheckroom size={40} className="text-gray-400" />
                <p className="text-sm text-gray-600">
                  To see this on you, we need a clear, well-lit photo of yourself.
                </p>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={pickPhoto}
                    className="border border-black px-5 py-2 rounded-full hover:bg-gray-100"
                  >
                    Choose a photo
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800"
                  >
                    Take a photo
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">
                  Your photo isn’t stored by us — it’s used only for this try-on.
                </p>
              </div>
            )}

            {phase === "loading" && (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="w-14 h-14 border-4 border-dashed rounded-full animate-spin border-gray-400" />
                <p className="text-sm text-gray-600">
                  Creating your try-on… this can take <b>30 seconds to 2 minutes</b> on our free service.
                </p>
                <p className="text-xs text-gray-400">Elapsed: {elapsed}s — thanks for your patience.</p>
              </div>
            )}

            {phase === "done" && resultUrl && (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={resultUrl}
                  alt="Virtual try-on result"
                  className="w-full max-h-[60vh] object-contain rounded-xl bg-gray-50"
                />
                <div className="flex gap-3">
                  <button
                    onClick={pickPhoto}
                    className="border border-black px-4 py-2 rounded-full hover:bg-gray-100 text-sm"
                  >
                    Choose photo
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="border border-black px-4 py-2 rounded-full hover:bg-gray-100 text-sm"
                  >
                    Take photo
                  </button>
                  <button
                    onClick={close}
                    className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 text-sm"
                  >
                    Done
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 text-center">
                  Preview only — your photo isn’t stored by us.
                </p>
              </div>
            )}

            {phase === "error" && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                {preview && (
                  <img
                    src={preview}
                    alt="Your photo"
                    className="w-24 h-24 object-cover rounded-lg opacity-70"
                  />
                )}
                <p className="text-sm text-gray-600">
                  That didn’t work this time. Our free try-on can get busy — please try again in a moment.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={pickPhoto}
                    className="border border-black px-4 py-2 rounded-full hover:bg-gray-100 text-sm bg-white"
                  >
                    Choose photo
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 text-sm"
                  >
                    Take photo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TryOnButton;
