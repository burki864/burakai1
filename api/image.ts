import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore
import { init } from "@heyputer/puter.js"; 

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method Not Allowed" });

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt is required" });

  // Profesyonel görünüm için kalite etiketleri
  const qualityTags = ", cinematic lighting, 8k resolution, highly detailed, masterpiece, sharp focus, professional photography";
  const finalPrompt = prompt.trim() + qualityTags;

  // --- 1️⃣. HUGGING FACE (Birinci Öncelik) ---
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
    } catch (e) {
      console.error("Hugging Face Error:", e);
    }
  }

  // --- 2️⃣. NANO BANANA (İkinci Öncelik - Fallback 1) ---
  if (process.env.NANOBANANA_API_KEY) {
    try {
      // Nano Banana API endpoint'i (Örnek yapı)
      const response = await fetch("https://api.nanobanana.com/v1/generate", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NANOBANANA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: finalPrompt, model: "flux-pro" })
      });
      const data = await response.json();
      if (data.url) return res.status(200).json({ url: data.url, success: true, provider: "nanobanana" });
    } catch (e) {
      console.error("Nano Banana Error:", e);
    }
  }

  // --- 3️⃣. PUTER.JS (Son Çare - Fallback 2) ---
  if (process.env.PUTER_AUTH_TOKEN) {
    try {
      console.log("🔄 Puter.js devreye giriyor...");
      
      // Puter'ı dökümanda belirttiğin gibi init ediyoruz
      const puter = init(process.env.PUTER_AUTH_TOKEN);
      
      // Puter.js üzerinden görsel oluşturma (DALL-E 3 benzeri)
      const imageResult = await puter.ai.txt2img(finalPrompt);
      
      // Puter genellikle doğrudan görsel objesi veya URL döndürür
      if (imageResult && imageResult.url) {
        return res.status(200).json({ 
          url: imageResult.url, 
          success: true, 
          provider: "puterjs" 
        });
      }
    } catch (e) {
      console.error("Puter.js Error:", e);
    }
  }

  return res.status(500).json({ error: "Tüm görsel servisleri meşgul.", success: false });
}