import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { prompt, currentProject } = req.body;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GROQ_API_KEY}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `You are a Senior Web Architect. Output ONLY a valid JSON object. 
            No conversation, no markdown blocks. Just the raw JSON.
            Structure: Full Next.js project with Tailwind CSS.
            Design: Ultra-modern, Dark Glassmorphism, Neon.`
          },
          { role: "user", content: `CURRENT: ${currentProject || "None"}\nREQUEST: ${prompt}` }
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    let content = data.choices[0].message.content;

    // JSON Temizleme: Eğer model markdown kullandıysa temizle
    content = content.trim();
    if (content.startsWith("```json")) content = content.substring(7);
    if (content.startsWith("```")) content = content.substring(3);
    if (content.endsWith("```")) content = content.substring(0, content.length - 3);
    content = content.trim();

    try {
      const parsed = JSON.parse(content);
      return res.status(200).json({ project: parsed });
    } catch (parseError) {
      console.error("JSON Parse Hatası:", content);
      return res.status(500).json({ error: "Yapay zeka geçersiz bir veri yapısı oluşturdu." });
    }

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}