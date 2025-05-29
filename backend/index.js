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
import { apiSlice } from "../frontend/fashion_e-commerce/src/redux/slices/apiSlice.js";
import routes from "./routes/index.js"


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
app.use(cors());

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


// Middleware
app.use(cors({
    origin: ["http://localhost:4000","http://localhost:4001"],
    methods: ["GET","POST","PUT","DELETE"],
    credentials:true,
}));
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
app.get('/', (req, res) => res.send('API is running...'));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});


// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
