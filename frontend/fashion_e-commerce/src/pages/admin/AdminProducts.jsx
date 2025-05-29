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
    </div>

      <div>
        <AddProductForm/>
      </div>

    </main>

    
  );
};

export default ProductManagement;
