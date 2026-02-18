export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  // 1. Method Güvenliği
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { prompt, history = [] } = req.body;

  // 2. Input Validasyonu
  if (!prompt) {
    return res.status(400).json({ error: "Mesaj içeriği boş olamaz." });
  }

  try {
    // 3. Mesaj Geçmişini Optimize Et (Son 10 mesajı alarak token tasarrufu yap)
    const optimizedHistory = history.slice(-10).map((h: any) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
    }));

    // 4. Hugging Face Inference API Çağrısı
    const response = await fetch(
      "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-72B-Instruct",
          messages: [
            { 
              role: "system", 
              content: "Sen BurakAI asistanısın. 🚀 Teknik konularda uzmansın. Cevaplarında paragraflar arasında mutlaka ÇİFT SATIR boşluk bırak. Maddeleri yeni satırda başlat. Önemli yerleri **kalın** yap. Uygun emojiler kullan. Kod yazarken mutlaka dil belirterek (```javascript gibi) kod bloğu içine al ve koddan önce/sonra boş satır bırak. 💻" 
            },
            ...optimizedHistory,
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          temperature: 0.8, // Daha doğal emoji ve boşluk kullanımı için hafif artırıldı
          top_p: 0.9,
          frequency_penalty: 0.5, // Satır başı ve boşluk yapmasını kolaylaştırır
          presence_penalty: 0.6, // Tekrardan kaçınarak daha ferah yazar
          stream: false,
        }),
      }
    );

    // 5. Yanıt Kontrolü (Hugging Face bazen 503 dönebilir)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HF_API_ERROR: ${response.status}`);
    }

    const data = await response.json();
    
    // Güvenli veri okuma
    const resultText = data.choices?.[0]?.message?.content || "Bir hata oluştu, yanıt alınamadı.";

    // 6. Temiz Yanıt Döndür
    return res.status(200).json({ 
      reply: resultText,
      status: "success" 
    });

  } catch (error: any) {
    console.error("Chat Error:", error.message);
    
    // 7. Kullanıcı Dostu Hata Mesajı
    return res.status(500).json({ 
      error: "Sistem şu an meşgul veya bir bağlantı hatası oluştu. 🛠️",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}