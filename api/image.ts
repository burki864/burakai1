import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateCloudflareImage } from '../lib/cloudflare.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, inputs } = req.body;
  const imagePrompt = prompt || inputs;

  if (!imagePrompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const imageBuffer = await generateCloudflareImage(imagePrompt);
    
    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(Buffer.from(imageBuffer));
  } catch (error: any) {
    console.error("Image API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
