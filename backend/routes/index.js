import express from "express"
import productRoutes from "./productRoutes.js";
import userRoutes from "./userRoutes.js";
import uploadRoutes from "./uploadRoutes.js";

const router = express.Router();

router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);


export default router;