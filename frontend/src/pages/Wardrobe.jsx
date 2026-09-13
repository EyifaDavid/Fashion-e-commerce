import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { MdOutlineShoppingBag, MdCheckroom } from 'react-icons/md';
import { toast } from 'sonner';
import { useGetProductsQuery } from '../redux/slices/api/productApiSlice';
import { addToCart } from '../redux/slices/cartSlice';
import Button from '../components/Button';

// [VTON] Wardrobe / dressing-room.
// A dedicated section where shoppers pick garments and see them on a FIXED reference
// model (male / female). It is powered ENTIRELY by the pre-generated on-model previews
// (product.modelPreviewMale / modelPreviewFemale), so swapping is instant, makes no API
// call, and costs nothing. One garment at a time (single-garment try-on), per the
// approved design. Products without a preview for the chosen model simply don't appear
// on the rack — so there is never a broken image or a wait. The personalized "see it on
// yourself" upload flow is untouched and still lives on the product page.

const GENDERS = [
  { key: 'Female', label: 'Female', field: 'modelPreviewFemale' },
  { key: 'Male', label: 'Male', field: 'modelPreviewMale' },
];

const priceFmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

const Wardrobe = () => {
  const { data: response, isLoading } = useGetProductsQuery();
  // Stable identity so the useMemo hooks below don't recompute every render.
  const products = useMemo(() => response?.data || [], [response]);

  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const [modelGender, setModelGender] = useState('Female');
  const [category, setCategory] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const didInit = useRef(false);

  const previewField =
    GENDERS.find((g) => g.key === modelGender)?.field || 'modelPreviewFemale';

  // How many looks each model has — used to pick a sensible default model on first load.
  const previewCounts = useMemo(() => {
    const counts = { Female: 0, Male: 0 };
    for (const p of products) {
      if (p.modelPreviewFemale) counts.Female += 1;
      if (p.modelPreviewMale) counts.Male += 1;
    }
    return counts;
  }, [products]);

  // On first successful load, default to whichever model actually has looks.
  useEffect(() => {
    if (didInit.current || isLoading || products.length === 0) return;
    didInit.current = true;
    if (previewCounts.Female === 0 && previewCounts.Male > 0) setModelGender('Male');
  }, [isLoading, products.length, previewCounts]);

  // The rack: garments that have a preview on the current model, optionally by category.
  const rack = useMemo(
    () =>
      products
        .filter((p) => p[previewField])
        .filter(
          (p) =>
            category === 'All' ||
            (p.category || '').toLowerCase() === category.toLowerCase()
        ),
    [products, previewField, category]
  );

  // Category chips built from whatever has a preview on the current model.
  const categories = useMemo(() => {
    const set = new Set(
      products.filter((p) => p[previewField]).map((p) => p.category).filter(Boolean)
    );
    return ['All', ...set];
  }, [products, previewField]);

  // Reset category if the current one has no looks on the newly selected model.
  useEffect(() => {
    if (category !== 'All' && !categories.includes(category)) setCategory('All');
  }, [categories, category]);

  // Keep a valid selection: if the worn item drops out of the rack, wear the first one.
  useEffect(() => {
    if (rack.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!rack.some((p) => p._id === selectedId)) setSelectedId(rack[0]._id);
  }, [rack, selectedId]);

  const selected = rack.find((p) => p._id === selectedId) || null;

  const handleAddToCart = () => {
    if (!selected) return;
    const inCart = cartItems.find((i) => i.id === selected._id);
    if (selected.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }
    if (inCart && inCart.quantity >= selected.stock) {
      toast.error('Not enough stock available');
      return;
    }
    dispatch(addToCart({ productId: selected._id, quantity: 1 }));
    toast.success('Added to cart');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
      </div>
    );
  }

  const noLooksAnywhere = previewCounts.Female === 0 && previewCounts.Male === 0;

  return (
    <div className="p-4 md:p-6">
      {/* Header + model toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <MdCheckroom size={26} />
          <h1 className="text-2xl font-bold">Wardrobe</h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Model:</span>
          {GENDERS.map((g) => (
            <button
              key={g.key}
              onClick={() => setModelGender(g.key)}
              className={`px-4 py-1.5 rounded-full text-sm border transition ${
                modelGender === g.key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-black border-gray-300 hover:bg-gray-100'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {noLooksAnywhere ? (
        <div className="text-center py-20 text-gray-500">
          <MdCheckroom size={48} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No on-model looks yet.</p>
          {user?.isAdmin ? (
            <p className="text-sm mt-1">
              Generate them from{' '}
              <Link to="/admin/inventory" className="text-blue-600 underline">
                Inventory
              </Link>
              .
            </p>
          ) : (
            <p className="text-sm mt-1">Check back soon — we're preparing the fitting room.</p>
          )}
        </div>
      ) : (
        <>
          {/* Category chips */}
          {categories.length > 1 && (
            <div className="mb-6 overflow-x-auto">
              <div className="flex gap-2 md:gap-3 min-w-max">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm border whitespace-nowrap capitalize ${
                      category === cat
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Model stage — the garment worn by the reference model */}
            <div className="lg:w-1/2 w-full">
              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-center min-h-[420px]">
                {selected ? (
                  <img
                    src={selected[previewField]}
                    alt={`${selected.name} on ${modelGender} model`}
                    onError={(e) => {
                      // Degrade to the flat product photo if a preview URL is ever broken.
                      const fb = selected.images?.[0];
                      if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb;
                    }}
                    className="max-h-[560px] w-auto object-contain rounded-xl"
                  />
                ) : (
                  <p className="text-gray-400 text-sm text-center px-6">
                    No looks for the {modelGender} model yet — try the other model above.
                  </p>
                )}
              </div>

              {selected && (
                <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.name}</h2>
                    <p className="text-gray-600">{priceFmt(selected.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      label="Add to Cart"
                      icon={<MdOutlineShoppingBag size={16} className="ml-2" />}
                      className="bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 flex items-center"
                      onClick={handleAddToCart}
                    />
                    <Link
                      to={`/product/${selected._id}`}
                      state={{ product: selected }}
                      className="px-5 py-2.5 rounded-full border border-gray-300 text-sm hover:bg-gray-100"
                    >
                      View product
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Rack — every garment available on this model. Tap to wear it. */}
            <div className="lg:w-1/2 w-full">
              <p className="text-sm text-gray-500 mb-3">
                {rack.length} {rack.length === 1 ? 'look' : 'looks'} for the {modelGender} model
                {category !== 'All' ? ` in ${category}` : ''}. Tap to try it on.
              </p>

              {rack.length === 0 ? (
                <p className="text-gray-400 text-sm">Nothing here yet.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[620px] overflow-y-auto pr-1">
                  {rack.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => setSelectedId(p._id)}
                      title={p.name}
                      className={`group rounded-lg overflow-hidden border-2 transition ${
                        selectedId === p._id
                          ? 'border-black'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <div className="bg-gray-50 aspect-[3/4] flex items-center justify-center">
                        <img
                          src={p[previewField]}
                          alt={p.name}
                          onError={(e) => {
                            const fb = p.images?.[0];
                            if (fb && e.currentTarget.src !== fb) e.currentTarget.src = fb;
                          }}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-1.5 text-left">
                        <p className="text-[11px] font-medium truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-500">{priceFmt(p.price)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Wardrobe;
