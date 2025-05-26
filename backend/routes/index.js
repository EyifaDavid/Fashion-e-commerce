import express from "express";
import userRoutes from "./userRoutes.js"
import productRoutes from "./productRoutes.js"

const router = express.Router();

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});


router.use("/user",userRoutes); //api/user/login
router.use("/product",productRoutes);

export default router