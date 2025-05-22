import React from 'react';
import AddProductForm from '../../components/AddProductForm';


const ProductManagement = () => {

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Add New Product</h2>
      <AddProductForm />
    </div>
  );
};

export default ProductManagement;
