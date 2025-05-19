// ProductDetail.jsx
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import womensPyjama from "../assets/images/pyjama.png"
import bHoodie from "../assets/images/blue_hoodie.png"
import kidPyjama from "../assets/images/kid_pyjama.png"
import Button from '../components/Button';
import { MdOutlineShoppingBag } from 'react-icons/md';

const ProductDetail = () => {
  const { id } = useParams();
  // Simulated product data (replace with API call)
  const product = {
    id: 1,
    name: 'Womens 365 Lightweight Short Pyjama',
    price: 25,
    rating: 4.5,
    images: [womensPyjama, kidPyjama, bHoodie],
    colors: ['#000000', '#ffffff', '#be123c'],
    sizes: ['S', 'M', 'L', 'XL'],
  };
 // Track currently displayed main image
  const [selectedImage, setSelectedImage] = useState(product.images[0]);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  return (
    <div className="flex flex-col md:flex-row gap-10 p-6">
      {/* Left: Image Gallery */}
      <div className="md:w-1/2 w-full">
        <img
          src={selectedImage}
          alt={product.name}
          className="w-full h-[500px] object-cover rounded-xl"
        />

        {/* Thumbnail previews */}
        <div className="flex gap-3 mt-4">
          {product.images.map((img, index) => (
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
          {'★'.repeat(Math.floor(product.rating))}
          <span className="text-sm text-gray-500">({product.rating})</span>
        </div>
        <p className="text-xl font-semibold">${product.price}</p>

        {/* Colors */}
        <div className="flex items-center gap-2">
          {product.colors.map((color, idx) => (
            <span
              key={idx}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-full border-2 cursor-pointer ${selectedColor === color ?'border-black' : 'border-transparent'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Sizes */}
        <div>
           <p>Size:</p>

        <div className="flex flex-wrap gap-3">
          {product.sizes.map((size, idx) => (
            <span
              key={idx}
              className="border px-4 py-2 rounded cursor-pointer hover:bg-gray-200"
            >
              {size}
            </span>
          ))}
        </div>
        </div>
          

        {/* Add to Cart */}
        <div className='flex items-center'>
          <Button
          label="Add to Cart"
          className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800"
          onClick={() => console.log('Added to cart')}
        />
        <Link to="/cart"
         className="ml-4 text-black">
          <MdOutlineShoppingBag size={30} className="hover:cursor-pointer"/>
         </Link>
        </div>
      
      </div>
    </div>
  );
};

export default ProductDetail;