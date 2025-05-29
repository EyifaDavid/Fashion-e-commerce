import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import Button from '../components/Button';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/slices/cartSlice';
import { MdOutlineShoppingBag } from 'react-icons/md';
import { useGetProductByIdQuery } from '../redux/slices/api/productApiSlice';

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
      setSelectedImage(product.images?.[0] || '');
      setSelectedColor(product.colors?.[0] || '');
      setSelectedSize(product.sizes?.[0] || '');
    }
  }, [product]);

    const dispatch = useDispatch();

  const handleAddToCart = () => {
    if (!product) return;

    const item = {
      id: product._id,
      name: product.name,
      price: product.price,
      image: selectedImage,
      countInStock: product.stock,
    };

    dispatch(addToCart(item));
  };

 if (isLoading) return (
  <div className="flex items-center justify-center h-screen">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
  </div>
);

  if (error) return <p>Error loading product</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div className="flex flex-col min-h-screen md:flex-row gap-10 p-6">
      {/* Left: Image Gallery */}
      <div className="md:w-1/2 w-full">
        <img
          src={selectedImage}
          alt={product.name}
          className="w-full h-[500px] object-contain rounded-xl"
        />

        {/* Thumbnail previews */}
        <div className="flex justify-center  gap-3 mt-4">
          {product.images?.map((img, index) => (
            <img
              key={index}
              src={img}
              onClick={() => setSelectedImage(img)}
              className={`w-16 h-16 object-cover rounded cursor-pointer border-2 ${
                selectedImage === img ? 'border-black' : 'border-transparent'
              }`}
              alt={`Preview ${index + 1}`}
            />
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
      </div>
    </div>
  );
};

export default ProductDetail;
