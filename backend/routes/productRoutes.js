// const express = require('express');
// const router = express.Router();
// const { getAllProducts, getProductById, addProduct, deleteProduct } = require('../controllers/productController');
import express from "express";
import { getAllProducts, getProductById, addProduct, deleteProduct, updateProduct, generateProductPreview, generateAllProductPreviews } from "../controllers/productController.js"
import { isAdminRoute, protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get('/', getAllProducts);
router.get('/:id', getProductById);

router.put('/:id', protectRoute,isAdminRoute, updateProduct)


router.post('/', protectRoute,isAdminRoute, addProduct);

// [VTON] Admin-only: bulk generate ALL missing on-model previews across the catalog.
// Must be above /:id routes to avoid being caught by the param matcher.
router.post('/bulk-generate-previews', protectRoute, isAdminRoute, generateAllProductPreviews);

// [VTON] Admin-only: (re)generate a product's pre-generated on-model preview(s).
router.post('/:id/generate-preview', protectRoute, isAdminRoute, generateProductPreview);



router.delete('/:id', protectRoute,isAdminRoute, deleteProduct);

export default router
