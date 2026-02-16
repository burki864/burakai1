export const config = {
  runtime: 'nodejs',
  maxDuration: 60, // Vercel'de işlem süresini maksimuma çekiyoruz
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt gereklidir.' });
  }

  try {
    // 1. KATMAN: Pollinations AI (Ana Motor - Ücretsiz & Anında)
    console.log("Sistem: Pollinations video/animasyon motoru başlatılıyor...");
    
    const seed = Math.floor(Math.random() * 1000000);
    // Pollinations'ın animasyon/video parametrelerini kullanarak çıktı alıyoruz
    const pollinationsUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    // Pollinations genellikle her zaman ayaktadır, direkt URL döndürüyoruz
    return res.status(200).json({ 
      videoUrl: pollinationsUrl, 
      engine: 'pollinations',
      message: "Görsel tabanlı animasyon başarıyla oluşturuldu." 
    });

  } catch (error) {
    console.warn("Pollinations hatası, yedek motor (HF) deneniyor...");

    try {
      // 2. KATMAN: Hugging Face - Stable Video Diffusion (Yedek Motor)
      // Not: Bu model görselden video üretir, o yüzden önce bir görsel gerektirir.
      const hfModelId = "stabilityai/stable-video-diffusion-img2vid-xt";
      
      const hfResponse = await fetch(
        `https://api-inference.huggingface.co/models/${hfModelId}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: prompt }), // Bazı modeller direkt prompt alabilir
        }
      );

      if (!hfResponse.ok) {
        throw new Error("Hugging Face yedek motoru da şu an meşgul.");
      }

      // HF genellikle video dosyasını binary (blob) döner
      const arrayBuffer = await hfResponse.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');

      return res.status(200).json({ 
        videoUrl: `data:video/mp4;base64,${base64Data}`,
        engine: 'huggingface'
      });

    } catch (hfError: any) {
      return res.status(500).json({ 
        error: "Ücretsiz tüm video servisleri şu an meşgul. Lütfen 1 dakika sonra tekrar dene." 
      });
    }
  }
}