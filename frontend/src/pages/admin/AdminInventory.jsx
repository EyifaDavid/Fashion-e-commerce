import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MdCheckroom } from 'react-icons/md';
import {
  useDeleteProductMutation,
  useGetProductsQuery,
  useGenerateProductPreviewMutation,
  useGenerateAllProductPreviewsMutation,
} from '../../redux/slices/api/productApiSlice';
import { IoEye, IoPencil, IoTrash } from 'react-icons/io5';
import ConfirmModal from '../../components/confirmModal';
import { toast } from 'sonner';

const AdminInventory = () => {
  const { data: response, isLoading, refetch } = useGetProductsQuery();
  const [showModal, setShowModal] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);

  const [deleteProduct] = useDeleteProductMutation();
  const [generateProductPreview] = useGenerateProductPreviewMutation();
  const [generateAllProductPreviews] = useGenerateAllProductPreviewsMutation();
  const [generatingId, setGeneratingId] = useState(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
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

  // [VTON] Kick off background generation of the on-model preview(s) for this product.
  // The API returns immediately (202); the image shows on a later refresh.
  const handleGeneratePreview = async (id) => {
    try {
      setGeneratingId(id);
      const res = await generateProductPreview({ id }).unwrap();
      toast.success(res?.message || "Generating on-model preview — refresh in a minute.");
    } catch (err) {
      toast.error(err?.data?.message || "Couldn't start preview generation.");
    } finally {
      setGeneratingId(null);
    }
  };

  // [VTON] Bulk backfill: queue ALL missing previews in one background job.
  // Returns 202 with a queued count; previews appear on later refreshes.
  const handleBulkGenerate = async () => {
    try {
      setBulkGenerating(true);
      const res = await generateAllProductPreviews().unwrap();
      toast.success(res?.message || "Queued missing previews for background generation.");
      await refetch();
    } catch (err) {
      if (err?.data?.message?.includes('already')) {
        toast.info(err.data.message);
      } else {
        toast.error(err?.data?.message || "Couldn't start bulk preview generation.");
      }
    } finally {
      setBulkGenerating(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
    </div>
  );

  const missingPreviews = products.filter(
    (p) => !p.modelPreviewMale && !p.modelPreviewFemale
  ).length;

  return (
    <div className="p-0 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold text-white">Inventory List</h1>

        {/* [VTON] Bulk backfill: one click queues every product that's missing a preview. */}
        <button
          onClick={handleBulkGenerate}
          disabled={bulkGenerating || missingPreviews === 0}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition ${
            missingPreviews === 0
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={
            missingPreviews === 0
              ? 'All products already have previews'
              : `${missingPreviews} product(s) missing previews`
          }
        >
          <MdCheckroom className={bulkGenerating ? 'animate-pulse' : ''} size={16} />
          {bulkGenerating
            ? 'Queuing...'
            : missingPreviews === 0
              ? 'All previews generated'
              : `Generate ${missingPreviews} missing previews`}
        </button>
      </div>

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
              <tr key={item._id} className="border-b hover:bg-gray-50">
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
                  <div className='flex gap-2 items-center'>
                    <Link to={`/product/${item._id}`} className="text-blue-500 "><IoEye/></Link>
                    <Link to={`/admin/product/${item._id}`}
                      state={{ product: item }}
                      className="text-blue-500 hover:underline"><IoPencil/></Link>
                    {/* [VTON] Generate / regenerate the on-model preview. Doubles as a
                        backfill for older products and a retry when generation failed. */}
                    <button
                      onClick={() => handleGeneratePreview(item._id)}
                      disabled={generatingId === item._id}
                      title={
                        item.modelPreviewMale || item.modelPreviewFemale
                          ? 'Regenerate on-model preview'
                          : 'Generate on-model preview'
                      }
                      className={`${
                        item.modelPreviewMale || item.modelPreviewFemale
                          ? 'text-green-600'
                          : 'text-gray-500'
                      } hover:underline disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      <MdCheckroom className={generatingId === item._id ? 'animate-pulse' : ''} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item._id)}
                      className="text-red-500 hover:underline"
                    >
                      <IoTrash />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" className="text-center p-4">No products available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal — rendered once outside the row map to avoid duplicate instances */}
      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDelete}
        message="Are you sure you want to delete this product?"
      />
    </div>
  );
};

export default AdminInventory;