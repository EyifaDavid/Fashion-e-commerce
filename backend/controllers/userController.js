const products = require('../data/products');

let productData = [...products]; // To allow mutations

// GET all products
const getAllProducts = (req, res) => {
  res.json(productData);
};

// GET single product by id
const getProductById = (req, res) => {
  const product = productData.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
};

// POST add a product
const addProduct = (req, res) => {
  const { name, price, image, colors, countInStock, category } = req.body;
  const newProduct = {
    id: productData.length + 1,
    name,
    price,
    image,
    colors,
    countInStock,
    category
  };
  productData.push(newProduct);
  res.status(201).json(newProduct);
};

// DELETE product
const deleteProduct = (req, res) => {
  const id = parseInt(req.params.id);
  productData = productData.filter(p => p.id !== id);
  res.json({ message: `Product ${id} deleted` });
};

module.exports = { getAllProducts, getProductById, addProduct, deleteProduct };
