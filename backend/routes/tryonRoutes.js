import express from 'express';
import Replicate from 'replicate';

const router = express.Router();
const replicate = new Replicate({
});

router.post('/', async (req, res) => {
  try {
    const { productImage, userImage } = req.body;

    if (!productImage) {
      return res.status(400).json({ error: "Product image URL is required" });
    }

    // Use a default user image if none provided
    const userImg = userImage || 'https://res.cloudinary.com/dpxmdtduf/image/upload/v1748711374/I3GOHIZ7CBBV7NPZC2ROV3AG2Q_rna1bv.jpg'; // You can upload a default image or let the user upload

    // The model and version can be replaced by your specific AI try-on model on Replicate
    // Example uses subhash25rawat/flux-vton from your earlier message

    const output = await replicate.run(
      "subhash25rawat/flux-vton:a02643ce418c0e12bad371c4adbfaec0dd1cb34b034ef37650ef205f92ad6199",
      {
        input: {
          part: "upper_body", // or adapt based on your product category
          image: userImg,
          garment: productImage,
        }
      }
    );

    // output is the URL of the generated try-on image
    return res.json({ generatedImage: output });

  } catch (error) {
    console.error("Full error:", JSON.stringify(error, null, 2));
    console.log("API Key:", process.env.REPLICATE_API_TOKEN);
    return res.status(500).json({ error: "Failed to generate try-on image" });
  }
});

export default router;
