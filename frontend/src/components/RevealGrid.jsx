// [NORTH] Images sharpen only after loading and entering the viewport.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { gsap, ScrollTrigger } from "../lib/northMotion";
import { addToCart } from "../redux/slices/cartSlice";
import NorthImage from "./north/NorthImage";
import useScrollReveal from "../hooks/useScrollReveal";
// [NORTH] Consistent cedi pricing and selectable colour links.
import { formatMoney as money } from "../utils/money";
import { colourName } from "../utils/colour";

function RevealCard({ product, index }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const quantity = useSelector((state) =>
    state.cart.cartItems.find((item) => item.product?._id === product._id)?.quantity || 0
  );
  const pending = useRef(false);
  const [status, setStatus] = useState("idle");
  const add = async () => {
    if (pending.current) return;
    if (!user) { toast.error("Please log in to add to cart"); return; }
    if (product.stock === 0 || quantity >= product.stock) { toast.error("Not enough stock available"); return; }
    pending.current = true;
    setStatus("loading");
    try {
      await dispatch(addToCart({ productId: product._id, quantity: 1 })).unwrap();
      setStatus("added");
      toast.success("Added to cart");
    } catch {
      setStatus("idle"); // The shared cart thunk displays its error toast.
    } finally {
      pending.current = false;
    }
  };
  return (
    <article className="north-product-card" data-card-index={index} data-north-scroll>
      <Link to={"/product/" + product._id} className="north-product-link">
        <div className="north-card-photo">
          <NorthImage key={product.images?.[0]} src={product.images?.[0]} alt={product.name} fit="contain" reveal />
        </div>
        <div className="north-product-copy">
          <h3>{product.name}</h3>
          <p>{money(product.price)}</p>
        </div>
      </Link>
      <div className="north-product-actions">
        <div className="north-colour-dots" role="group" aria-label={product.name + " colours"}>
          {product.colors?.slice(0, 4).map((colour) => <Link key={colour} to={"/product/" + product._id}
            state={{ selectedColor: colour }} className="north-card-swatch"
            aria-label={"View " + product.name + " in " + colourName(colour)} title={colourName(colour)}>
            <span aria-hidden="true" style={{ backgroundColor: colour }} />
          </Link>)}
        </div>
        <button type="button" onClick={add} disabled={status === "loading" || product.stock === 0}
          aria-label={"Add " + product.name + " to cart"} aria-busy={status === "loading"}>
          {product.stock === 0 ? "Sold out" : status === "loading" ? "Adding…" : status === "added" ? "Added" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}

export default function RevealGrid({ products = [], title, id, isLoading, error, onRetry }) {
  const root = useRef(null);
  useScrollReveal(root, products);
  useEffect(() => {
    if (!products.length || isLoading || error) return;
    const media = gsap.matchMedia();
    media.add(
      { standard: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" },
      (context) => {
        const reduce = context.conditions.reduced;
        const cards = Array.from(root.current.querySelectorAll(".north-product-card"));
        context.add("reveal", (images, delay = 0) => {
          if (!images.length) return;
          gsap.to(images, { opacity: 1, filter: "blur(0px)", duration: reduce ? 0.15 : 0.45,
            stagger: reduce ? 0 : 0.06, delay: reduce ? 0 : delay, ease: "power2.out", overwrite: true });
        });
        const cleanups = cards.map((card) => {
          const image = card.querySelector("[data-north-reveal]");
          if (!image) return () => {};
          const loaded = () => {
            if (card.dataset.entered === "true" && image.naturalWidth) {
              const columns = window.innerWidth < 768 ? 2 : 4;
              context.reveal([image], (Number(card.dataset.cardIndex) % columns) * 0.06);
            }
          };
          image.addEventListener("load", loaded);
          return () => image.removeEventListener("load", loaded);
        });
        ScrollTrigger.batch(cards, {
          start: "top 92%", once: true,
          onEnter: (batch) => {
            batch.forEach((card) => { card.dataset.entered = "true"; });
            context.reveal(batch.map((card) => card.querySelector("[data-north-reveal]"))
              .filter((image) => image?.complete && image.naturalWidth));
          },
        });
        ScrollTrigger.refresh();
        return () => cleanups.forEach((cleanup) => cleanup());
      },
      root
    );
    return () => media.revert();
  }, [products, isLoading, error]);

  return (
    <section className="north-section north-reveal-grid" id={id} ref={root} aria-label={title} data-north-scroll-scope>
      <div className="north-section-heading" data-north-scroll>
        <h2>{title}</h2><Link to="/shop">View all</Link>
      </div>
      {error ? (
        <div className="north-grid-status" role="alert">
          <p>We couldn’t load these products.</p><button type="button" onClick={onRetry}>Try again</button>
        </div>
      ) : isLoading ? (
        <div className="north-product-grid" role="status" aria-label="Loading products">
          {[0, 1, 2, 3].map((key) => <div key={key} className="north-grid-placeholder" />)}
        </div>
      ) : products.length ? (
        <div className="north-product-grid">
          {products.map((product, index) => <RevealCard key={product._id} product={product} index={index} />)}
        </div>
      ) : (
        <p className="north-grid-status">New pieces will appear here soon.</p>
      )}
    </section>
  );
}
