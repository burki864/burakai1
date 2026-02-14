export const config = {
  runtime: 'nodejs',
};

const promptCache = new Map<string, string>();

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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt } = req.body;
    let finalPrompt = prompt ? prompt.trim().toLowerCase() : "";

    const triggers = ["resim", "görsel", "çiz"];
    triggers.forEach(t => {
      finalPrompt = finalPrompt.replace(new RegExp(t, "gi"), "");
    });
    finalPrompt = finalPrompt.trim();

    if (!finalPrompt) return res.status(400).json({ error: 'Description required.' });

    // Cache Kontrolü
    if (promptCache.has(finalPrompt)) {
      return res.status(200).json({ imageUrl: promptCache.get(finalPrompt), cached: true });
    }

    const fixedSeed = generateSeedFromPrompt(finalPrompt);
    const encodedPrompt = encodeURIComponent(finalPrompt);

    // KADEMELİ MODELLER (Yedekli Liste)
    const models = ['flux-pro', 'flux', 'turbo'];
    let imageBuffer: ArrayBuffer | null = null;
    let lastError = "";

    for (const model of models) {
      try {
        const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${model}&width=1024&height=1024&nologo=true&enhance=false&seed=${fixedSeed}`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Her model için 15 sn sınır

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          imageBuffer = await response.arrayBuffer();
          if (imageBuffer.byteLength > 5000) break; // Geçerli bir resim geldiyse döngüden çık
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`${model} denemesi başarısız, sıradakine geçiliyor...`);
        continue;
      }
    }

    if (!imageBuffer) {
      throw new Error(`Tüm modeller meşgul (1033 hatası aşılamadı). Son hata: ${lastError}`);
    }

    // Base64'e çevir (Tarayıcıda 1033 almayı engeller)
    const base64Data = Buffer.from(imageBuffer).toString('base64');
    const finalBase64 = `data:image/jpeg;base64,${base64Data}`;

    promptCache.set(finalPrompt, finalBase64);

    return res.status(200).json({ 
      imageUrl: finalBase64,
      cached: false,
      seed: fixedSeed
    });

  } catch (error: any) {
    console.error('[BURAKAI_VISION_ERROR]', error.message);
    return res.status(500).json({ error: error.message || 'Vision synthesis failed.' });
  }
}