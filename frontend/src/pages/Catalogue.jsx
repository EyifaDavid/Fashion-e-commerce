// [NORTH] Two-column photography with sticky, quiet product details.
import { useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import TryOnButton from "../components/TryOnButton";
import NorthImage from "../components/north/NorthImage";
import RevealGrid from "../components/RevealGrid";
// [NORTH] Reserve page space while product data arrives.
import Loading from "../components/Loader";
import { addToCart } from "../redux/slices/cartSlice";
import { useGetProductByIdQuery, useGetProductsQuery } from "../redux/slices/api/productApiSlice";

// [NORTH] One currency and readable labels across product options.
import { formatMoney as money } from "../utils/money";
import { colourName } from "../utils/colour";

export default function Catalogue() {
  const { id } = useParams();
  const location = useLocation();
  // [NORTH] New products reset choices; refreshing the same product preserves them.
  return <ProductDetails key={id} id={id} initialColor={location.state?.selectedColor} />;
}

function ProductDetails({ id, initialColor }) {
  const { data, isLoading, error, refetch } = useGetProductByIdQuery(id);
  const { data: catalogue } = useGetProductsQuery();
  const product = data?.data;
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.cartItems);
  const [colorChoice, setSelectedColor] = useState(initialColor || "");
  const [sizeChoice, setSelectedSize] = useState("");
  const [imageChoice, setSelectedImage] = useState("");
  const [status, setStatus] = useState("idle");
  const pending = useRef(false);
  const selectedColor = product?.colors?.includes(colorChoice) ? colorChoice : product?.colors?.[0] || "";
  const selectedSize = product?.sizes?.includes(sizeChoice) ? sizeChoice : product?.sizes?.[0] || "";

  const gallery = useMemo(() => {
    if (!product) return [];
    const both = Boolean(product.modelPreviewMale && product.modelPreviewFemale);
    const photos = [
      ...(product.modelPreviewMale ? [{ image: product.modelPreviewMale, caption: both ? "Male" : "On model" }] : []),
      ...(product.modelPreviewFemale ? [{ image: product.modelPreviewFemale, caption: both ? "Female" : "On model" }] : []),
      ...(product.images || []).map((image) => ({ image, caption: "" })),
    ];
    return photos.filter((photo, index) => photos.findIndex((entry) => entry.image === photo.image) === index);
  }, [product]);
  const selectedPhoto = gallery.find(photo => photo.image === imageChoice) || gallery[0];
  const recommendations = useMemo(
    () => (catalogue?.data || []).filter((entry) => entry._id !== id && !entry.isTrashed).slice(0, 4),
    [catalogue, id]
  );

  const add = async () => {
    if (!product || pending.current) return;
    if (product.sizes?.length && !selectedSize) { toast.error("Please select a size first"); return; }
    const quantity = cartItems.find((item) => item.product?._id === product._id)?.quantity || 0;
    if (product.stock === 0 || quantity >= product.stock) { toast.error("Not enough stock available"); return; }
    pending.current = true;
    setStatus("loading");
    try {
      // [NORTH] Preserve the existing product/quantity contract; variants remain local.
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      setStatus("added");
      toast.success("Added to cart");
    } catch {
      setStatus("idle"); // Errors are displayed by the shared thunk.
    } finally {
      pending.current = false;
    }
  };

  if (isLoading) return <Loading page label="Loading product…" />;
  if (error) return <div className="north-page north-section north-grid-status" role="alert">
    <p>We couldn’t load this product.</p><button type="button" onClick={refetch}>Try again</button>
  </div>;
  if (!product) return <div className="north-page north-section"><p>Product not found.</p><Link to="/shop">Back to the collection</Link></div>;

  // Anywear reads Product JSON-LD to pick the garment image. Prefer the dedicated
  // garment shot so it never latches onto a model/lifestyle photo.
  const garmentUrl = product.garmentImage || product.images?.[0];
  const distinctGenders = [...new Set((product.genders || []).map((g) => String(g).toLowerCase()))];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: garmentUrl,
    url: window.location.href,
  };

  return (
    <div className="north-page">
      <script type="application/ld+json">
        {JSON.stringify(productJsonLd)}
      </script>
      <div className="north-product-page">
        <nav className="north-product-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/shop">Collection</Link><span aria-hidden="true">/</span><span>{product.name}</span>
        </nav>
        <div className="north-product-layout">
          <div className="north-product-gallery" aria-label={product.name + " photography"}>
            <figure className="north-product-photo north-product-main">
              <NorthImage key={selectedPhoto?.image} src={selectedPhoto?.image} fallback={product.images?.[0]}
                fit="contain" eager alt={product.name + (selectedPhoto?.caption ? ", " + selectedPhoto.caption : ", selected view")} />
              {selectedPhoto?.caption && <figcaption>{selectedPhoto.caption}</figcaption>}
            </figure>
            {gallery.length > 1 && <div className="north-product-thumbnails" role="group" aria-label="Choose product image">
              {gallery.map((photo, index) => <button type="button" key={photo.image}
                aria-label={"Show " + product.name + " image " + (index + 1) + (photo.caption ? ", " + photo.caption : "")}
                aria-pressed={selectedPhoto?.image === photo.image} onClick={() => setSelectedImage(photo.image)}>
                <NorthImage src={photo.image} fallback={product.images?.[0]} fit="contain" alt="" />
              </button>)}
            </div>}
          </div>
          <div className="north-product-details">
            <h1>{product.name}</h1>
            <p className="north-product-price">{money(product.price)}</p>
            {product.rating > 0 && <p className="north-product-description" aria-label={"Rated " + product.rating + " out of 5"}>
              {"★".repeat(Math.min(5, Math.floor(product.rating)))} ({product.rating})
            </p>}
            <p className="north-product-description">{product.description}</p>
            {product.colors?.length > 0 && <fieldset className="north-product-options" disabled={status === "loading"}>
              <legend>Colour: <strong>{colourName(selectedColor)}</strong></legend>
              <div className="north-option-list">
                {product.colors.map((colour) => <button type="button" key={colour} className="north-colour-option"
                  aria-label={"Colour " + colourName(colour)} title={colourName(colour)} aria-pressed={selectedColor === colour}
                  onClick={() => { setSelectedColor(colour); setStatus("idle"); }}>
                  <span aria-hidden="true" style={{ backgroundColor: colour }} />
                  {selectedColor === colour && <svg className="north-swatch-check" aria-hidden="true" viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}
                </button>)}
              </div>
            </fieldset>}
            {product.sizes?.length > 0 && <fieldset className="north-product-options" disabled={status === "loading"}>
              <legend>Size: <strong>{selectedSize}</strong></legend>
              <div className="north-option-list">
                {product.sizes.map((size) => <button type="button" key={size} aria-pressed={selectedSize === size}
                  onClick={() => { setSelectedSize(size); setStatus("idle"); }}>{size}</button>)}
              </div>
            </fieldset>}
            <div className="north-product-cta">
              <button type="button" onClick={add} disabled={status === "loading" || product.stock === 0} aria-busy={status === "loading"}>
                {product.stock === 0 ? "Out of stock" : status === "loading" ? "Adding…" : status === "added" ? "Added" : "Add to Cart"}
              </button>
              <Link to="/Cart">View bag</Link>
            </div>
            <p role="status" className="sr-only">{status === "added" ? "Added to cart" : status === "loading" ? "Adding to cart" : ""}</p>
            <div className="north-product-tryon">
              <TryOnButton
                productId={product._id}
                productName={product.name}
                canTryOn={Boolean(garmentUrl)}
                garmentUrl={garmentUrl}
                garmentCategory={product.category}
                garmentGender={distinctGenders.length === 1 ? distinctGenders[0] : ""}
              />
            </div>
          </div>
        </div>
      </div>
      {recommendations.length > 0 && <RevealGrid title="You may also like" products={recommendations} />}
    </div>
  );
}
