import { Link } from "react-router-dom";
import { toast } from "sonner";
import { addToCart } from "../redux/slices/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Button";
import { MdOutlineShoppingBag } from "react-icons/md";

export default function SimilarProducts({ products = [], ads = [] }) {
  const maxAds = ads.slice(0, 3);
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.cart);

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
    <section className="flex flex-col md:flex-row ">

      {/* Grid layout: 1 column on mobile, 2 on small, 3+ on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        {combined.map((item, index) =>
          item.type === "product" ? (
          <div
          key={`product-${item.id}`}
          className="group min-w-[300px] shadow-md rounded-lg p-2 overflow-hidden hover:shadow-lg transition"
        >
              {/* Image section wrapped in Link */}
              <Link
                to={`/product/${item.id}`}
                state={{ product: item }}
                className="block bg-amber-50 rounded-t"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-contain rounded-t"
                />
              </Link>

              {/* Details section (not inside the Link) */}
              <div className="bg-white p-2 relative">
                <h3 className="mt-4 font-semibold text-lg">{item.name}</h3>
                <div className="flex items-center">
                  <span className="font-semibold">{item.noColors} colors</span>
                  <span className="text-gray-500 px-4">{new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(item.price)}</span>

                  {/* Shopping Bag Button */}
                  <span className="hidden group-hover:flex absolute right-8 transition-all duration-300">
                    <Button
                      icon={<MdOutlineShoppingBag size={15} className="hover:cursor-pointer" />}
                      className="bg-black text-white text-sm rounded-full"
                      onClick={() => handleAddToCart(item)}
                    />
                  </span>
                </div>
              </div>

              {/* Swatches */}
              <div className="hidden group-hover:block mt-4 transition-all duration-300">
                <div className="flex gap-2 mb-2">
                  {item.colors?.slice(0, 4).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border cursor-pointer"
                      style={{ backgroundColor: color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        console.log("Selected color:", color);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

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
