import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { MdOutlineShoppingBag } from 'react-icons/md';
import { useDeleteProductMutation, useGetProductsQuery } from '../../redux/slices/api/productApiSlice';
import { IoEye, IoPencil, IoTrash } from 'react-icons/io5';
import { FaTrash } from 'react-icons/fa';
import ConfirmModal from '../../components/confirmModal';
import { toast } from 'sonner';

const AdminInventory = () => {
   const { data: response, isLoading, error, refetch } = useGetProductsQuery();
   const [showModal, setShowModal] = useState(false);
     const [productIdToDelete, setProductIdToDelete] = useState(null);

   const [deleteProduct]= useDeleteProductMutation();
   const products = response?.data || [];
   

   const handleDelete = async () => {
      await deleteProduct(productIdToDelete);
      setShowModal(false);
      await refetch();
      toast.success("Deleted successfully")
    } 

     const handleDeleteClick = (id) => {
    setProductIdToDelete(id);
    setShowModal(true);
  };

    if (isLoading) return (
  <div className="flex items-center justify-center h-screen">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
  </div>
);


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
                  <div className='flex gap-2'>
                  <Link to={`/product/${item._id}`} className="text-blue-500 "><IoEye/></Link>
                  <Link to={`/admin/product/${item._id}`} 
                  state={{product: item}}
                  className="text-blue-500 hover:underline"><IoPencil/></Link>
                  <button
                    onClick={() => handleDeleteClick(item._id)}
                    className="text-red-500 hover:underline"
                  >
                    <IoTrash />
                  </button>
                    </div>
                     {/* Modal */}
                  <ConfirmModal 
                    isOpen={showModal} 
                    onClose={() => setShowModal(false)} 
                    onConfirm={handleDelete} 
                    message="Are you sure you want to delete this product?"
                  />
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
