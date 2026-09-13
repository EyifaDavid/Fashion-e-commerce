
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
  // [VTON] Optional dedicated garment shot for virtual try-on (a clean, front-facing image
  // works best). Falls back to images[0] when empty. See tryonController.resolveGarment.
  garmentImage: { type: String, default: "" },
  // [VTON] Pre-generated "on-model" previews: the product's garment composited onto a fixed
  // reference model (one per gender), generated once and shown to every visitor by default.
  // Empty until generated; the product page falls back to images[0] when empty. These are
  // NOT the per-customer "see it on yourself" result (that is never persisted). Generated
  // per the product's `genders` — a Male-only product only fills modelPreviewMale, etc.
  modelPreviewMale: { type: String, default: "" },
  modelPreviewFemale: { type: String, default: "" },
  sizes: [{ type: String }], // e.g., ['S', 'M', 'L', 'XL']
  genders: [{type:String}],
  colors: [{ type: String }], // e.g., ['red', 'blue', 'green']
  noColors: {type: Number, default:0},
  stock: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  isTrashed: { type: Boolean, default: false },
  discount: { type: Number, default: 0 }, // Percentage discount, e.g., 20 for 20% off
  specialOffer: { type: Boolean, default: false }, // True if on special offer

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

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);;

export default Product;
