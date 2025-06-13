import { useParams, Link, useLocation } from "react-router-dom";

export default function ProductList() {
  const { id } = useParams();
  const location = useLocation();
  const product = location.state?.product;

   if (!product) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-md" />
      <h1 className="mt-4 text-2xl font-bold">{product.name}</h1>
      <p className="text-gray-600 mt-2">Great quality shirt for your fashion needs.</p>
      <p className="mt-2 text-xl font-semibold"> {product.price} </p>
      <button className="mt-4 bg-black text-white px-4 py-2 rounded hover:bg-gray-800">Add to Cart</button>
      <Link to="/cart" className="ml-4 text-blue-500 underline">Go to Cart</Link>
    </div>
  );
}
