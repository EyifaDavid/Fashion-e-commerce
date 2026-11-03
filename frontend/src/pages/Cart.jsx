// [NORTH] A clear shopping bag using the existing cart thunks and cedi amounts.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { MdAdd, MdRemove, MdClose, MdArrowForward, MdArrowBack, MdOutlineShoppingBag } from "react-icons/md";
import { toast } from "sonner";
import {
  removeFromCart, incrementQuantity, decrementQuantity,
  incrementQuantityLocally, decrementQuantityLocally, fetchCart,
} from "../redux/slices/cartSlice";
import Checkout from "../components/Checkout";
import Loading from "../components/Loader";
import { formatMoney } from "../utils/money";

export default function Cart() {
  const { cartItems, status } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(status !== "succeeded");
  const [loadError, setLoadError] = useState(false);
  const [pending, setPending] = useState(new Set());
  const busy = useRef(new Set());
  const checkout = useRef(null);

  useEffect(() => {
    let active = true;
    dispatch(fetchCart()).unwrap().catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [dispatch]);

  const markPending = (id, active) => {
    if (active) busy.current.add(id); else busy.current.delete(id);
    setPending(new Set(busy.current));
  };
  const updateQuantity = async (id, increase) => {
    if (busy.current.has(id)) return;
    markPending(id, true);
    dispatch(increase ? incrementQuantityLocally(id) : decrementQuantityLocally(id));
    try {
      await dispatch(increase ? incrementQuantity(id) : decrementQuantity(id)).unwrap();
    } catch {
      dispatch(increase ? decrementQuantityLocally(id) : incrementQuantityLocally(id));
      toast.error(increase ? "Failed to increase quantity" : "Failed to decrease quantity");
    } finally { markPending(id, false); }
  };
  const remove = async (id) => {
    if (busy.current.has(id)) return;
    markPending(id, true);
    try { await dispatch(removeFromCart(id)).unwrap(); }
    catch { toast.error("Failed to remove item"); }
    finally { markPending(id, false); }
  };
  const retry = async () => {
    setLoadError(false);
    setLoading(true);
    try { await dispatch(fetchCart()).unwrap(); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  };
  const reviewCheckout = () => {
    checkout.current.open = true;
    checkout.current.querySelector("summary").focus();
    checkout.current.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };
  const totalBeforeDiscount = cartItems.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0);
  const totalDiscountAmount = cartItems.reduce((sum, item) => sum + item.quantity * Number(item.product.price) * (Number(item.product.discount) || 0) / 100, 0);
  const totalAfterDiscount = totalBeforeDiscount - totalDiscountAmount;
  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading && !cartItems.length) return <Loading page label="Loading your bag…" />;

  return (
    <div className="north-page north-cart-page">
      <div className="north-cart-heading">
        <div><p className="north-cart-eyebrow">YOUR SELECTION</p><h1>Your bag <span>({count})</span></h1></div>
        <Link to="/shop" className="north-cart-continue"><MdArrowBack size={18} aria-hidden="true" />Continue shopping</Link>
      </div>
      {loadError && !cartItems.length ? (
        <div className="north-grid-status" role="alert"><p>We couldn't load your bag.</p><button type="button" onClick={retry}>Try again</button></div>
      ) : !cartItems.length ? (
        <div className="north-cart-empty">
          <MdOutlineShoppingBag size={56} aria-hidden="true" />
          <h2>Your bag is waiting.</h2><p>Find your next favourite piece.</p>
          <Link to="/shop" className="north-solid-link">Explore the collection<MdArrowForward size={18} aria-hidden="true" /></Link>
        </div>
      ) : (
        <div className="north-cart-layout">
          <div>
            <ul className="north-cart-items" aria-label="Items in your bag">
              {cartItems.map(({ product, quantity }) => {
                const price = Number(product.price);
                const discounted = price * (1 - (Number(product.discount) || 0) / 100);
                const isBusy = pending.has(product._id);
                return (
                  <li key={product._id} className="north-cart-item" data-cart-row aria-busy={isBusy}>
                    <Link to={"/product/" + product._id} className="north-cart-image" aria-label={"View " + product.name}>
                      <img src={product.images?.[0] || "/placeholder.jpg"} alt="" width="192" height="256" loading="lazy" />
                    </Link>
                    <div className="north-cart-item-details">
                      <div className="north-cart-item-heading">
                        <div><Link to={"/product/" + product._id}><h2>{product.name}</h2></Link>
                          {product.category && <p className="north-cart-category">{product.category}</p>}</div>
                        <button type="button" className="north-icon-control north-cart-remove" onClick={() => remove(product._id)}
                          disabled={isBusy} aria-label={"Remove " + product.name + " from bag"} title="Remove item">
                          <MdClose size={20} aria-hidden="true" />
                        </button>
                      </div>
                      <p className="north-cart-unit-price">{formatMoney(discounted)}
                        {product.discount > 0 && <><s>{formatMoney(price)}</s><span className="north-cart-discount">{product.discount}% off</span></>}
                      </p>
                      <div className="north-cart-item-bottom">
                        <div className="north-cart-quantity" role="group" aria-label={"Quantity for " + product.name}>
                          <button type="button" onClick={() => updateQuantity(product._id, false)} disabled={isBusy || quantity <= 1}
                            aria-label={"Decrease quantity of " + product.name}><MdRemove size={18} aria-hidden="true" /></button>
                          <span aria-live="polite" aria-atomic="true">{quantity}</span>
                          <button type="button" onClick={() => updateQuantity(product._id, true)}
                            disabled={isBusy || (typeof product.stock === "number" && quantity >= product.stock)}
                            aria-label={"Increase quantity of " + product.name}><MdAdd size={18} aria-hidden="true" /></button>
                        </div>
                        <p className="north-cart-line-total">{formatMoney(discounted * quantity)}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <details className="north-cart-checkout" ref={checkout}>
              <summary>Delivery &amp; payment<MdArrowForward size={20} aria-hidden="true" /></summary>
              <Checkout />
            </details>
          </div>
          <aside className="north-cart-summary" aria-labelledby="north-cart-summary-title">
            <h2 id="north-cart-summary-title">Order summary</h2>
            <dl>
              <div><dt>Items</dt><dd>{count}</dd></div>
              <div><dt>Subtotal</dt><dd>{formatMoney(totalBeforeDiscount)}</dd></div>
              <div><dt>Discount</dt><dd>{totalDiscountAmount > 0 ? "−" : ""}{formatMoney(totalDiscountAmount)}</dd></div>
              <div className="north-cart-total"><dt>Total</dt><dd>{formatMoney(totalAfterDiscount)}</dd></div>
            </dl>
            <p className="north-cart-delivery-note">Delivery charges will be confirmed at checkout.</p>
            <button type="button" className="north-cart-review" onClick={reviewCheckout}>Review delivery &amp; payment<MdArrowForward size={18} aria-hidden="true" /></button>
            <p className="north-cart-order-note">Order placement is currently unavailable.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
