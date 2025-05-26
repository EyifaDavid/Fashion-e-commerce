import React from 'react';
import AddProductForm from '../../components/AddProductForm';
import Button from '../../components/Button';
import { IoCheckmark } from 'react-icons/io5';
import { FaDraft2Digital, FaFirstdraft } from 'react-icons/fa';
import { MdOutlineDrafts } from 'react-icons/md';


const ProductManagement = () => {

  return (
    <main>
      <div className=" flex justify-between text-center item-center p-2 mb-4">
      <h1 className="text-xl text-white font-bold mb-4">Add New Product</h1>
      <div className='flex flex-colmd:flex-row gap-4 items-center'>
        <Button
        label="Save Draft"
        type="submit"
        icon=<MdOutlineDrafts/>
        className="flex justify-center items-center gap-2 border rounded-full cursor-pointer text-sm hover:bg-white hover:text-[#002fa7]"
        />
        <Button
        label="Add Product"
        type="submit"
        icon= <IoCheckmark/>
        className=" flex justify-center gap-2 items-center rounded-full cursor-pointer hover:opacity-60 text-sm bg-[#002fa7] text-white"
        />
      </div>
    </div>

      <div>
        <AddProductForm/>
      </div>

    </main>

    
  );
};

export default ProductManagement;
