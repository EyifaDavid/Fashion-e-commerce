import { Link, useLocation, useParams } from "react-router-dom";

export default function Cart() {
  const { id } = useParams();
  const location = useLocation();
  const product = location.state?.product;

 if (!product) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold">No Product added</h2>
      </div>
    );
  } 

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
      <div className="border p-4 rounded-md">
        <p>{product.name}</p>
        <p className="text-gray-500">$25 x 1</p>
      </div>
      <p className="mt-4 font-semibold">Total: $25</p>
      <Link to="/checkout">
        <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Proceed to Checkout
        </button>
      </Link>
    </div>
  );
}
