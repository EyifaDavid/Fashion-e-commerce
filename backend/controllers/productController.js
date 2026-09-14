import Product from "../models/product.js";
import cloudinary from '../utils/cloudinary.js';
import { refreshProductPreviews, resolveGarment, generateAllMissingPreviews, getPreviewGenerationStatus } from "../utils/modelPreview.js";

// // GET all products
// export const getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.set('Cache-Control', 'no-store');
//     res.status(200).json({
//       status: true,
//       message: 'All products fetched successfully.',
//       data: products,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(400).json({ status: false, message: error.message });
//   }
// };

// GET all products with filtering
export const getAllProducts = async (req, res) => {
  try {
    const { gender, category, discount } = req.query;

    let filter = {};

      // Map gender values
    const genderMap = {
      men: "Male",
      male: "Male",
      women: "Female",
      female: "Female"
    };

    if (gender) {
      const mappedGender = genderMap[gender.toLowerCase()];
      if (mappedGender) {
        filter.genders = mappedGender; // Direct match, no regex needed
      }
    }

    if (category) {
      filter.category = category.toLowerCase();
    }

     if (discount === "true") {
      filter.discount = { $gt: 0 };
    }

    const products = await Product.find(filter);
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      status: true,
      message: 'Products fetched successfully.',
      data: products,
      
    });
  } catch (error) {

    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};



// GET single product by id
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        status: false,
        message: 'Product not found.',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Product fetched successfully.',
      data: product,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// POST add a product
export const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      images,
      colors,
      sizes,
      discount,
      genders,
      category,
      noColors,
      garmentImage, // [VTON] optional; falls back to images[0] at try-on time
    } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const newProduct = new Product({
      name,
      description,
      price,
      stock,
      images,
      colors,
      sizes,
      genders,
      category,
      discount,
      noColors,
      garmentImage,
    });

    await newProduct.save();

    // [VTON] Fire-and-forget on-model preview generation for the product's genders.
    // Never awaited: it takes ~30s–2min per image on the free Space and must not
    // block or fail the create. Falls back silently if there's no garment yet.
    refreshProductPreviews(newProduct._id).catch((err) =>
      console.error("[modelPreview] post-add generation failed:", err?.message)
    );

    res.status(201).json({
      status: true,
      message: 'Product added successfully',
      data: newProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// DELETE product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({
        status: false,
        message: 'Product not found.',
      });
    }

    res.status(200).json({
      status: true,
      message: 'Product deleted successfully.',
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};
//Update Product
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    // [VTON] Snapshot the garment BEFORE updating so we can tell whether it changed —
    // only then must we regenerate previews that already exist.
    const before = await Product.findById(id).select("images garmentImage");
    const beforeGarment = before ? resolveGarment(before) : null;

    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validation
    });

    if (!updatedProduct) {
      return res.status(404).json({ status: false, message: 'Product not found' });
    }

    // [VTON] Refresh on-model previews in the background. If the garment/primary image
    // changed, force a regeneration; otherwise just fill in any missing previews (e.g.
    // a newly added gender). Fire-and-forget — never blocks or fails the update.
    const garmentChanged = beforeGarment !== resolveGarment(updatedProduct);
    refreshProductPreviews(id, { force: garmentChanged }).catch((err) =>
      console.error("[modelPreview] post-update generation failed:", err?.message)
    );

    res.status(200).json({
      status: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// Upload image
export const uploadImage = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'fashion-ecommerce' },
      (error, result) => {
        if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Upload failed' });
        } else {
          return res.status(200).json({ url: result.secure_url });
        }
      }
    );

    result.end(file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// [VTON] Admin-only: bulk generate ALL missing on-model previews for the catalog.
// Runs sequentially in background (single-slot free Space). Returns 202 immediately with queued count.
// Guards against overlapping runs — safe to call repeatedly.
export const generateAllProductPreviews = async (req, res) => {
  try {
    const result = await generateAllMissingPreviews();
    if (result.status === 'already-running') {
      return res.status(409).json({ status: false, message: result.message });
    }
    return res.status(202).json({ status: true, ...result });
  } catch (error) {
    console.error('[modelPreview] bulk generation failed:', error?.message);
    return res.status(500).json({ status: false, message: "Couldn't start bulk preview generation." });
  }
};

// [VTON] Manually (re)generate a product's on-model preview(s). Backfills products
// that predate the feature and acts as a retry when a background generation failed.
// Fire-and-forget + 202: generation takes ~30s–2min per image (well past a safe
// request time), so we kick it off and let the admin refresh to see the result.
// Query: ?force=true regenerates even existing previews (default fills missing only).
export const generateProductPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const force = req.query.force === "true";

    const product = await Product.findById(id).select("images garmentImage genders");
    if (!product) {
      return res.status(404).json({ status: false, message: 'Product not found.' });
    }
    if (!resolveGarment(product)) {
      return res.status(400).json({
        status: false,
        message: 'Add a product image or garment image before generating a preview.',
      });
    }

    refreshProductPreviews(id, { force, mode: "single" }).catch((err) =>
      console.error("[modelPreview] manual generation failed:", err?.message)
    );

    return res.status(202).json({
      status: true,
      message: 'Generating on-model preview — this takes a minute or two. Refresh to see it.',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: "Couldn't start preview generation." });
  }
};

// [VTON] Admin: poll the in-memory preview-generation tracker. Reports which
// product+gender previews are working/done/failed (with the failure reason),
// so the UI can surface "these N failed to generate" instead of a blind refresh.
export const getPreviewStatus = async (req, res) => {
  try {
    const status = getPreviewGenerationStatus();
    return res.status(200).json({ status: true, ...status });
  } catch (error) {
    console.error('[modelPreview] status lookup failed:', error?.message);
    return res.status(500).json({ status: false, message: "Couldn't read preview generation status." });
  }
};
