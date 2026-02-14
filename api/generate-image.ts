export const config = {
  runtime: 'nodejs',
};

// In-memory cache: Sunucu açık kaldığı sürece aynı promptları kaydeder.
const promptCache = new Map<string, string>();

/**
 * Prompt'tan benzersiz bir sayısal Seed üreten yardımcı fonksiyon.
 * Aynı metne her zaman aynı görselin gelmesini sağlar.
 */
function generateSeedFromPrompt(prompt: string): number {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    let finalPrompt = prompt ? prompt.trim() : "";

    // 1. Türkçe tetikleyicileri temizle
    const triggers = ["resim", "görsel", "çiz"];
    triggers.forEach(t => {
      finalPrompt = finalPrompt.replace(new RegExp(t, "gi"), "");
    });
    finalPrompt = finalPrompt.trim().toLowerCase();

    if (!finalPrompt) {
      return res.status(400).json({ error: 'Vision description is required.' });
    }

    // 2. Cache Kontrolü
    if (promptCache.has(finalPrompt)) {
      return res.status(200).json({ 
        imageUrl: promptCache.get(finalPrompt),
        cached: true 
      });
    }

    // 3. Sabit Seed üret
    const fixedSeed = generateSeedFromPrompt(finalPrompt);
    const encodedPrompt = encodeURIComponent(finalPrompt);

    /**
     * 4. POLLINATIONS URL YAPILANDIRMASI (FLUX 1.1 PRO ODAKLI)
     * - model=flux-pro: En zeki ve sadık model (Muz/Elma ayrımı için en iyisi).
     * - enhance=false: Boş gelme sorununu önlemek için kapattık. Gerekirse true yapabilirsin.
     * - width/height=1024: Standart yüksek kalite.
     */
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-pro&width=1024&height=1024&nologo=true&enhance=false&seed=${fixedSeed}`;

    // 5. URL'yi cache'e kaydet
    promptCache.set(finalPrompt, pollinationsUrl);

    return res.status(200).json({ 
      imageUrl: pollinationsUrl,
      cached: false,
      seed: fixedSeed
    });

  } catch (error: any) {
    console.error('[BURAKAI_VISION_ERROR]', error);
    return res.status(500).json({ error: 'Vision synthesis failed.' });
  }
}