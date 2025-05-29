
import mongoose, { Schema } from "mongoose";

const productSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, },
  price: { type: Number, required: true },
  category: {
    type: String,
    required: true,
    // enum: ["men", "women", "kids", "accessories", "shoes", "other"], // Adjust as needed
  },
  brand: { type: String, default: "No Brand" },
  images: [{ type: String }], // URLs of images stored in Cloudinary
  sizes: [{ type: String }], // e.g., ['S', 'M', 'L', 'XL']
  genders: [{type:String}],
  colors: [{ type: String }], // e.g., ['red', 'blue', 'green']
  noColors: {type: Number, default:0},
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isTrashed: { type: Boolean, default: false },

  activities: [
    {
      type: {
        type: String,
        enum: [
          "added",
          "updated",
          "deleted",
          "price changed",
          "stock updated",
        ],
        default: "added",
      },
      activity: String,
      date: { type: Date, default: new Date() },
      by: { type: Schema.Types.ObjectId, ref: "User" },
    },
  ],

  tags: [{ type: String }],

  reviews: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      date: { type: Date, default: new Date() },
    },
  ],
},
{ timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
