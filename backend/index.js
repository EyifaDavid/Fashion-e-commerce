import express from "express";
import cors from "cors";
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import multer from "multer";
import cloudinary from "./utils/cloudinary.js"
import fs from "fs";
import morgan from "morgan";
import dotenv from "dotenv";
import dbConnection from "./utils/index.js";
import cookieParser from "cookie-parser";
import { errorHandler, routeNotFound } from "./middleware/errorMiddleware.js";
import routes from "./routes/index.js"
import Replicate from "replicate";


// const express = require('express');
// const cors = require('cors');
// const productRoutes = require('./routes/productRoutes');
// const userRoutes = require('./routes/userRoutes');
// const multer = require('multer');
// const cloudinary = require('./cloudinary');
// const fs = require('fs');
// const morgan = require('morgan');

dotenv.config()
dbConnection();


const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ dest: 'uploads/' }); // Temporary upload dir

// app.use(cors({
//     origin: ["http://localhost:4000","http://localhost:4001","https://mavraudercollections.netlify.app"],
//     methods: ["GET","POST","PUT","DELETE"],
//     credentials:true,
// }));

const corsOptions = {
  origin: ["https://mavraudercollections.netlify.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));

app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const path = req.file.path;

    const result = await cloudinary.uploader.upload(path, {
      folder: 'tryon-app', // Optional: folder name in Cloudinary
    });

    fs.unlinkSync(path); // Remove local file after upload

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// app.post('/api/tryon', upload.single('productImage'), async (req, res) => {
//   try {
//     const productPath = req.file.path;

//     // Upload product image to Cloudinary
//     const productUpload = await cloudinary.uploader.upload(productPath, { folder: 'tryon-app' });
//     fs.unlinkSync(productPath);

//     // Use default model image for user
//     const DEFAULT_USER_IMAGE = 'https://res.cloudinary.com/dpxmdtduf/image/upload/v1748711374/I3GOHIZ7CBBV7NPZC2ROV3AG2Q_rna1bv.jpg'; // Replace with your Cloudinary URL

//     // Call Replicate API (with fetch)
//     const replicateResponse = await fetch('https://api.replicate.com/v1/predictions', {
//       method: 'POST',
//       headers: {
//         Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         version: '04k579n4phrm80cmebmbnjx2dc',
//         input: {
//           image: DEFAULT_USER_IMAGE,
//           cloth: productUpload.secure_url,
//         },
//       }),
//     });

//     const replicateData = await replicateResponse.json();

//     if (replicateResponse.ok) {
//       res.json({ generatedImage: replicateData.urls.get });
//     } else {
//       console.error(replicateData);
//       res.status(500).json({ error: 'Replicate API Error' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Try-on failed' });
//   }
// });

// app.post('/tryon', async (req, res) => {
//   try {
//     const { productImage, userImage } = req.body;

//     if (!productImage) {
//       return res.status(400).json({ error: "Product image URL is required" });
//     }

//     // Use a default user image if none provided
//     const userImg = userImage || 'https://res.cloudinary.com/dpxmdtduf/image/upload/v1748711374/I3GOHIZ7CBBV7NPZC2ROV3AG2Q_rna1bv.jpg'; // You can upload a default image or let the user upload

//     // The model and version can be replaced by your specific AI try-on model on Replicate
//     // Example uses subhash25rawat/flux-vton from your earlier message

//     const output = await replicate.run(
//       "subhash25rawat/flux-vton:a02643ce418c0e12bad371c4adbfaec0dd1cb34b034ef37650ef205f92ad6199",
//       {
//         input: {
//           part: "upper_body", // or adapt based on your product category
//           image: userImg,
//           garment: productImage,
//         }
//       }
//     );

//     // output is the URL of the generated try-on image
//     return res.json({ generatedImage: output });

//   } catch (error) {
//     console.error("Error generating try-on image:", error);
//     return res.status(500).json({ error: "Failed to generate try-on image" });
//   }
// });

// Middleware


app.use(express.json());
app.use(express.urlencoded( {extended:true}));
app.use(morgan('dev'));
app.use(cookieParser());


// Routes
app.use("/api", routes)
// app.use('/api/products', productRoutes);
// app.use('/api/users', userRoutes);

app.use(routeNotFound)
app.use(errorHandler)

// Test route
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  console.log("Cookies received:", req.cookies);
  next();
});


// Start server
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
