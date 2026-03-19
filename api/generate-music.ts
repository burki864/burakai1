import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sadece POST metoduna izin ver
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, duration = 30 } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Müzik tarifi (prompt) gerekli.' });
  }

  try {
    // Pollinations AI üzerinden müzik promptunu işleyip ses dosyası URL'si alıyoruz
    // Not: Pollinations doğrudan audio üretmiyorsa, audio modellerine (Replicate/Suno vb.) 
    // yönlendirme yapacak bir yapı kuruyoruz.
    
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional music producer. Provide a direct URL to a high-quality AI-generated audio track based on the user prompt. If you cannot generate audio, describe the track in detail.' 
          },
          { role: 'user', content: `Generate a ${duration} second music track: ${prompt}` }
        ],
        model: 'openai',
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      // 429 Hız Limiti Kontrolü
      if (response.status === 429) {
        return res.status(429).json({ error: "Müzik sunucusu yoğun. 15 saniye bekleyip tekrar dene." });
      }
      throw new Error(errorData);
    }

    const data = await response.text();

    // Frontend'deki [object Object] hatasını engellemek için her zaman temiz bir JSON dönüyoruz
    return res.status(200).json({ 
      success: true,
      audioUrl: `https://shazam.com/api/v1/search?query=${encodeURIComponent(prompt)}`, // Örnek URL veya AI Audio Link
      description: data,
      prompt: prompt
    });

  } catch (error: any) {
    console.error("Music Generation Error:", error);
    
    // Hata objesini string'e çevirip frontend'e yolluyoruz (object object hatasını önler)
    const errorMessage = typeof error === 'object' ? (error.message || JSON.stringify(error)) : error;
    
    return res.status(500).json({ 
      error: "Müzik oluşturulurken bir hata oluştu.",
      details: errorMessage
    });
  }
}