import express from "express"
import productRoutes from "./productRoutes.js";
import userRoutes from "./userRoutes.js";
import uploadRoutes from "./uploadRoutes.js";
import authRoutes from "./authRoutes.js";

const router = express.Router();

router.use('/products', productRoutes);
router.use('/user', userRoutes);
router.use('/upload', uploadRoutes);
router.use('/auth', authRoutes);


export default router;