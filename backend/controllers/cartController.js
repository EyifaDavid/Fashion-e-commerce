import Cart from '../models/Cart.js';
import mongoose from "mongoose";
import Product from "../models/product.js";

export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      return res.status(200).json({ items: [] }); // empty cart
    }

    res.status(200).json({
      items: cart.items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
      })),
    });
 } catch (error) {
  console.error("AddToCart Error:", error);  // log full error
  res.status(500).json({ error: error.message || 'Internal server error' });
}
};



export const addToCart = async (req, res) => {
  const userId = req.user._id; // Assuming user is authenticated
  const { productId, quantity = 1 } = req.body; // Allow quantity to be positive or negative

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity: quantity > 0 ? quantity : 0 }],
      });
    } else {
      const existingItem = cart.items.find((item) =>
        item.productId.equals(productId)
      );

      if (existingItem) {
        existingItem.quantity += quantity;
        if (existingItem.quantity <= 0) {
          // Remove item if quantity drops to 0 or less
          cart.items = cart.items.filter(
            (item) => !item.productId.equals(productId)
          );
        }
      } else if (quantity > 0) {
        cart.items.push({ productId, quantity });
      }
    }
    
    await cart.save();
    await cart.populate("items.productId"); // Populate product details

    res.status(200).json({
      message: "Cart updated",
      items: cart.items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      })),
    });
 } catch (error) {
  console.error("AddToCart Error:", error);  // log full error
  res.status(500).json({ error: error.message || 'Internal server error' });
}
};


export const removeFromCart = async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;

  try {
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => !item.productId.equals(productId)
    );

    await cart.save();
    await cart.populate("items.productId");

    res.status(200).json({
      message: "Item removed",
      items: cart.items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


