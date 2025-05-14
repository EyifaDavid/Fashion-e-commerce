import { useRef } from "react";
import { Link } from "react-router-dom";

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
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {/* Scroll buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full w-10 h-10 shadow-md"
      >
        ◀
      </button>

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

      <button
        onClick={() => scroll("right")}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white border rounded-full w-10 h-10 shadow-md"
      >
        ▶
      </button>
    </div>
  );
}
