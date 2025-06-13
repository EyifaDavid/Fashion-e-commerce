import { useDispatch, useSelector } from "react-redux";
import {
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  incrementQuantityLocally,
  decrementQuantityLocally,
  fetchCart,
} from "../redux/slices/cartSlice";
import { useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Checkout from "../components/Checkout";
import Button from "../components/Button";

export default function Cart() {
  const { cartItems } = useSelector((state) => state.cart);
  const dispatch = useDispatch();
  
  const navigate =useNavigate();

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const handleIncrement = (productId) => {
    dispatch(incrementQuantityLocally(productId));
    dispatch(incrementQuantity(productId))
      .unwrap()
      .catch(() => {
        dispatch(decrementQuantityLocally(productId));
        toast.error("Failed to increase quantity");
      });
  };

  const handleDecrement = (productId) => {
    dispatch(decrementQuantityLocally(productId));
    dispatch(decrementQuantity(productId))
      .unwrap()
      .catch(() => {
        dispatch(incrementQuantityLocally(productId));
        toast.error("Failed to decrease quantity");
      });
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId))
      .unwrap()
      .catch(() => {
        toast.error("Failed to remove item");
      });
  };


const totalBeforeDiscount = cartItems.reduce((acc, item) => {
  return acc + item.quantity * parseFloat(item.product.price);
}, 0);

const totalDiscountAmount = cartItems.reduce((acc, item) => {
  const price = parseFloat(item.product.price);
  const discountPercent = item.product.discount || 0;
  const discountPrice = price * (discountPercent / 100);
  const subtotal = item.quantity * discountPrice;
  return acc + item.quantity * discountPrice;
  
}, 0);

const totalAfterDiscount = totalBeforeDiscount - totalDiscountAmount;


  const total = cartItems.reduce(
    (acc, item) => acc + item.quantity * parseFloat(item.product.price),
    0
  );

  return (
    <div className="p-6 min-h-screen max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
     {/* <div>
           <button
        onClick={() => navigate(-1)} // go back one step in history
        className="flex mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        ← Back
      </button>
     </div> */}
    
      {/* Cart Items Table */}
      <div className="flex-1 overflow-x-auto">
        <h2 className="text-xl font-bold mb-4">Your Cart</h2>

        {cartItems.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <table className="w-full text-xs md:text-base table-auto border-collapse  border-gray-300">
            <thead>
              <tr className="bg-gray-100 border">
                <th className=" px-4 py-2 text-left">Product</th>
                <th className=" px-4 py-2 text-center">Price</th>
                <th className=" px-4 py-2 text-center">Quantity</th>
                <th className=" px-4 py-2 text-center">Subtotal</th>
                <th className=" px-4 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item) => {
                const price = parseFloat(item.product.price);
                const discountPercent = item.product.discount || 0;
                const discountedPrice = price * (1 - discountPercent / 100);
                const subtotal = item.quantity * discountedPrice;
                return(
                <tr key={item.product._id} className="border-b border-gray-300">
                  <td className="flex items-center px-1 py-1 overflow-auto md:gap-4 md:px-4 md:py-2">
                    <img
                      src={item.product.images?.[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <span>{item.product.name}</span>
                  </td>
                  <td className="text-center px-4 py-2">${parseFloat(item.product.price).toFixed(2)}</td>
                  <td className="text-center px-4 py-2">
                    <div className="inline-flex bg-gray-100 items-center border rounded-full overflow-hidden select-none">
                      <button
                        className="px-2 py-1  hover:bg-gray-300"
                        onClick={() => handleDecrement(item.product._id)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="px-4 ">{item.quantity}</span>
                      <button
                        className="px-2 py-1 bg-gray-200 hover:bg-gray-300"
                        onClick={() => handleIncrement(item.product._id)}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="text-center px-4 py-2">
                    ${subtotal.toFixed(2)}
                  </td>
                  <td className="text-center px-4 py-2">
                    <button
                      onClick={() => handleRemove(item.product._id)}
                      className="text-red-500 hover:text-red-700 font-semibold"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>

      {/* Order Summary */}
      <div className="w-full md:w-72 p-4 border border-gray-300 rounded shadow-sm bg-white">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <p className="mb-2">
          Items: <strong>{cartItems.length}</strong>
        </p>

        <p className="mb-1 text-gray-600">
          Total before discount: ${totalBeforeDiscount.toFixed(2)}
        </p>
        
        <p className="mb-2 text-red-600">
          Discount: -${totalDiscountAmount.toFixed(2)}
        </p>

        <p className="mb-2 text-lg font-bold">
          Total to pay: <span className="text-green-600">${totalAfterDiscount.toFixed(2)}</span>
        </p>

        <Checkout total={total}/>

        <Button
          disabled={cartItems.length === 0}
          className={`w-full py-2 mt-4 rounded text-white ${
            cartItems.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#002fa7] hover:bg-blue-700"
          }`}
          // onClick={...}
            label= "Place Order"
        />
       
        
      </div>

    </div>
  );
}
