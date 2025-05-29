import Product from "../models/product.js";
import cloudinary from '../utils/cloudinary.js';

// GET all products
export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      status: true,
      message: 'All products fetched successfully.',
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// GET single product by id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        status: false,
        message: 'Product not found.',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Product fetched successfully.',
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// POST add a product
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      images,
      colors,
      sizes,
      genders,
      category,
      noColors,
    } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      images,
      colors,
      sizes,
      genders,
      category,
      noColors,
    });

    await newProduct.save();

    res.status(201).json({
      status: true,
      message: 'Product added successfully',
      data: newProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// DELETE product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        status: false,
        message: 'Product not found.',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};
//Update Product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validation

      
    });

    if (!updatedProduct) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    res.status(200).json({
      
      status: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// Upload image
export const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'fashion-ecommerce' },
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Upload failed' });
        } else {
          return res.status(200).json({ url: result.secure_url });
        }
      }
    );

    result.end(file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
