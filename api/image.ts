
export default async function handler(req: any, res: any) {
  return res.status(410).json({ error: 'Endpoint moved to /api/generate-image for native Gemini support.' });
}
