import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { MdArrowBack, MdArrowForward, MdOutlineShoppingBag } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/slices/cartSlice";
import { toast } from "sonner";

export default function ProductSlider({ title = "Featured", products = [] }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);

  // Scroll left or right
  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Update visibility of scroll buttons
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 0);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1); // adjust for rounding errors
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products]);

  const handleAddToCart = (product) => {
    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      countInStock: product.countInStock,
    };

    const isInCart = cartItems.find((i) => i.id === item.id);

    if (item.countInStock === 0) {
      toast.error("Product is out of stock");
      return;
    }

    if (isInCart && isInCart.quantity >= item.countInStock) {
      toast.error("Not enough stock available");
      return;
    }

    dispatch(addToCart(item));
    toast.success("Added to cart");
  };

  return (
    <div className="relative py-10">
      <div className="flex justify-between">
        <h2 className="text-base md:text-sm sm:text-xs font-semibold mb-4">{title}</h2>
        <a href="#" className="underline text-sm font-semibold">View all</a>
      </div>

      {showLeft && (
        <Button
          type="button"
          onClick={() => scroll("left")}
          icon={<MdArrowBack />}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border bg-white"
        />
      )}

      {showRight && (
        <Button
          type="button"
          onClick={() => scroll("right")}
          icon={<MdArrowForward />}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border bg-white"
        />
      )}

    <div
  ref={scrollRef}
  className="flex overflow-x-auto space-x-4 scroll-smooth scrollbar-hide"
>
  {products.map((product) => (
    <div
      key={product.id}
      className="group relative min-w-[300px] shadow-md rounded-lg p-2 overflow-hidden"
    >
      {/* Only image wrapped in Link */}
      <Link
        to={`/product/${product.id}`}
        state={{ product }}
        className="block bg-amber-50 rounded-t"
      >
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain rounded"
        />
      </Link>

      <div className="bg-white p-2">
        <h3 className="mt-4 font-semibold block">{product.name}</h3>
        <div className="flex items-center">
          <span className="font-semibold">{product.noColors} colors</span>
          <span className="text-gray-500 px-4">{new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(product.price)}</span>

          {/* Shopping bag icon */}
          <span className="hidden group-hover:flex absolute right-8 transition-all duration-300">
            <Button
              icon={<MdOutlineShoppingBag size={15} className="hover:cursor-pointer" />}
              className="bg-black text-white text-sm rounded-full"
              onClick={() => handleAddToCart(product)}
            />
          </span>
        </div>
      </div>

      {/* Color swatches */}
      <div className="hidden group-hover:block mt-4 transition-all duration-300">
        <div className="flex gap-2 mb-2">
          {product.colors?.slice(0, 4).map((color, index) => (
            <div
              key={index}
              className="w-4 h-4 rounded-full border cursor-pointer"
              style={{ backgroundColor: color }}
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation if nested in a link
                e.stopPropagation(); // Prevent hover/parent events if needed
                console.log("Selected color:", color);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  ))}
</div>
</div>
)}
