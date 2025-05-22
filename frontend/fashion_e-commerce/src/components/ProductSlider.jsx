import { useRef } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { MdArrowBack, MdArrowForward, MdOutlineShoppingBag } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/slices/cartSlice";
import { toast } from "sonner";

export default function ProductSlider({ title = "Featured", products = [] }) {
  const scrollRef = useRef(null);
  

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  
    const handleAddToCart = () => {
    const item = {
      id:product.id,
      name: product.name,
      price: product.price,
      image: selectedImage,
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
            <a href="" className="underline text-sm font-semibold">View all</a>
        </div>
      

      {/* Scroll buttons */}
    <Button
      type="submit" 
      onClick={() => scroll("left")}
      icon = <MdArrowBack/>
      className="absolute left-2 top-1/2 -translate-y-1/2 z-5 w-10 h-10 rounded-full border bg-white "
      />

      <div
        ref={scrollRef}
        className="flex overflow-x-auto space-x-4 scroll-smooth scrollbar-hide"
      >
        {products.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            state={{ product }}
            className="group relative min-w-[300px] shadow-md rounded-lg p-2 overflow-hidden"
          ><div className="bg-amber-50">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain rounded"
            />
            </div>

             <div className="  bg-white p-2">
                 <h3 className="mt-4 font-semibold block">{product.name}</h3>
                 <div className="flex items-center">
                  <span className="font-semibold">{product.noColors} colors</span>
              <span className="text-gray-500 px-4">{product.price}</span>

              <span  className="hidden group-hover:flex absolute right-8 transition-all duration-300">
                {/* Add to Cart Button */}
                <Button
                  icon= <MdOutlineShoppingBag size={15} className="hover:cursor-pointer"/>
                  className="bg-black text-white text-sm rounded-full"
                  onClick={handleAddToCart}
              />
            </span>
                 </div>
     
            </div>
            {/* Hidden section on hover */}
              <div className="hidden group-hover:block mt-4 transition-all duration-300">
                {/* Swatches */}
                <div className="flex gap-2 mb-2">
                  {product.colors?.slice(0, 4).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
            </div>
          </Link>
        ))}
        
        
      </div>

        <Button
      type="submit" 
      onClick={() => scroll("right")}
      icon = <MdArrowForward/>
      className="absolute right-2 top-1/2 -translate-y-1/2 z-5 w-10 h-10 rounded-full border bg-white "
      />
    </div>

    
  );
}
