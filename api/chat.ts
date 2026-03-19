import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, model = "llama-4-scout-17b-16e-instruct" } = req.body;

  // ⚠️ GROQ_API_KEY'i Vercel Dashboard -> Settings -> Environment Variables kısmına eklemelisin!
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Groq API Key bulunamadı! Vercel panelinden ekle." });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        model: model,
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API Hatası:", errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || "Groq isteği başarısız oldu." 
      });
    }

    const data = await response.json();
    return res.status(200).json(data.choices[0].message);

  } catch (error: any) {
    console.error("Chat Servis Hatası:", error);
    return res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}