import { writeFile } from "fs/promises";
import Replicate from "replicate";
import fetch from "node-fetch";
import 'dotenv/config';

const replicate = new Replicate();

async function generateTryOn() {
  const input = {
    prompt: "Put the woman into a white t-shirt with the text on it",
    aspect_ratio: "1:1",
    input_image_1: "https://replicate.delivery/pbxt/N5rSeJrCafWpmJuLb62moY8pSMEpSBBwSf7N6hxyIn4fNYMa/w8msa88d01rm80cq3hzsqrdehg.png",
    input_image_2: "https://replicate.delivery/pbxt/N5rSdTCgBqIRvbkedcfLfS5xTSEEOqMtX9FsR1hLK9JYryml/0_1.webp"
};


  try {
     const output = await replicate.run("flux-kontext-apps/multi-image-kontext", { input });
  await writeFile("output.png", output);
  } catch (error) {
    console.log(process.env.REPLICATE_API_TOKEN)
    console.error("❌ Error during try-on:", error);
  }
}

generateTryOn();
