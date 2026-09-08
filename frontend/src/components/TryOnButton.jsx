import React, { useState, useRef, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { MdCheckroom, MdClose } from "react-icons/md";
import { useTryOnMutation } from "../redux/slices/api/tryonApiSlice";
import { saveModelPhoto, clearModelPhoto } from "../redux/slices/tryonSlice";

// Client-side guards (the backend re-validates — it's the source of truth).
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Virtual try-on entry point for a product page.
 * Props:
 *  - productId   (string, required)
 *  - productName (string, optional) — shown in the modal title
 *  - canTryOn    (bool)   — false when the product has no garment/primary image
 *
 * The customer photo is saved in Redux for the current visit only ("model photo"),
 * so once uploaded/captured it can be reused on any product without re-uploading —
 * the model stays constant and only the garment changes. Nothing is persisted;
 * clearing the tab clears the photo.
 */
const TryOnButton = ({ productId, productName, canTryOn = true }) => {
  const dispatch = useDispatch();
  const modelPhotoUrl = useSelector((state) => state.tryon.modelPhotoUrl);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState(null); // reactive so the video can attach once live
  const [cameraReady, setCameraReady] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | loading | done | error
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

  // ---- Webcam capture (works on desktop + mobile) ----

  // Release the camera whenever we're done with it (also on unmount).
  const stopCamera = useCallback(() => {
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setCameraStream(null);
    setCameraReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // Reactive attach: runs once BOTH the overlay is mounted AND the (async) stream has arrived.
  useEffect(() => {
    if (cameraOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    } else if (!cameraOpen) {
      setCameraReady(false);
    }
  }, [cameraOpen, cameraStream]);

  const openCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Camera isn't supported here — please choose a photo instead.");
      return;
    }
    setCameraOpen(true);
    setCameraReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setCameraStream(stream);
    } catch (err) {
      setCameraOpen(false);
      toast.error(
        err?.name === "NotAllowedError"
          ? "Camera access was denied. Please choose a photo instead."
          : "Couldn't start your camera — please choose a photo instead."
      );
    }
  };

  const closeCamera = () => {
    stopCamera();
    setCameraOpen(false);
  };

  // Give the video a moment to produce its first frame before capturing.
  const waitForFrame = async (video, tries = 30) => {
    for (let i = 0; i < tries; i += 1) {
      if (video.videoWidth > 0 && video.readyState >= 2) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return false;
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ok = await waitForFrame(video);
    if (!ok) {
      toast.error("Camera isn't ready yet. Please wait and try again.");
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Couldn't capture your photo. Please try again.");
          return;
        }
        const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
        closeCamera();
        uploadTryOn(file);
      },
      "image/jpeg",
      0.9
    );
  };

  // ---- Try-on flow ----

  const sendForTryOn = useCallback(
    async (file) => {
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
    },
    [productId, tryOn]
  );

  // A fresh photo (file picker or webcam): validate, then save as the session
  // "model photo" and run the try-on.
  const uploadTryOn = useCallback(
    async (file) => {
      if (!ALLOWED.includes(file.type)) {
        toast.error("Please choose a JPG, PNG or WebP image.");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("That image is too large. Please use one under 8MB.");
        return;
      }

      // Replace the previous session photo (revoke old URL to avoid leaks).
      if (modelPhotoUrl) URL.revokeObjectURL(modelPhotoUrl);
      dispatch(saveModelPhoto(URL.createObjectURL(file)));
      await sendForTryOn(file);
    },
    [modelPhotoUrl, dispatch, sendForTryOn]
  );

  // Reuse the already-saved session photo on a different product (no re-upload).
  const useSavedPhoto = useCallback(async () => {
    if (!modelPhotoUrl) return;
    setResultUrl(null);
    setPhase("loading");
    setOpen(true);
    try {
      const resp = await fetch(modelPhotoUrl);
      const blob = await resp.blob();
      const file = new File([blob], "saved-photo.jpg", { type: blob.type || "image/jpeg" });
      if (!ALLOWED.includes(file.type)) {
        toast.error("Your saved photo isn't a supported image. Please choose another.");
        setPhase("idle");
        return;
      }
      if (file.size > MAX_BYTES) {
        toast.error("Your saved photo is too large. Please choose another.");
        setPhase("idle");
        return;
      }
      await sendForTryOn(file);
    } catch (err) {
      setPhase("idle");
      toast.error("Couldn't reuse your saved photo. Please choose one again.");
    }
  }, [modelPhotoUrl, sendForTryOn]);

  const clearSavedPhoto = useCallback(() => {
    if (modelPhotoUrl) URL.revokeObjectURL(modelPhotoUrl);
    dispatch(clearModelPhoto());
  }, [modelPhotoUrl, dispatch]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    uploadTryOn(file);
  };

  const pickPhoto = () => fileInputRef.current?.click();

  const close = () => {
    stopCamera();
    setCameraOpen(false);
    setOpen(false);
    setPhase("idle");
    setResultUrl(null);
    // The session model photo is intentionally kept for the rest of the visit.
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
                {modelPhotoUrl ? (
                  <>
                    <img
                      src={modelPhotoUrl}
                      alt="Your saved photo"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <p className="text-sm text-gray-600">
                      We’ve saved your photo for this visit — try any garment on it without re-uploading.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      <button
                        onClick={useSavedPhoto}
                        className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800"
                      >
                        Try it on
                      </button>
                      <button
                        onClick={clearSavedPhoto}
                        className="border border-black px-5 py-2 rounded-full hover:bg-gray-100"
                      >
                        Use different photo
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <MdCheckroom size={40} className="text-gray-400" />
                    <p className="text-sm text-gray-600">
                      To see this on you, we need a clear, well-lit photo of yourself — add it once and try
                      every garment.
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={pickPhoto}
                        className="border border-black px-5 py-2 rounded-full hover:bg-gray-100"
                      >
                        Choose a photo
                      </button>
                      <button
                        onClick={openCamera}
                        className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800"
                      >
                        Take a photo
                      </button>
                    </div>
                  </>
                )}
                <p className="text-[11px] text-gray-400">
                  {modelPhotoUrl
                    ? "Saved for this visit only — cleared when you close this tab."
                    : "Your photo isn’t stored by us — it’s used only for this try-on."}
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
                <div className="flex flex-wrap justify-center gap-3">
                  {modelPhotoUrl && (
                    <button
                      onClick={useSavedPhoto}
                      className="border border-black px-4 py-2 rounded-full hover:bg-gray-100 text-sm"
                    >
                      Retry with same photo
                    </button>
                  )}
                  <button
                    onClick={pickPhoto}
                    className="border border-black px-4 py-2 rounded-full hover:bg-gray-100 text-sm"
                  >
                    Choose photo
                  </button>
                  <button
                    onClick={openCamera}
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
                  {modelPhotoUrl
                    ? "Photo saved for this visit only — cleared when you close this tab."
                    : "Preview only — your photo isn’t stored by us."}
                </p>
              </div>
            )}

            {phase === "error" && (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                {modelPhotoUrl && (
                  <img
                    src={modelPhotoUrl}
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
                    onClick={openCamera}
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

      {cameraOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={closeCamera}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeCamera}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-500 hover:text-black"
            >
              <MdClose size={24} />
            </button>

            <h3 className="text-lg font-semibold mb-4 pr-8">Take a photo</h3>

            <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedData={() => setCameraReady(true)}
                className="w-full max-h-[50vh]"
              />
            </div>

            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={closeCamera}
                className="border border-black px-5 py-2 rounded-full hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                disabled={!cameraReady}
                className="bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Capture
              </button>
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-3">
              Keep your face and upper body in frame with good lighting.
            </p>

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
};

export default TryOnButton;