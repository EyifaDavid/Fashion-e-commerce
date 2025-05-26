import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { MdOutlineShoppingBag } from 'react-icons/md';

const AdminInventory = () => {
  const products = useSelector((state) => state.products.allProducts || []);

  return (
    <div className="p-0 md:p-6">
      <h1 className="text-2xl font-bold text-white mb-4">Inventory List</h1>

      <div className="overflow-x-auto text-xs md:text-base shadow rounded-lg">
        <table className="min-w-full bg-white ">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3 font-semibold">Product</th>
              <th className="text-left p-3 font-semibold">Price</th>
              <th className="text-left p-3 font-semibold">Stock</th>
              <th className="text-left p-3 font-semibold">Category</th>
              <th className="text-left p-3 font-semibold">Genders</th>
              <th className="text-left p-3 font-semibold">Colours</th>
              <th className="text-left p-3 font-semibold">Sizes</th>
              <th className="text-left p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? products.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3 flex items-center gap-2 overflow-hidden">
                  <img src={item.images[0]} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  <span>{item.name}</span>
                </td>
                <td className="p-3">${item.price}</td>
                <td className="p-3">{item.stock}</td>
                <td className="p-3">{item.category || '-'}</td>
                <td className="p-3">{item.genders?.join(', ') || '-'}</td>
                <td className="p-3">{item.noColors || '-'}</td>
                <td className="p-3">{item.sizes?.join(', ') || '-'}</td>
                <td className="p-3">
                  <Link to={`/product/${item.id}`} className="text-blue-500 hover:underline">View</Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="text-center p-4">No products available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminInventory;
