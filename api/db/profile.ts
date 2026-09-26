import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createProfileInDb, updateProfileInDb } from '../../lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
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

  if (req.method === 'POST') {
    const { user } = body || {};
    if (!user || !user.id || !user.name) {
      return res.status(400).json({ error: "Eksik kullanıcı bilgisi (id ve name zorunludur)." });
    }
    try {
      const data = await createProfileInDb(user.id, user.name, user.email || "");
      return res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("api/db/profile POST Error:", err);
      // Güvenli fallback: Kullanıcının profil nesnesini döndür
      return res.status(200).json({ 
        data: { 
          id: user.id, 
          username: user.name, 
          email: user.email || "", 
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
          banned: false 
        }, 
        success: true, 
        fallback: true 
      });
    }
  }

  if (req.method === 'PUT') {
    const { id, updates } = body || {};
    if (!id) {
      return res.status(400).json({ error: "Kullanıcı ID gereklidir." });
    }
    try {
      const data = await updateProfileInDb(id, updates?.username, updates?.avatar_url);
      return res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("api/db/profile PUT Error:", err);
      return res.status(200).json({ data: { id, ...(updates || {}) }, success: true, fallback: true });
    }
  }

  if (req.method === 'GET') {
    const userId = (req.query?.userId as string) || (req.query?.id as string) || 'default';
    return res.status(200).json({
      data: { id: userId, username: 'BurakAI User', banned: false },
      success: true
    });
  }

  return res.status(405).json({ error: "Method Not Allowed. Sadece POST, PUT veya GET desteklenir." });
}
