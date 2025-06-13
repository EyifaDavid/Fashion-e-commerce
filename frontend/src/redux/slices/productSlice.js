import { createSlice } from "@reduxjs/toolkit";
import womensPyjama from "../../assets/images/pyjama.png";
import bHoodie from "../../assets/images/blue_hoodie.png";
import kidPyjama from "../../assets/images/kid_pyjama.png";
import pHoodie from "../../assets/images/pink.png"
import gHoodie from "../../assets/images/Green.png"
import kidHoodie from "../../assets/images/kid_hoodie.png"



const initialState = {
  allProducts: [
    {
      id: 1,
      name: "Blue Hoodie",
      price: 30,
      stock: 10,
      images: [bHoodie],
      category: "Hoodies",
      genders: ["Male", "Female"],
      sizes: ["S", "M", "L"],
      noColors: "3",
      colors: ["#000000", "#ffffff", "#be123c"],
    },
    {
      id: 2,
      name: "Women’s Pyjama",
      price: 25,
      stock: 8,
      images: [womensPyjama],
      category: "Pyjamas",
      genders: ["Female"],
      sizes: ["S", "M"],
      noColors: "3",
      colors: ["#000000", "#ffffff", "#be123c"],
    },
    {
      id: 3,
      name: "Kids Pyjama",
      price: 20,
      stock: 15,
      images: [kidPyjama],
      category: "Pyjamas",
      genders: ["Male", "Female"],
      sizes: ["XS", "S"],
      noColors: "3",
      colors: ["#000000", "#ffffff", "#be123c"],
    },
      // { id: 4, name: "Womens 365 Lightweight Short Pyjama", price: 25, image: [womensPyjama] , noColors: "3", colors: ['#000000', '#ffffff', '#be123c'], countInStock: 5,},
      // { id: 4, name: "Denim Jacket", price: 25, image: [kidPyjama] ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'],countInStock: 5, },
      // { id: 5, name: "Sneakers", price: 80, image: [bHoodie] ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'] ,countInStock: 5,},
      // { id: 7, name: "Jeans", price: 50, image: [pHoodie] ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'],countInStock: 5, },
      // { id: 8, name: "Cap", price: 15, image: [kidHoodie] ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'],countInStock: 5,},
      // { id: 9, name: "Cap1", price: 15, image: [gHoodie] ,  noColors: "3", colors: ['#000000', '#ffffff', '#be123c'],countInStock: 5,},
    
  ],
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    addProduct: (state, action) => {
      state.allProducts.push({ id: Date.now(), ...action.payload });
  },
    deleteProduct: (state, action) => {
      state.allProducts = state.allProducts.filter(
        (product) => product.id !== action.payload
      );
    },
    updateProduct: (state, action) => {
      const index = state.allProducts.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.allProducts[index] = action.payload;
      }
    },
  },
});

export const { addProduct, deleteProduct, updateProduct } = productSlice.actions;
export default productSlice.reducer;
