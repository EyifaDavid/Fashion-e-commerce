import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  // clearCart,
} from "../controllers/cartController.js";
import { protectRoute } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protectRoute, getCart);
router.post("/", protectRoute, addToCart);
router.delete("/:productId", protectRoute, removeFromCart);
// router.delete("/", protectRoute, clearCart);

export default router;
