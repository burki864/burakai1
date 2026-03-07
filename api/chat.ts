// api/chat.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const HF_TOKEN = process.env.VITE_HUGGINGFACE_TOKEN || process.env.VITE_HUGGING_FACE_TOKEN;

  try {
    const response = await fetch(`https://router.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct`, {
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

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ error: error.message || "API Hatası" });
  }
}
