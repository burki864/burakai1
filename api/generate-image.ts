export const config = {
  runtime: 'nodejs',
};

/**
 * Hugging Face Inference API üzerinden FLUX modelini kullanır.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt gereklidir.' });
    }

    // 1. Hugging Face API İsteği
    // Model: black-forest-labs/FLUX.1-dev (Kalite ve yazı için en iyisi)
    const response = await fetch(
      "https://router.huggingface.co/models/black-forest-labs/FLUX.1-dev",
      {
        headers: {
          "Authorization": `Bearer ${process.env.HF_TOKEN}`, // Vercel'e HF_TOKEN ekle
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    // 2. Hata Kontrolü
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // 503 Hatası: Model yükleniyor demektir, 1033 gibi kalıcı bir hata değildir.
      if (response.status === 503) {
        throw new Error('Model şu an yükleniyor, lütfen 10-20 saniye sonra tekrar dene.');
      }
      throw new Error(errorData.error || 'Hugging Face bir hata döndürdü.');
    }

    // 3. Görseli Blob olarak al ve Base64'e çevir
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    // HF genellikle görseli image/jpeg veya image/png olarak döner
    const contentType = response.headers.get("content-type") || "image/png";
    const imageUrl = `data:${contentType};base64,${base64Data}`;

    // 4. Yanıtı Döndür
    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('[HF-ERROR]', error);
    return res.status(500).json({ 
      error: error.message || 'Hugging Face ile görsel üretilemedi.' 
    });
  }
}
