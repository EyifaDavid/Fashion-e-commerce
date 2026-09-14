import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MdCheckroom } from 'react-icons/md';
import {
  useDeleteProductMutation,
  useGetProductsQuery,
  useGenerateProductPreviewMutation,
  useGenerateAllProductPreviewsMutation,
  useGetPreviewStatusQuery,
} from '../../redux/slices/api/productApiSlice';
import { IoEye, IoPencil, IoTrash, IoReload } from 'react-icons/io5';
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

  // [VTON] Poll the backend's in-memory generation tracker so we can show real
  // per-product progress/failures and auto-refresh when a job finishes (no blind
  // "refresh to see it"). Until the deployed backend is updated, /previews/status
  // returns 404 — poll slowly in that case instead of hammering every 4s.
  const { data: previewStatus } = useGetPreviewStatusQuery(undefined, {
    pollingInterval: previewStatus ? 4000 : 15000,
    skip: typeof window === 'undefined',
  });
  const tracker = previewStatus || {};
  const txItems = tracker.items || {};
  const lastRunning = useRef(null);

  useEffect(() => {
    const running = Boolean(tracker.running);
    if (lastRunning.current === true && running === false) {
      // A generation job just finished — pull fresh preview URLs into the rows.
      refetch();
    }
    lastRunning.current = running;
  }, [tracker.running, refetch]);

  // Failed previews (with reason) from the tracker, most recent first.
  const failedKeys = Object.keys(txItems).filter((k) => txItems[k].status === 'failed');
  const productNameById = Object.fromEntries(products.map((p) => [p._id, p.name]));
  const jobBusy = Boolean(tracker.running) || bulkGenerating;
  const progress =
    tracker.total > 0 ? Math.round(((tracker.done + tracker.failed) / tracker.total) * 100) : 0;

  const retryFailed = async (key) => {
    const rec = txItems[key];
    if (!rec) return;
    const { productId } = rec;
    if (productId) {
      try {
        setGeneratingId(productId);
        await generateProductPreview({ id: productId, force: true }).unwrap();
        toast.success('Retrying preview generation…');
      } catch (err) {
        toast.error(err?.data?.message || "Couldn't restart preview generation.");
      } finally {
        setGeneratingId(null);
      }
    }
  };

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
  // The API returns immediately (202); rows + previews update automatically once the
  // backend tracker reports the job finished (see useEffect above).
  const handleGeneratePreview = async (id) => {
    try {
      setGeneratingId(id);
      const res = await generateProductPreview({ id }).unwrap();
      toast.success(res?.message || "Generating on-model preview — this takes a minute or two.");
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
          disabled={jobBusy || missingPreviews === 0}
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
          <MdCheckroom className={jobBusy ? 'animate-pulse' : ''} size={16} />
          {jobBusy
            ? 'Generating…'
            : missingPreviews === 0
              ? 'All previews generated'
              : `Generate ${missingPreviews} missing previews`}
        </button>
      </div>

      {/* [VTON] Live generation progress + failures, polled from the backend tracker. */}
      {jobBusy && (
        <div className="mb-4 rounded-lg border border-gray-700 bg-gray-900 p-3 text-sm text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2">
              <MdCheckroom className="animate-pulse" size={16} />
              Generating previews… {tracker.done || 0} done, {tracker.failed || 0} failed
            </span>
            <span className="text-gray-400">{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-green-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          {tracker.current && (
            <p className="mt-2 text-xs text-gray-400">
              Currently: {productNameById[tracker.current.split(':')[0]] || 'product'} (
              {tracker.current.split(':')[1]})
            </p>
          )}
        </div>
      )}

      {failedKeys.length > 0 && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          <p className="mb-2 font-medium">
            {failedKeys.length} preview(s) failed to generate — usually the free AI service
            being busy or rate-limited. Retry to regenerate just those.
          </p>
          <ul className="space-y-1">
            {failedKeys.map((key) => {
              const rec = txItems[key];
              return (
                <li key={key} className="flex items-center justify-between gap-2 text-xs">
                  <span>
                    {productNameById[rec.productId] || 'Product'} ({rec.gender})
                    {rec.error ? <span className="ml-2 text-red-400/70">— {rec.error}</span> : null}
                  </span>
                  <button
                    onClick={() => retryFailed(key)}
                    className="inline-flex items-center gap-1 rounded bg-red-700/60 px-2 py-1 text-white hover:bg-red-600"
                  >
                    <IoReload size={12} /> Retry
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
            {products.length > 0 ? products.map((item) => {
              // [VTON] Live state for this product from the tracker (working/done/failed).
              // Tracker keys are `${productId}:Male|Female` (canonical); product.genders
              // may use aliases (men/women/man/woman), so match case-insensitively.
              const canonicalFor = (g) => {
                const s = String(g || '').toLowerCase();
                if (['male', 'men', 'man'].includes(s)) return 'Male';
                if (['female', 'women', 'woman'].includes(s)) return 'Female';
                return null;
              };
              const tracked = (item.genders || [])
                .map((g) => canonicalFor(g))
                .filter(Boolean)
                .map((g) => txItems[`${item._id}:${g}`])
                .filter(Boolean);
              const rowWorking = tracked.some((r) => r.status === 'working');
              const rowFailed = tracked.some((r) => r.status === 'failed');
              const rowDone = tracked.some((r) => r.status === 'done');
              return (
              <tr key={item._id} className="border-b hover:bg-gray-50">
                <td className="p-3 flex items-center gap-2 overflow-hidden">
                  <img src={item.images[0]} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  <div className="flex flex-col">
                    <span>{item.name}</span>
                    {(rowWorking || rowFailed || rowDone) && (
                      <span
                        className={`text-[10px] uppercase tracking-wide ${
                          rowWorking
                            ? 'text-yellow-600'
                            : rowFailed
                              ? 'text-red-600'
                              : 'text-green-600'
                        }`}
                      >
                        {rowWorking ? '● generating' : rowFailed ? '● failed' : '● done'}
                      </span>
                    )}
                  </div>
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
            )}) : (
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