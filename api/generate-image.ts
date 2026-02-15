export const config = {
  runtime: 'nodejs',
};

/**
 * Pollinations AI üzerinden FLUX modelini kullanarak görsel üretir.
 * Sonucu Base64 formatında döndürür.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, aspectRatio = '1:1' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // 1. Boyut Ayarları (Genişlik x Yükseklik)
    let width = 1024;
    let height = 1024;

    if (aspectRatio === '16:9') { width = 1280; height = 720; }
    else if (aspectRatio === '9:16') { width = 720; height = 1280; }

    // 2. Dinamik URL Oluşturma
    // model=flux: Metin yazma ve kalite için en iyisi
    // nologo=true: Pollinations filigranını kaldırır
    // seed: Her seferinde benzersiz sonuç için rastgele sayı
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    const pollinationsUrl = `https://pollinations.ai/p/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux-pro&nologo=true`;

    // 3. Görseli İndir ve Base64'e Çevir
    // Vercel ortamında 'fetch' yerleşik olarak bulunur.
    const imageResponse = await fetch(pollinationsUrl);
    
    if (!imageResponse.ok) {
      throw new Error('Pollinations API ile bağlantı kurulamadı.');
    }

    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/png';

    const imageUrl = `data:${mimeType};base64,${base64Data}`;

    // 4. Yanıtı Döndür
    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('[POLLINATIONS-FLUX ERROR]', error);
    return res.status(500).json({ 
      error: error.message || 'Görsel üretilirken bir hata oluştu.' 
    });
  }
}