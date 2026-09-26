import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkBanStatusInDb } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const userId = req.query.userId as string;
    if (!userId) {
      return res.status(400).json({ error: "userId parametresi zorunludur." });
    }
    const status = await checkBanStatusInDb(userId);
    return res.status(200).json({ status, success: true });
  } catch (err: any) {
    console.error("api/db/ban-status GET Error:", err);
    return res.status(500).json({ 
      error: err.message || "Ban durumu kontrol edilemedi",
      status: { isBanned: false, exists: true } // Güvenli fallback, kullanıcıyı kilitlememek için
    });
  }
}
