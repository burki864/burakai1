import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { groq, MODELS } from '../lib/groq.js';

export const runtime = 'edge';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  if (!groq) {
    return res.status(500).json({ error: "Groq not initialized" });
  }

  try {
    // 1. Jina AI ile siteyi markdown'a çevir
    const jinaUrl = `https://r.jina.ai/${url}`;
    const jinaResponse = await axios.get(jinaUrl);
    const markdown = jinaResponse.data;

    // 2. Qwen ile analiz et
    const systemInstruction = `Sen bir web analiz uzmanısın. Gelen sitenin markdown içeriğini incele.
    Sitenin tasarım dilini, renk paletini (hex kodları), ana fonksiyonlarını ve içerik hiyerarşisini analiz et.
    Bu analizi B-UILDER modülüne (kod yazıcı) girdi olarak verebilecek teknik detayda hazırla.
    Yanıtını mutlaka şu JSON formatında döndür:
    {
      "design_language": "...",
      "colors": ["#...", "#..."],
      "functions": ["...", "..."],
      "content_hierarchy": "...",
      "summary": "...",
      "technical_details": "..."
    }`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Aşağıdaki sitenin içeriğini analiz et:\n\n${markdown}` }
      ],
      model: MODELS.ANALYZER,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return res.status(200).json({ analysis, success: true });

  } catch (error: any) {
    console.error("Link Analysis Error:", error);
    return res.status(500).json({ error: "Site analiz edilirken bir hata oluştu." });
  }
}
