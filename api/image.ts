import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // Dokümantasyondaki max seed değerine uygun (2147483647)
    const seed = Math.floor(Math.random() * 2147483647);
    
    const qualityTags = ", cinematic lighting, 8k resolution, highly detailed, masterpiece, sharp focus, professional photography";
    const finalPrompt = prompt.trim() + qualityTags;

    // Dokümantasyondaki yeni yapı: gen.pollinations.ai/image/
    // enhance=true parametresi AI'nın promptu daha iyi işlemesini sağlar
    const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true&enhance=true`;

    return res.status(200).json({ 
      url: imageUrl, 
      success: true 
    });

  } catch (error) {
    return res.status(500).json({ error: "Sunucu hatası oluştu." });
  }
}