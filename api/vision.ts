import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, VISION_MODEL } from '../lib/groq.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!groq) {
    return res.status(500).json({ error: "Groq not initialized" });
  }

  const { image, prompt = "What is in this image?" } = req.body;

  if (!image) {
    return res.status(400).json({ error: "Image data is required" });
  }

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: image, // base64 data url
              },
            },
          ],
        },
      ],
      model: VISION_MODEL,
    });

    const content = completion.choices[0]?.message?.content || "";
    return res.status(200).json({ content });
  } catch (error: any) {
    console.error("Vision API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
