import React, { useEffect, useState } from 'react';
import Textbox from './Textbox';
import { Checkbox, Textarea } from '@headlessui/react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { IoAddCircle, IoCheckmark } from 'react-icons/io5';
import Button from './Button';
import availableColors from '../utils/colors';
import ColorPicker from './ColorPicker';
import { MdOutlineDrafts } from 'react-icons/md';
import { useForm } from "react-hook-form";
import { useAddProductMutation, useGetProductsQuery, useUpdateProductMutation } from '../redux/slices/api/productApiSlice';
import { toast } from 'sonner';
import allSizes from '../utils/sizes';
import allGenders from '../utils/genders';


const AddProductForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const existingProduct = location.state?.product || null;
  const [formData, setFormData] = useState({
  name: existingProduct?.name || '',
    description: existingProduct?.description || '',
    price: existingProduct?.price || '',
    stock: existingProduct?.stock || '',
    discount:existingProduct?.discount || '',
    colors: existingProduct?.colors || [],
    sizes: existingProduct?.sizes || ['XS','S','M','L','XL'],
    category: existingProduct?.category || '',
    genders: existingProduct?.genders || ['Male',"Female"],
    images: existingProduct?.images || [],
  });

 const defaultValues = {
  name: "",
  price: 0,
  description: "",
  stock: 0,
  category: "",
  colors: [],
  sizes: [],
  genders: [],
  images: [],
  discount: 0,
};

const {
  register,
  handleSubmit,
  reset,
  formState: { errors },
} = useForm({ defaultValues });

const [addProduct, {isLoading: isAdding}] = useAddProductMutation();
const [updateProduct, {isLoading: isUpdating}] = useUpdateProductMutation();


const submitHandler = async (data) => {
  const productData = {
    ...data,
    category: selectedCategory,
    colors: selectedColors,
    sizes: selectedSizes,
    genders: selectedGenders,
    images: images,
    noColors: selectedColors.length.toString(),
  };

  try {
    if (id) {
      // Editing existing product
      await updateProduct({ id, productData }).unwrap();
      toast.success("Product updated successfully!");
      navigate('/admin/inventory');
    } else {
      // Adding new product
      const response = await addProduct(productData).unwrap();
      toast.success("Product added successfully!");
    }

    reset();
    setImages([]);
    setSelectedImage(null);
    setSelectedCategory('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedGenders([]);

  } catch (error) {
    console.error("Error:", error);
    toast.error(error?.data?.message || error.message || "Error processing product");
  }
};


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
 
    const [categories, setCategories] = useState(['Clothing', 'Accessories', 'Footwear']);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
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
    const handleAddImage = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      try {
        const urls = await Promise.all(files.map(handleUploadImage));

        setImages((prev) => [...prev, ...urls]);

        if (!selectedImage) {
          setSelectedImage(urls[0]);
        }

      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error('Failed to upload image. Please try again.');
      }
    };
    const handleAddCategory = () => {
  if (newCategory && !categories.includes(newCategory)) {
    setCategories([...categories, newCategory]);
    setSelectedCategory(newCategory); // auto-select the new category
    setNewCategory('');
  }
    };
  const handleUploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'fashion_store_uploads'); // your Cloudinary preset

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/dpxmdtduf/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      return data.secure_url; // Cloudinary returns this
    } catch (error) {
      console.error('Image upload failed', error);
      throw error;
    }
      };



  useEffect(() => {
  if (id) {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      const product = data.data;

      setFormData(product);
      reset({
        name: product.name,
        price: product.price,
        description: product.description,
        stock: product.stock,
        discount:product.discount,
        category: product.category,
        colors: product.colors,
        sizes: product.sizes,
        genders: product.genders,
        images: product.images,
      });
      setSelectedColors(product.colors || []);
      setSelectedSizes(product.sizes || []);
      setSelectedGenders(product.genders || []);
      setSelectedCategory(product.category || '');
      setImages(product.images || []);
      setSelectedImage(product.images?.[0] || null);
      
    };
    fetchProduct();
  }
}, [id, reset]);

   
  if (isAdding || isUpdating) return (
  <div className="flex items-center justify-center h-screen">
    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-gray-400"></div>
  </div>
);

  return (
    <div className="w-full min-h-screen flex flex-row md:flex-col lg:flex-col">
  <form onSubmit={handleSubmit(submitHandler)} className="form-container w-full md:w-auto flex flex-col md:flex-col lg:flex-row justify-between bg-white px-10 pt-10 pb-14">
     {/*left section*/}
     <div className='md:w-1/2'>
    <h1 className='font-semibold mb-2'>General Information</h1>
    <Textbox
    placeholder="Product name"
    name="name"
    type="text"
    label="Product Name"
    register={register("name", { required: "Product name is required" })}
    error={errors.name ? errors.name.message : ""}
    className="w-full rounded text-sm focus:ring-2 ring-blue-500"
    />
    <div className='mt-3'>
      <h2 className='text-slate-800'>Description</h2>
      <textarea
          name="description"
          rows={5}
          placeholder="Type description..."
          {...register("description", { required: "Description is required" })}
          className="w-full border border-gray-300 outline-none p-4 rounded-md focus:ring-2 focus:ring-blue-500'"
        />
        {errors.description && <p className="text-red-500">{errors.description.message}</p>}
    </div>

       {/*Size and Gender Selection*/}
      <div className='flex flex-col md:flex-row gap-10 mt-3'>
      <div>
      <h2>Size</h2>
      <p className='text-xs text-gray-500'>Pick Available Size</p>
        <div className="flex pt-2 flex-wrap gap-2">
            {allSizes.map((size, idx) => (
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
            {allGenders.map((gender, index)=>(
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
            name="price"
            placeholder="Price"
            register={register("price", { required: "Price is required", valueAsNumber: true })}
            error={errors.price ? errors.price.message : ""}
            className="rounded w-full text-sm focus:ring-2 ring-blue-500"
          />
          <Textbox
            label="Stock"
            type="number"
            name="stock"   // FIX
            placeholder="Amount in Stock"
            register={register("stock", { required: "Amount in stock is required" })}
            error={errors.name ? errors.name.message : ""}
            className="rounded w-full text-sm focus:ring-2 ring-blue-500"
          />
          <Textbox
            label="Discount"
            type="number"
            name="discount"
            register={register("discount",{valueAsNumber:true})}
            error={errors.discount ? errors.discount.message : ""}
            placeholder="Discount"
            className="rounded w-full text-sm focus:ring-2 ring-blue-500"
          />
          {/* <Textbox
            label="Price"
            type="number"
            placeholder="Price"
            className="rounded w-full text-sm focus:ring-2 ring-blue-500"
          /> */}
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
      {/* Upload Image Section */}
  <div className='md:pt-0 pt-10'>
    <div className="w-full">
      <h1 className='font-bold pb-4'>Upload Image</h1>

    {/* Main Image */}
    <img
      src={selectedImage || 'https://via.placeholder.com/300'} // fallback
      alt={formData.name || 'Product Image'}
      className="w-full h-[300px] bg-gray-100 object-contain rounded-xl"
    />

    {/* Thumbnail Previews */}
    <div className="flex gap-3 mt-4">
      {images.map((img, index) => (
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

      {/* Add Image Button */}
      <div className='w-16 h-16 flex justify-center items-center border border-dashed rounded'>
        <label htmlFor="imageUpload" className="cursor-pointer">
          <IoAddCircle size={24} />
        </label>
      </div>

      <input
        type="file"
        id="imageUpload"
        multiple
        accept=".jpg, .png, .jpeg"
        onChange={handleAddImage}
        className="hidden"
      />
    </div>
  </div>
</div>

           {/*prod category section*/}
        <div className="mt-15">
          <h1 className='font-bold pb-4'>Category</h1>

          {/* Select from existing categories */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded outline-none border-gray-300 p-2 border"
          >
            <option value="">Select a category</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Add a new category */}
          <div className="flex mt-2 gap-2">
            <input
              type="text"
              placeholder="New Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full border-gray-300 outline-none rounded-md p-2 border"
            />
              <Button
              type="button" 
              label="Add Category"
              onClick={handleAddCategory}
              className="text-sm text-white px-3 py-2 rounded bg-[#002fa7]"
            />
            
                </div>
              </div>
         {/*Add product and save draft*/}
            <div className='flex flex-colmd:flex-row mt-10 p-10 gap-4 items-center'>
              <Button
              label="Save Draft"
              type="submit"
              icon=<MdOutlineDrafts/>
              className="flex justify-center items-center gap-2 border rounded-full cursor-pointer text-sm hover:bg-white hover:text-[#002fa7]"
              />
              <Button
              label={id ? "Update Product" : "Add Product"}
              type="submit"
              icon= <IoCheckmark/>
              className=" flex justify-center gap-2 items-center rounded-full cursor-pointer hover:opacity-60 text-sm bg-[#002fa7] text-white"
              />
            </div>
      </div>
    </form>
 
    </div>
   );
};

export default AddProductForm;