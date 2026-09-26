import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createProfileInDb, updateProfileInDb } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { user } = req.body || {};
      if (!user || !user.id || !user.name) {
        return res.status(400).json({ error: "Eksik kullanıcı bilgisi (id ve name zorunludur)." });
      }
      const data = await createProfileInDb(user.id, user.name, user.email || "");
      return res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("api/db/profile POST Error:", err);
      return res.status(500).json({ error: err.message || "Profil kaydedilemedi" });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, updates } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: "Kullanıcı ID gereklidir." });
      }
      const data = await updateProfileInDb(id, updates?.username, updates?.avatar_url);
      return res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("api/db/profile PUT Error:", err);
      return res.status(500).json({ error: err.message || "Profil güncellenemedi" });
    }
  }

  return res.status(405).json({ error: "Method Not Allowed" });
}
