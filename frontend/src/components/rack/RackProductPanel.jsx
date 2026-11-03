// [RACK] Reuses the shop's authenticated product/quantity cart contract.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, useIsPresent, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../../redux/slices/cartSlice";

const FOCUS = " focus-visible:outline-2 focus-visible:outline-black focus-visible:outline-offset-4";
const choiceClass = (active) => "min-h-11 min-w-11 border px-4 text-sm " +
  (active ? "border-black bg-black text-white" : "border-neutral-300 text-neutral-700 hover:border-black") + FOCUS;

export default function RackProductPanel({ item, product: catalogueProduct, onClose, formatPrice }) {
  // [RACK] The original cutout inventory supplies its own display metadata.
  const product = catalogueProduct || {
    ...item,
    rackFrontImage: item?.front,
    rackSideImage: item?.back || item?.side,
    images: item?.front ? [item.front] : [],
  };
  const canPurchase = Boolean(catalogueProduct?._id);
  const reduce = useReducedMotion();
  const isPresent = useIsPresent();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const backRef = useRef(null);
  const pendingRef = useRef(false);
  const [view, setView] = useState("front");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [status, setStatus] = useState("idle");
  const [addError, setAddError] = useState("");
  const [failedImages, setFailedImages] = useState([]);
  const sizes = product.sizes || [];
  const colors = product.colors || [];
  // [RACK] As requested, Back uses rackSideImage, with the regular product photo as fallback.
  const image = view === "front" ? product.rackFrontImage : product.rackSideImage;
  const currentImage = [image, product.images?.[0]].find((url) => url && !failedImages.includes(url));
  const inCart = cartItems.find((item) => item.product?._id === product._id);
  const outOfStock = product.stock === 0;

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, []);

  const handleAddToCart = async () => {
    if (pendingRef.current) return;
    // [RACK] Demo slugs are not backend product IDs; never send them to the cart.
    if (!canPurchase) return;
    if (!selectedSize) {
      toast.error("Please select a size first");
      return;
    }
    if (!user) {
      toast.error("Please log in to add to cart");
      return;
    }
    if (outOfStock || (inCart && inCart.quantity >= product.stock)) {
      toast.error(outOfStock ? "Product is out of stock" : "Not enough stock available");
      return;
    }
    pendingRef.current = true;
    setStatus("loading");
    setAddError("");
    try {
      // [RACK] Size/colour stay local, matching Catalogue; backend stores no variants.
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      setStatus("added");
      toast.success("Added to cart");
    } catch {
      setStatus("idle");
      // [RACK] The shared cart thunk owns error toasts; avoid a duplicate.
      setAddError("Couldn’t add this garment. Please try again.");
    } finally {
      pendingRef.current = false;
    }
  };

  return (
    <div
      inert={!isPresent}
      aria-hidden={!isPresent}
      onKeyDown={(event) => { if (event.key === "Escape" && isPresent) onClose(); }}
      className="mx-auto max-w-6xl px-6 pb-10 pt-6 md:px-10"
    >
      <button ref={backRef} type="button" onClick={onClose} className={"mb-6 min-h-11 text-sm text-neutral-600 hover:text-black" + FOCUS}>
        <span aria-hidden="true">← </span>Back to rack
      </button>
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] md:gap-12">
        <div className="flex min-w-0 justify-center bg-neutral-50">
          <div className="relative h-[340px] w-full max-w-[440px] sm:h-[440px] lg:h-[550px]">
            {currentImage ? (
              <Motion.img
                key={currentImage}
                src={currentImage}
                alt={product.name + ", " + view + " view"}
                width="640"
                height="800"
                draggable={false}
                className="h-full w-full object-contain"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduce ? 0.15 : 0.2 }}
                onError={() => setFailedImages((urls) => [...urls, currentImage])}
              />
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-neutral-500">Image unavailable</p>
            )}
          </div>
        </div>
        <div className="min-w-0 space-y-6 md:pt-6">
          <div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-neutral-900">{product.name}</h2>
            <p className="mt-3 text-lg text-neutral-700">{formatPrice(product.price)}</p>
          </div>
          <div role="group" aria-label="Garment view" className="flex gap-2">
            {["front", "back"].map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => setView(option)} className={choiceClass(view === option) + " capitalize"}>
                {option}
              </button>
            ))}
          </div>
          {colors.length > 0 && (
            <fieldset disabled={status === "loading"}>
              <legend className="mb-3 text-sm text-neutral-600">Colour</legend>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button key={color} type="button" aria-label={"Colour " + color} aria-pressed={selectedColor === color}
                    onClick={() => { setSelectedColor(color); setStatus("idle"); }}
                    className={"flex min-h-11 min-w-11 items-center justify-center border " + (selectedColor === color ? "border-black" : "border-neutral-300") + FOCUS}>
                    <span aria-hidden="true" className="h-5 w-5 rounded-full border border-neutral-300" style={{ backgroundColor: color }} />
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset disabled={status === "loading"}>
            <legend className="mb-3 text-sm text-neutral-600">Size — select one</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map((size) => (
                <button key={size} type="button" aria-pressed={selectedSize === size}
                  onClick={() => { setSelectedSize(size); setStatus("idle"); setAddError(""); }}
                  className={choiceClass(selectedSize === size)}>
                  {size}
                </button>
              ))}
            </div>
            {sizes.length === 0 && <p className="text-sm text-neutral-500">No sizes available.</p>}
          </fieldset>
          <div>
            <button type="button" disabled={!canPurchase || status === "loading" || outOfStock || sizes.length === 0}
              aria-busy={status === "loading"} onClick={handleAddToCart}
              className={"flex min-h-12 w-full items-center justify-center gap-2 bg-black px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50" + FOCUS}>
              {status === "loading" && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />}
              {outOfStock ? "Out of stock" : status === "loading" ? "Adding…" : status === "added" ? "Added" : "Add to cart"}
            </button>
            <p role="status" className="sr-only">{status === "added" ? "Added to cart" : status === "loading" ? "Adding to cart" : ""}</p>
            {addError && <p role="alert" className="mt-3 text-sm text-red-700">{addError}</p>}
            {!canPurchase && <p className="mt-3 text-sm text-neutral-500">This piece is available to preview.</p>}
          </div>
          {canPurchase && (
            <Link to={"/product/" + product._id} className={"inline-flex min-h-11 items-center text-sm text-neutral-600 underline underline-offset-4 hover:text-black" + FOCUS}>
              View product page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
