export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Görsel açıklaması eksik.' });
  }

  try {
    console.log("Sistem: Ana motor (Pollinations) başlatılıyor...");
    
    // 1. ADIM: Pollinations AI (Ücretsiz ve Key Gerektirmez)
    const seed = Math.floor(Math.random() * 1000000);
    const pollinationsUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

    const pollResponse = await fetch(pollinationsUrl);

    if (pollResponse.ok) {
      // Pollinations başarılıysa direkt dönüyoruz
      return res.status(200).json({ imageUrl: pollinationsUrl });
    }

    throw new Error("Pollinations cevap vermedi, yedek motora geçiliyor...");

  } catch (primaryError) {
    console.warn("[YEDEK MOTORA GEÇİLDİ]", primaryError);

    try {
      // 2. ADIM: Hugging Face (Yedek Motor - FLUX Schnell)
      const modelId = "black-forest-labs/FLUX.1-schnell";
      const hfResponse = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ inputs: prompt }),
        }
      );

      if (!hfResponse.ok) {
        throw new Error("Yedek motor (HF) da başarısız oldu.");
      }

      const arrayBuffer = await hfResponse.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString('base64');
      const contentType = hfResponse.headers.get("content-type") || "image/png";

      return res.status(200).json({ 
        imageUrl: `data:${contentType};base64,${base64Data}` 
      });

    } catch (secondaryError: any) {
      return res.status(500).json({ 
        error: "Tüm görsel motorları şu an meşgul. Lütfen birazdan tekrar dene." 
      });
    }
  }
}