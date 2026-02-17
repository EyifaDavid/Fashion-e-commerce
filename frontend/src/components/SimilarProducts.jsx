import { Link } from "react-router-dom";
import { toast } from "sonner";
// import { addToCart } from "../redux/slices/cartSlice";
import { useDispatch, useSelector } from "react-redux";
import Button from "./Button";
import twos from "../assets/images/two4one.jpg";
import { MdOutlineShoppingBag } from "react-icons/md";
import { useGetProductsQuery } from "../redux/slices/api/productApiSlice";
import { addToCart } from "../redux/slices/cartSlice";

export default function SimilarProducts({ ads = [] }) {
  const {data:response, isLoading ,error}= useGetProductsQuery()
  const products = response?.data || [];
  const maxAds = ads.slice(0, 3);
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.cart);


 // Filter products with discounts
  const discountedProducts = products.filter(
    (product) => product.discount || product.specialOffer
  );

  // Determine which products to use: discounted or all
  const productsToDisplay = discountedProducts.length > 0 ? discountedProducts : products;



  // Combine products + up to 3 ads after every 3rd product
  const combined = [];
  let adIndex = 0;

  for (let i = 0; i < productsToDisplay.length; i++) {
    combined.push({ ...productsToDisplay[i], type: "product" });
    if ((i + 1) % 3 === 0 && adIndex < maxAds.length) {
      combined.push({ ...maxAds[adIndex], type: "ad" });
      adIndex++;
    }
  }

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

    dispatch(addToCart({ productId: item.id, quantity: 1 }));
    toast.success("Added to cart");
  };

    if (isLoading) return (
  <div className="flex items-center justify-center h-screen">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
  </div>
);

  if (error) return <p>Error fetching products</p>;

  return (
    <div className="w-full h-full">
    <div className="m-4 flex justify-center items-center">
      <div className="w-[650px] text-center">
      <h1 className="text-2xl pb-4 font-semibold">Buy two for the price of one</h1>
      <h2 className=" font-semibold">Choose your set across selected Heavyweight colours and enjoy your two items for the
        price of one. Treat yourself to the cosiest holiday outfit or give someone you love an
        unforgettable gift.</h2>
        <Link to="/shop/discounts">
         <Button
        type="Submit"
        label= "See eligible colors"
        className="mt-6 w-[200px] h-14 p-4 bg-[#002fa7] text-white rounded-full"
          />
       </Link>
     
      </div>
    </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mt-10">
        <div className="w-auto max-w-1/2 ">
        <img src= {twos} alt="two for one hoodie-set" className="object-contain w-full" />
        </div>


      <section className="flex flex-col md:flex-row ">

      {/* Grid layout: 1 column on mobile, 2 on small, 3+ on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-6">
        {combined.map((item, index) =>
          item.type === "product" ? (
          <div
          key={`product-${item.id}`}
          className="group min-w-[300px] rounded-lg p-4 overflow-hidden hover:shadow-lg inline-block transition-transform transform hover:scale-105 duration-300 relative hover:z-20"
        >
              {/* Image section wrapped in Link */}
              <Link
                to={`/product/${item._id}`}
                state={{ product: item }}
                className="block bg-amber-50 rounded-t"
              >
                <img
                  src={item.images?.[0] || "/placeholder.jpg"}
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
              <div className="opacity-0 group-hover:opacity-100 mt-4 transition-opacity duration-50">
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
     </div>
      </div>
  );
}

