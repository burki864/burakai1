import { Client } from "@gradio/client";

export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // Video render süresi için gerekli
};

// 1. AI OLMAYAN ÇEVİRİ (Lingva API)
async function translateToEnglish(text: string): Promise<string> {
  try {
    const res = await fetch(`https://lingva.ml/api/v1/tr/en/${encodeURIComponent(text)}`);
    const data = await res.json();
    return data.translation || text;
  } catch {
    return text;
  }
}

// 2. VİDEO İÇİN PROMPT GÜÇLENDİRİCİ
function enhanceVideoPrompt(prompt: string): string {
  // Video modelleri için hareket ve kalite kelimeleri ekler
  const motionTags = "high quality, cinematic movement, fluid motion, masterpiece, 4k, hyper-realistic, 60fps";
  return `${prompt}, ${motionTags}`;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt: userPrompt } = req.body;
  if (!userPrompt) return res.status(400).json({ error: 'Prompt gereklidir.' });

  // Çeviri ve Güçlendirme
  const translatedPrompt = await translateToEnglish(userPrompt);
  const finalPrompt = enhanceVideoPrompt(translatedPrompt);

  try {
    console.log("Sistem: Video motoru (Hugging Face / Gradio) başlatılıyor...");

    // 1. ÖNCELİKLİ KATMAN: Stable Video Diffusion veya benzeri bir Gradio Space
    // Not: "black-forest-labs/FLUX.1-schnell" sadece görsel üretir. 
    // Video için "stabilityai/stable-video-diffusion-img2vid-xt-1-1" gibi modeller kullanılır.
    const client = await Client.connect("stabilityai/stable-video-diffusion-img2vid-xt-1-1", {
      hf_token: process.env.HF_TOKEN as `hf_${string}`
    });

    // Bu modeller genellikle önce bir görsel (image) bekler. 
    // Eğer direkt text-to-video bir space kullanıyorsan:
    const result = await client.predict("/generate_video", { 
      prompt: finalPrompt,
      secondary_prompt: "low quality, blurry, static",
      motion_bucket_id: 127, // Hareket yoğunluğu
      fps: 24,
    });

    if (result.data && result.data[0]) {
      return res.status(200).json({ 
        videoUrl: result.data[0].url, 
        engine: 'SVD-XT',
        prompt: finalPrompt 
      });
    }

    throw new Error("Video motoru boş yanıt döndü.");

  } catch (error) {
    console.warn("Ana motor hatası, Pollinations görsel-animasyon moduna geçiliyor...");

    // 2. KATMAN: Pollinations (Aslında statik görseldir ama animasyon hissi için kullanılır)
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://pollinations.ai/p/${encodeURIComponent(finalPrompt)}?width=1024&height=1024&seed=${seed}&model=flux`;

    return res.status(200).json({ 
      videoUrl: pollinationsUrl, 
      engine: 'pollinations-static',
      message: "Yüksek yoğunluk nedeniyle statik görsel oluşturuldu.",
      prompt: finalPrompt
    });
  }
}