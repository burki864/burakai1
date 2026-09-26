import type { VercelRequest, VercelResponse } from '@vercel/node';

// Deployment and version metadata
const BUILD_INFO = {
  version: "2.4.0-ultra",
  releaseDate: "2026-09-26",
  buildTime: 1758879600000,
  environment: process.env.NODE_ENV || 'production',
  commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_REF || 'v2.4.0',
  changeLog: [
    "Puter bağımlılıkları tamamen kaldırıldı; bağımsız veritabanı ve serverless API mimarisi sağlandı.",
    "Canlı Küre Sesli Asistan Modu (3D audio-reactive voice orb) eklendi.",
    "Gerçek hata yakalama ve detaylı hata raporlama sistemi entegre edildi.",
    "APK ve Web için anlık redeploy güncelleme bildirim servisi eklendi."
  ]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json(BUILD_INFO);
}
