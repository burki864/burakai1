import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkUsernameInDb } from '../../lib/db.js';

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
    const username = req.query.username as string;
    if (!username) {
      return res.status(400).json({ error: "username parametresi gereklidir." });
    }
    const isAvailable = await checkUsernameInDb(username);
    return res.status(200).json({ isAvailable, success: true });
  } catch (err: any) {
    console.error("api/db/username GET Error:", err);
    return res.status(500).json({ error: err.message || "Kullanıcı adı kontrol edilemedi", isAvailable: true });
  }
}
