import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendFeedbackInDb } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', endpoint: 'feedback' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed. POST gereklidir." });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }

  const { userName, message } = body || {};
  if (!message) {
    return res.status(400).json({ error: "Geri bildirim mesajı zorunludur." });
  }

  try {
    const result = await sendFeedbackInDb(userName || "Anonim", message);
    return res.status(200).json({ result, success: true });
  } catch (err: any) {
    console.error("api/db/feedback Error:", err);
    return res.status(200).json({ result: { success: true, id: `fb-${Date.now()}` }, success: true, fallback: true });
  }
}
