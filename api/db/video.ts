import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveVideoInDb } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'ok', endpoint: 'video' });
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

  const { userId, prompt, videoUrl } = body || {};
  if (!userId || !prompt || !videoUrl) {
    return res.status(400).json({ error: "userId, prompt ve videoUrl zorunludur." });
  }

  try {
    const data = await saveVideoInDb(userId, prompt, videoUrl);
    return res.status(200).json({ data, success: true });
  } catch (err: any) {
    console.error("api/db/video Error:", err);
    return res.status(200).json({
      data: { id: `vid-${Date.now()}`, user_id: userId, prompt, url: videoUrl, created_at: new Date().toISOString() },
      success: true,
      fallback: true
    });
  }
}
