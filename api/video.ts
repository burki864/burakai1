
// This file has been moved to api/generate-video.ts to align with production naming conventions.
export default async function handler(req: any, res: any) {
  return res.status(410).json({ error: 'Endpoint moved to /api/generate-video' });
}
