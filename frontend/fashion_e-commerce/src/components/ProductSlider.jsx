import { useRef } from "react";

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
    <div className="relative px-6 py-10">
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
        className="flex overflow-x-auto space-x-4 px-12 scroll-smooth scrollbar-hide"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="min-w-[200px] bg-white dark:bg-gray-800 shadow-md rounded-lg p-4"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-40 w-full object-cover rounded"
            />
            <h3 className="mt-2 font-semibold">{product.name}</h3>
            <p className="text-gray-500">{product.price}</p>
          </div>
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
