import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { MdOutlineShoppingBag } from 'react-icons/md';
import TryOnButton from '../components/TryOnButton';
import { useGetProductByIdQuery } from '../redux/slices/api/productApiSlice';
import { toast } from 'sonner';
import store from '../redux/store';

const ProductDetail = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useGetProductByIdQuery(id);
  const product = data?.data;


  // Local state for selected options
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

  // Set defaults when product is loaded
  useEffect(() => {
    if (product) {
      // [VTON] Default to the pre-generated on-model preview when one exists (static image,
      // instant — no API call, no wait), otherwise the regular first product photo.
      const defaultPreview = product.modelPreviewMale || product.modelPreviewFemale || '';
      setSelectedImage(defaultPreview || product.images?.[0] || '');
      setSelectedColor(product.colors?.[0] || '');
      setSelectedSize(product.sizes?.[0] || '');
    }
  }, [product]);

    const dispatch = useDispatch();

const handleAddToCart = () => {
  try {
    if (!product) return;

    const item = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      countInStock: product.stock,
    };

    dispatch(addToCart({ productId: item.id, quantity: 1 }));
    console.log('Cart items:', store.getState().cart.items);
    toast.success("Added to cart");
  } catch (error) {
    console.error("Error in handleAddToCart:", error);
    toast.error("Failed to add to cart");
  }
};


 if (isLoading) return (
  <div className="flex items-center justify-center h-screen">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
  </div>
);

  if (error) return <p>Error loading product</p>;
  if (!product) return <p>Product not found</p>;

  // [VTON] On-model previews (the garment composited onto a fixed reference model) are shown
  // FIRST, ahead of the flat product photos. They exist only for the genders that were
  // generated; when a product has none yet, `thumbs` is just its product images and the main
  // image defaults to images[0] — no broken image, no forced wait.
  const bothPreviews = Boolean(product.modelPreviewMale && product.modelPreviewFemale);
  const thumbs = [
    ...(product.modelPreviewMale
      ? [{ url: product.modelPreviewMale, caption: bothPreviews ? 'Male' : 'On model' }]
      : []),
    ...(product.modelPreviewFemale
      ? [{ url: product.modelPreviewFemale, caption: bothPreviews ? 'Female' : 'On model' }]
      : []),
    ...(product.images || []).map((img) => ({ url: img, caption: '' })),
  ];

  return (
    <div className="flex flex-col min-h-screen md:flex-row gap-10 p-6">
      {/* Left: Image Gallery */}
      <div className="md:w-1/2 w-full">
        <img
          src={selectedImage}
          alt={product.name}
          onError={(e) => {
            // [VTON] If a preview URL is ever broken/expired, degrade to the real product
            // photo rather than showing a broken image. Guard against a fallback loop.
            const fallback = product.images?.[0];
            if (fallback && e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
          }}
          className="w-full h-[500px] object-contain rounded-xl"
        />

        {/* Thumbnails: on-model previews first (captioned), then product photos */}
        <div className="flex justify-center flex-wrap items-start gap-3 mt-4">
          {thumbs.map((t, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedImage(t.url)}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <img
                src={t.url}
                className={`w-16 h-16 object-cover rounded border-2 ${
                  selectedImage === t.url ? 'border-black' : 'border-transparent'
                }`}
                alt={t.caption || `${product.name} ${index + 1}`}
              />
              {t.caption && (
                <span className="text-[10px] leading-none text-gray-500 text-center max-w-[64px]">
                  {t.caption}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right: Product Info */}
      <div className="md:w-1/2 w-full space-y-6">
        <h1 className="text-3xl font-bold">{product.name}</h1>

        <div className="flex items-center gap-2 text-yellow-400">
          {'★'.repeat(Math.floor(product.rating || 0))}
          <span className="text-sm text-gray-500">({product.rating || 0})</span>
        </div>
        <div>
          <p>{product.description}</p>
        </div>

        <p className="text-xl font-semibold">
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(product.price)}
        </p>

        {/* Colors */}
        <div className="flex items-center gap-2">
          {product.colors?.map((color, idx) => (
            <span
              key={idx}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                selectedColor === color ? 'border-black' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Sizes */}
        <div>
          <p>Size:</p>
          <div className="flex flex-wrap gap-3">
            {product.sizes?.map((size, idx) => (
              <span
                key={idx}
                onClick={() => setSelectedSize(size)}
                className={`border px-4 py-2 rounded cursor-pointer hover:bg-gray-200 ${
                  selectedSize === size ? 'bg-black text-white' : 'border-transparent'
                }`}
              >
                {size}
              </span>
            ))}
          </div>
        </div>

        {/* Add to Cart */}
        <div className="flex items-center">
          <Button
            label="Add to Cart"
            className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800"
            onClick={handleAddToCart}
          />
          <Link to="/cart" className="ml-4 text-black">
            <MdOutlineShoppingBag size={30} className="hover:cursor-pointer" />
          </Link>
        </div>

        {/* Virtual Try-On (free HF Space MVP) */}
        <div className="pt-2">
          <TryOnButton
            productId={product._id}
            productName={product.name}
            canTryOn={Boolean(product.garmentImage || product.images?.[0])}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
