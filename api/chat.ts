import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL_PRIORITY = [
  { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
  { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  { provider: 'openai', model: 'gpt-4o-mini' },
  { provider: 'gemini', model: 'gemini-1.5-flash' }
];

// Groq'u hizaya sokmak için dil kuralları en başa eklendi ve sertleştirildi
const SYSTEM_PROMPT = "DİL KURALI: KESİNLİKLE VE ASLA TÜRKÇE DIŞINDA BİR DİLDE CEVAP VERME! Kullanıcı 'hi', 'hello' veya 'selam' dese bile cevabın her zaman %100 Türkçe olmalıdır. Sen BurakAI Pro Ultra'sın. Profesyonel, yardımsever ve zeki bir yapay zeka asistanısın. Asla kırık görsel linkleri veya markdown resim formatı (![...](...)) kullanma. Eğer kullanıcı bir görsel, video veya web sitesi oluşturmak isterse, bunu algılayıp yanıtının sonuna mutlaka [GENERATE: TYPE, PROMPT] formatında bir komut ekle. Örnek: [GENERATE: IMAGE, kedi resmi]";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  // Gelen mesajları temizle ve senkronize et
  const cleanMessages = messages.map((m: any) => ({
    role: m.role,
    content: m.content
  }));

  // OpenAI ve Groq için Few-Shot (Örnekleme) tekniği uygulandı. 
  // Model geçmişte Türkçe konuştuğunu görünce bozmayacaktır.
  const finalMessages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: 'Selam' },
    { role: 'assistant', content: 'Merhaba! Ben BurakAI Pro Ultra, size nasıl yardımcı olabilirim?' },
    ...cleanMessages.filter((m: any) => m.role !== 'system') // Mükerrer sistem promptunu engelle
  ];

  for (const item of MODEL_PRIORITY) {
    try {
      console.log(`🚀 Deneniyor: ${item.provider} (${item.model})`);
      let content = "";

      // --- ANTHROPIC (CLAUDE) ---
      if (item.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: item.model,
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
            // Temizlenen mesajlardaki sistem rollerini eledik ve Anthropic formatına uygun hale getirdik
            messages: cleanMessages.filter((m: any) => m.role === 'user' || m.role === 'assistant')
          })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        content = data.content?.[0]?.text;
      }

      // --- GROQ ---
      else if (item.provider === 'groq' && process.env.GROQ_API_KEY) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            messages: finalMessages,
            model: item.model, 
            temperature: 0.2 // Sıcaklık 0.7'den 0.2'ye düşürüldü. Kurallara tam uyum sağlar.
          })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        content = data.choices?.[0]?.message?.content;
      } 
      
      // --- OPENAI ---
      else if (item.provider === 'openai' && process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            messages: finalMessages, 
            model: item.model,
            temperature: 0.5 // OpenAI için de kararlılık optimizasyonu
          })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        content = data.choices?.[0]?.message?.content;
      }

      // --- GEMINI ---
      else if (item.provider === 'gemini' && process.env.GEMINI_API_KEY1) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${item.model}:generateContent?key=${process.env.GEMINI_API_KEY1}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: cleanMessages
              .filter((m: any) => m.role !== 'system')
              .map((m: any) => ({
                role: m.role === "assistant" ? "model" : "user", 
                parts: [{ text: m.content || "" }]
              }))
          })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      if (content) {
        console.log(`✅ Başarılı: ${item.provider}`);
        return res.status(200).json({ role: "assistant", content });
      }

    } catch (error: any) {
      console.error(`⚠️ ${item.provider} hatası: ${error.message}`);
    }
  }

  return res.status(500).json({ error: "Şu an hiçbir AI modeli yanıt vermiyor. Lütfen birazdan tekrar dene." });
}