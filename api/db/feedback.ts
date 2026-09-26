import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendFeedbackInDb } from '../../lib/db.js';

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
    const { userName, message } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Geri bildirim mesajı zorunludur." });
    }
    const result = await sendFeedbackInDb(userName || "Anonim", message);
    return res.status(200).json({ result, success: true });
  } catch (err: any) {
    console.error("api/db/feedback POST Error:", err);
    return res.status(500).json({ error: err.message || "Geri bildirim kaydedilemedi" });
  }
}
