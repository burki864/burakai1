import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sadece POST isteklerini kabul et
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt } = req.body;

  // Prompt boşsa hata döndür
  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const seed = Math.floor(Math.random() * 1000000);
    
    // Kalite etiketlerini backend tarafında da garantiye alabiliriz
    const qualityTags = ", cinematic lighting, 8k resolution, highly detailed, masterpiece, sharp focus";
    const finalPrompt = prompt.trim() + qualityTags;

    // Pollinations URL'ini oluştur
    const imageUrl = `https://pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    // Frontend'e tertemiz bir yanıt dön
    return res.status(200).json({ 
      url: imageUrl, 
      success: true 
    });

  } catch (error) {
    return res.status(500).json({ error: "Sunucu hatası oluştu." });
  }
}