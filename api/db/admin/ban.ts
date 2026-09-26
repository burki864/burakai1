import type { VercelRequest, VercelResponse } from '@vercel/node';
import { banUserInDb } from '../../../lib/db.js';

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
    const { adminId, targetUserId, reason, durationHours } = req.body || {};
    if (!adminId || !targetUserId) {
      return res.status(400).json({ error: "adminId ve targetUserId zorunludur." });
    }
    const result = await banUserInDb(adminId, targetUserId, reason || "", Number(durationHours) || 24);
    return res.status(200).json({ result, success: true });
  } catch (err: any) {
    console.error("api/db/admin/ban POST Error:", err);
    return res.status(500).json({ error: err.message || "Ban işlemi gerçekleştirilemedi" });
  }
}
