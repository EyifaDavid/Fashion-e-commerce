const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, addProduct, deleteProduct } = require('../controllers/productController');



router.get('/', getAllProducts);
router.get('/:id', getProductById);


router.post('/', addProduct);



router.delete('/:id', deleteProduct);

module.exports = router;
