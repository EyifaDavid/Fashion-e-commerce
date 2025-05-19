import { useRef } from "react";
import { Link } from "react-router-dom";
import Button from "./Button";
import { MdArrowBack, MdArrowForward } from "react-icons/md";

export default function ProductSlider({ title = "Featured", products = [] }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
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
            className="min-w-[300px] shadow-md rounded-lg p-2 overflow-hidden"
          ><div className="bg-amber-50">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain rounded"
            />
            </div>

             <div className="bg-white p-2">
                 <h3 className="mt-4 font-semibold">{product.name}</h3>
                 <span className="font-semibold">{product.colors} colors</span>
            <span className="text-gray-500 px-4">{product.price}</span>
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
