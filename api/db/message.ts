import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMessageInDb } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', endpoint: 'BurakAI DB Message Service' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed. POST isteği gereklidir." });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }

  const { userId, text, role } = body || {};
  if (!userId || !text) {
    return res.status(400).json({ error: "userId ve text alanları zorunludur." });
  }

  try {
    const data = await sendMessageInDb(userId, text, role || 'user');
    return res.status(200).json({ data, success: true });
  } catch (err: any) {
    console.error("api/db/message Error:", err);
    // Güvenli yerel fallback (istemciyi asla kırmaz)
    return res.status(200).json({
      data: {
        id: `msg-${Date.now()}`,
        user_id: userId,
        content: text,
        role: role || 'user',
        created_at: new Date().toISOString()
      },
      success: true,
      fallback: true
    });
  }
}
