import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveImageInDb } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { userId, prompt, imageUrl } = req.body || {};
    if (!userId || !prompt || !imageUrl) {
      return res.status(400).json({ error: "userId, prompt ve imageUrl zorunludur." });
    }
    const data = await saveImageInDb(userId, prompt, imageUrl);
    return res.status(200).json({ data, success: true });
  } catch (err: any) {
    console.error("api/db/image POST Error:", err);
    return res.status(500).json({ error: err.message || "Görsel kaydedilemedi" });
  }
}
