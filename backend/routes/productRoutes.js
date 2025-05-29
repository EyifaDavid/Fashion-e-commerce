// const express = require('express');
// const router = express.Router();
// const { getAllProducts, getProductById, addProduct, deleteProduct } = require('../controllers/productController');
import express from "express";
import { getAllProducts, getProductById, addProduct, deleteProduct, updateProduct } from "../controllers/productController.js"

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.put('/:id', updateProduct)


router.post('/', addProduct);



router.delete('/:id', deleteProduct);

export default router
