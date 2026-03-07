// api/image.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const HF_TOKEN = process.env.VITE_HUGGINGFACE_TOKEN || process.env.VITE_HUGGING_FACE_TOKEN;

  try {
    const response = await fetch(`https://router.huggingface.co/models/black-forest-labs/FLUX.1-schnell`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    res.setHeader('Content-Type', 'image/png');
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error("Image API Error:", error);
    return res.status(500).json({ error: error.message || "API Hatası" });
  }
}
