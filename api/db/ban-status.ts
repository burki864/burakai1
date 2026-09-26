import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkBanStatusInDb } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }

  const userId = (req.query?.userId as string) || body?.userId;
  if (!userId) {
    return res.status(400).json({ error: "userId parametresi zorunludur." });
  }

  try {
    const status = await checkBanStatusInDb(userId);
    return res.status(200).json({ status, success: true });
  } catch (err: any) {
    console.error("api/db/ban-status Error:", err);
    // Güvenli fallback: Kullanıcının oturumunu kilitlememek için
    return res.status(200).json({ 
      status: { isBanned: false, exists: true },
      success: true 
    });
  }
}
