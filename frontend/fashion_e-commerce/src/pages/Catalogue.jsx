import { Link } from "react-router-dom";

const products = [
  { id: 1, name: "Black T-Shirt", price: "$25", image: "/shirt.jpg" },
  { id: 2, name: "Denim Jacket", price: "$60", image: "/jacket.jpg" },
];

export default function Catalogue() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <Link to={`/product/${product.id}`} key={product.id}>
          <div className="border rounded-lg p-4 hover:shadow-md">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
            <h2 className="mt-2 font-semibold">{product.name}</h2>
            <p className="text-gray-500">{product.price}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
