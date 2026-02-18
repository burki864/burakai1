import { Client } from "@gradio/client";

export const config = { runtime: 'nodejs' };

// 1. AI OLMAYAN HIZLI ÇEVİRİ FONKSİYONU
async function translateToEnglish(text: string): Promise<string> {
  try {
    const response = await fetch(`https://lingva.ml/api/v1/tr/en/${encodeURIComponent(text)}`);
    const data = await response.json();
    return data.translation || text;
  } catch (error) {
    return text; // Hata durumunda orijinali kullan
  }
}

// 2. PROMPT DETAYLANDIRICI (ENHANCER)
// Kullanıcının promptuna kalite odaklı anahtar kelimeler ekler
function enhancePrompt(prompt: string): string {
  const qualityBoosters = "4k resolution, ultra-realistic, masterpiece, highly detailed, photorealistic, cinematic lighting, 8k uhd, sharp focus";
  return `${prompt}, ${qualityBoosters}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt: userPrompt } = req.body;
  if (!userPrompt) return res.status(400).json({ error: 'Görsel açıklaması eksik.' });

  try {
    // ADIM 1: Çeviri
    let translatedPrompt = await translateToEnglish(userPrompt);
    
    // ADIM 2: Detaylandırma (Realistic 4k vb. ekleme)
    const finalPrompt = enhancePrompt(translatedPrompt);
    
    console.log(`Final Prompt: ${finalPrompt}`);

    // ADIM 3: FLUX.2-klein-9B Motoru
    const client = await Client.connect("black-forest-labs/FLUX.2-klein-9B", {
      hf_token: process.env.HF_TOKEN as `hf_${string}`
    });

    const result = await client.predict("/infer", { 
      prompt: finalPrompt,
      seed: Math.floor(Math.random() * 1000000),
      width: 1024,
      height: 1024,
      guidance_scale: 3.5, // Klein için ideal değer
      num_inference_steps: 4, 
    });

    if (result.data && result.data[0]) {
      const imageData = result.data[0];
      return res.status(200).json({ 
        imageUrl: typeof imageData === 'string' ? imageData : imageData.url,
        usedPrompt: finalPrompt,
        engine: "FLUX.2-klein-9B"
      });
    }

    throw new Error("Görsel motoru yanıt vermedi.");

  } catch (error) {
    // FALLBACK: Pollinations (Yine optimize edilmiş prompt ile)
    const seed = Math.floor(Math.random() * 1000000);
    const fallbackUrl = `https://pollinations.ai/p/${encodeURIComponent(enhancePrompt(userPrompt))}?width=1024&height=1024&seed=${seed}&model=flux`;
    
    return res.status(200).json({ 
      imageUrl: fallbackUrl,
      engine: "Pollinations (Fallback)" 
    });
  }
}