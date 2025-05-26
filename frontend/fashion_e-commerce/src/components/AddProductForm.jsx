import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import womensPyjama from "../assets/images/pyjama.png"
import bHoodie from "../assets/images/blue_hoodie.png"
import kidPyjama from "../assets/images/kid_pyjama.png"
import { addProduct } from '../redux/slices/productSlice';
import Textbox from './Textbox';
import { Checkbox, Textarea } from '@headlessui/react';
import { Link } from 'react-router-dom';
import { IoAddCircle } from 'react-icons/io5';
import Button from './Button';
import availableColors from '../utils/colors';
import ColorPicker from './ColorPicker';

const AddProductForm = () => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: '',
    price: '',
    stock: '',
    images: [womensPyjama, kidPyjama, bHoodie],
    genders:['Male','Female'],
    sizes:['XS','S', 'M', 'L', 'XL'],
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newProduct = {
    name: form.name,
    price: form.price,
    stock: form.stock,
    images: form.images,
    colors: selectedColors, // <== ADD THIS
    noColors: selectedColors.length.toString(),
  };
  
    dispatch(addProduct(newProduct));
    setForm({ name: '', price: '', stock: '', image: '' });
    setSelectedColors([]);
  };
    const [categories, setCategories] = useState(['Clothing', 'Accessories', 'Footwear']);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedImage, setSelectedImage] = useState(form.images[0]);
    const [selectedGenders, setSelectedGenders] = useState([]);

    const handleSizeChange = (size) => {
      setSelectedSizes((prev) =>
        prev.includes(size)
          ? prev.filter((s) => s !== size)
          : [...prev, size]
      );
    };
    const handleGenderChange = (gender) => {
      setSelectedGenders((prev) =>
        prev.includes(gender)
          ? prev.filter((g) => g !== gender)
          : [...prev, gender]
      );
    };
    const handleAddCategory = () => {
  if (newCategory && !categories.includes(newCategory)) {
    setCategories([...categories, newCategory]);
    setNewCategory('');
  }
    };

  // const submitHandler = async(data)=>{
  //   console.log("submit")
  // };

  return (
    <div className="w-full min-h-screen flex flex-row md:flex-col lg:flex-col">
  <form onSubmit={handleSubmit} className="form-container w-full md:w-auto flex flex-col md:flex-col lg:flex-row justify-between bg-white px-10 pt-10 pb-14">
     {/*left section*/}
     <div className='md:w-1/2'>
    <h1 className='font-semibold mb-2'>General Information</h1>
    <Textbox
    placeholder="Product name"
    name="Name-Product"
    type="name"
    label="Product Name"
    value= {form.name}
    onchange={handleChange}
    className="w-full rounded text-sm focus:ring-2 ring-blue-500"
    />
    <div className='mt-3'>
      <h2 className='text-slate-800'>Description</h2>
      <textarea
          rows={5}
          value= ""
          onChange={handleChange}
          placeholder='Type .....'
          className='bg-white w-full border border-gray-300 outline-none p-4 rounded-md focus:ring-2 ring-blue-500'
          ></textarea>
    </div>

       {/*Size and Gender Selection*/}
      <div className='flex flex-col md:flex-row gap-10 mt-3'>
      <div>
      <h2>Size</h2>
      <p className='text-xs text-gray-500'>Pick Available Size</p>
        <div className="flex pt-2 flex-wrap gap-2">
            {form.sizes.map((size, idx) => (
              <span
                key={idx}
                onClick={()=> handleSizeChange(size)}
                className={`border px-3 py-2 rounded cursor-pointer hover:bg-blue-200 ${selectedSizes.includes(size) ? 'bg-[#002fa7] text-white':'border-transparent'}`}
              >
                {size}
              </span>
            ))}
          </div>
      </div>

      <div>
        <h2>Gender</h2>
      <p className='text-xs text-gray-500'>Pick Available Gender</p>
            <div className="flex items-center gap-2 pt-3">
            {form.genders.map((gender, index)=>(
            <label key={index} className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedGenders.includes(gender)}
                onChange={() => handleGenderChange(gender)}
              />
              <span className={`px-2 py-1 rounded ${selectedGenders.includes(gender) }`}>
                {gender}
              </span>
            </label>
            ))}
            </div>
      </div>

      </div>
       {/*Pricing and Stock*/}
       <div className='mt-10'>
    <h1 className='font-semibold mb-2'>Pricing And Stock</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <Textbox
            label="Price"
            type="number"
            placeholder="Price"
            className="rounded w-full text-sm focus:ring-2 ring-blue-500"
          />
          <Textbox
            label="Stock"
            type="number"
            placeholder="Amount in Stock"
            className="rounded w-full text-sm focus:ring-2 ring-blue-500"
          />
          <Textbox
            label="Discount"
            type="number"
            placeholder="Price"
            className="rounded w-full text-sm focus:ring-2 ring-blue-500"
          />
          <Textbox
            label="Price"
            type="number"
            placeholder="Price"
            className="rounded w-full text-sm focus:ring-2 ring-blue-500"
          />
        </div>
       </div>
        {/*Color Selection*/}
       <ColorPicker
        availableColors={availableColors}
        selectedColors={selectedColors}
        setSelectedColors={setSelectedColors}
      />
       </div>


      {/*right section*/}
      <div>
              {/*upload img section*/}
         <div className='md:pt-0 pt-10'>
          <div className=" w-full">
            <h1 className='font-bold pb-4'>Upload Image</h1>
        <img
          src={selectedImage}
          alt={form.name}
          className="w-full h-[300px] bg-blue-500 object-cover rounded-xl"
        />

        {/* Thumbnail previews */}
        <div className="flex gap-3 mt-4">
          {form.images.map((img, index) => (
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
          <div className='w-16 h-16 flex justify-center items-center border border-dashed rounded'>
            <Link>
            <IoAddCircle/>
            </Link>
          </div>
        </div>
      </div>

         </div>
           {/*prod category section*/}
         <div className='mt-15'>
          <h1 className='font-bold pb-4'>Category</h1>
          <Textbox
          label="Product Category"
          type=""
          placeholder="Choose/Create a Category"
          className="w-full rounded"
          />
          <Button
          label="Add Category"
          type="submit"
          className="mt-3 text-white text-sm hover:opacity-60 rounded-full bg-[#002fa7]"

          />
          </div> 
      </div>
    </form>
 
    </div>
   );
};

export default AddProductForm;