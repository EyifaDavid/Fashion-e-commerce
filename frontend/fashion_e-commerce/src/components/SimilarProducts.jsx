import { Link } from "react-router-dom";

export default function SimilarProducts({ products = [], ads = [] }) {
  const maxAds = ads.slice(0, 3);

  // Combine products + up to 3 ads after every 3rd product
  const combined = [];
  let adIndex = 0;

  for (let i = 0; i < products.length; i++) {
    combined.push({ ...products[i], type: "product" });
    if ((i + 1) % 3 === 0 && adIndex < maxAds.length) {
      combined.push({ ...maxAds[adIndex], type: "ad" });
      adIndex++;
    }
  }

  return (
    <section className=" ">

      {/* Grid layout: 1 column on mobile, 2 on small, 3+ on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {combined.map((item, index) =>
          item.type === "product" ? (
            <Link
              to={`/product/${item.id}`}
              key={`product-${item.id}`}
              state={{ product: item }}
              className="min-w-[300px] shadow-md rounded-lg p-2 overflow-hidden hover:shadow-lg transition"
            ><div className="bg-amber-50">
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-contain rounded-t"
              />
              </div>
              <div className="bg-white p-2">
                <h3 className="mt-4 font-semibold text-lg">{item.name}</h3>
                <span className="font-semibold">{item.colors} colors</span>
                <span className="text-gray-500 px-4">{item.price}</span>
              </div>
            </Link>
          ) : (
            <div
              key={`ad-${index}`}
              className="bg-yellow-100 dark:bg-yellow-300 rounded-lg p-4 text-center shadow-inner"
            >
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-700">{item.description}</p>
              {item.image && (
                <img
                  src={item.image}
                  alt="Ad"
                  className="mt-2 h-28 w-full object-cover rounded"
                />
              )}
            </div>
          )
        )}
      </div>
    </section>
  );
}
