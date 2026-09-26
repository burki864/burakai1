import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkUsernameInDb } from '../../lib/db.js';

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

  const username = (req.query?.username as string) || body?.username;
  if (!username) {
    return res.status(400).json({ error: "username parametresi gereklidir." });
  }

  try {
    const isAvailable = await checkUsernameInDb(username);
    return res.status(200).json({ isAvailable, success: true });
  } catch (err: any) {
    console.error("api/db/username Error:", err);
    return res.status(200).json({ error: err.message || "Kullanıcı adı kontrol edilemedi", isAvailable: true, success: true });
  }
}
