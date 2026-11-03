import { useRef, useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { MdArrowBack, MdArrowForward, MdOutlineShoppingBag } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/slices/cartSlice";
import { toast } from "sonner";
import { useGetProductsQuery } from "../redux/slices/api/productApiSlice";
// [NORTH] Shared cedi display and colour selections that open the product.
import { formatMoney } from "../utils/money";
import { colourName } from "../utils/colour";

export default function ProductSlider({ title = "Featured"}) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const { data: response, isLoading, error } = useGetProductsQuery();
  const products = useMemo(() => response?.data || [], [response]);
  
  // const products = useSelector((state) => state.products.allProducts);

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
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0],
      countInStock: product.stock,
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

    dispatch(addToCart({productId: item.id, quantity:1}));
    toast.success("Added to cart");
  };

  if (isLoading) return (
  <div className="flex items-center justify-center h-screen">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
  </div>
);

  if (error) return <p>Error fetching products</p>;



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
      className="group relative min-w-[300px] max-w-[300px] shadow-md rounded-lg p-2 overflow-hidden"
    >
      {/* Only image wrapped in Link */}
      <Link
        to={`/product/${product._id}`}
        state={{ product }}
        className="block bg-amber-50 rounded-t"
      >
        <img
          src={product.images?.[0] || "/placeholder.jpg"}
          alt={product.name}
          className="h-full w-full object-contain rounded"
        />
      </Link>

      <div className="bg-white p-2">
        <h3 className="mt-4 font-semibold block">{product.name}</h3>
        <div className="flex items-center">
          <span className="font-semibold">{product.noColors} colors</span>
          <span className="text-gray-500 px-4">{formatMoney(product.price)}</span>

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
      <div className="min-h-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 mt-4 transition-opacity duration-300">
        <div className="flex gap-2 mb-2">
          {product.colors?.slice(0, 4).map((color, index) => (
            <Link
              key={index}
              to={`/product/${product._id}`} state={{ selectedColor: color }}
              aria-label={"View " + product.name + " in " + colourName(color)}
              className="block w-6 h-6 rounded-full border cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  ))}
</div>
</div>
)}
