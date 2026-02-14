export const config = {
  runtime: 'nodejs',
};

// Basit bir bellek içi önbellek (In-memory cache)
// Not: Sunucu restart edilirse bu temizlenir. 
// Kalıcı çözüm için Redis veya veritabanı gerekebilir.
const promptCache = new Map<string, string>();

/**
 * Prompt'tan benzersiz bir sayısal Seed üreten yardımcı fonksiyon
 */
function generateSeedFromPrompt(prompt: string): number {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
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

    // Tetikleyici kelimeleri temizle
    const triggers = ["resim", "görsel", "çiz"];
    triggers.forEach(t => {
      finalPrompt = finalPrompt.replace(new RegExp(t, "gi"), "");
    });
    finalPrompt = finalPrompt.trim().toLowerCase(); // Küçük harfe çevirerek cache doğruluğunu artırıyoruz

    if (!finalPrompt) {
      return res.status(400).json({ error: 'Vision description is required.' });
    }

    // 1. Önce Cache Kontrolü: Aynı prompt daha önce gelmiş mi?
    if (promptCache.has(finalPrompt)) {
      console.log(`[CACHE HIT] Returning existing image for: ${finalPrompt}`);
      return res.status(200).json({ 
        imageUrl: promptCache.get(finalPrompt),
        cached: true 
      });
    }

    // 2. Prompt'a özel sabit bir Seed üret
    const fixedSeed = generateSeedFromPrompt(finalPrompt);

    // 3. Pollinations URL (model=flux zeka ve sadakat için)
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&nologo=true&enhance=true&seed=${fixedSeed}`;

    // 4. Yeni üretilen URL'yi cache'e kaydet
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