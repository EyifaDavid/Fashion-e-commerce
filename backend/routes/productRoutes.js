// const express = require('express');
// const router = express.Router();
// const { getAllProducts, getProductById, addProduct, deleteProduct } = require('../controllers/productController');
import express from "express";
import { getAllProducts, getProductById, addProduct, deleteProduct, updateProduct, generateProductPreview } from "../controllers/productController.js"
import { isAdminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.put('/:id', protectRoute,isAdminRoute, updateProduct)


router.post('/', protectRoute,isAdminRoute, addProduct);

// [VTON] Admin-only: (re)generate a product's pre-generated on-model preview(s).
router.post('/:id/generate-preview', protectRoute, isAdminRoute, generateProductPreview);



router.delete('/:id', protectRoute,isAdminRoute, deleteProduct);

export default router
