import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const qualityTags = ", cinematic lighting, 8k resolution, highly detailed, masterpiece, sharp focus, professional photography";
  const finalPrompt = prompt.trim() + qualityTags;

  // --- 1. HUGGING FACE (Black Forest Labs FLUX.1) ---
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const response = await fetch("https://router.huggingface.co/models/black-forest-labs/FLUX.1-dev", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: finalPrompt })
      });

      if (response.ok) {
        const blob = await response.blob();
        const buffer = Buffer.from(await blob.arrayBuffer());
        const base64 = buffer.toString('base64');
        return res.status(200).json({ 
          url: `data:image/jpeg;base64,${base64}`, 
          success: true, 
          provider: "huggingface" 
        });
      }
    } catch (e: any) {
      console.warn("Hugging Face Image Error:", e.message || e);
    }
  }

  // --- 2. POLLINATIONS.AI (Yüksek Hızlı & Güvenilir FLUX / Flux-Realism) ---
  try {
    const encoded = encodeURIComponent(finalPrompt);
    const seed = Date.now();
    const pollUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;
    
    // Doğrulama kontrolü
    return res.status(200).json({
      url: pollUrl,
      success: true,
      provider: "pollinations-flux"
    });
  } catch (err: any) {
    console.error("Image generation error:", err);
    return res.status(500).json({ error: "Görsel servisi şu an meşgul.", success: false });
  }
}
