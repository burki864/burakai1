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
    return res.status(400).json({ error: "YouTube URL is required" });
  }

  if (!groq) {
    return res.status(500).json({ error: "Groq not initialized" });
  }

  try {
    // 1. YouTube transcript çekme (Jina AI veya benzeri bir servis üzerinden deneme)
    // Not: Gerçek bir transcript API'si (örn. youtube-transcript) daha sağlıklı olurdu.
    // Şimdilik Jina AI üzerinden sayfa içeriğini çekmeyi deniyoruz.
    const jinaUrl = `https://r.jina.ai/${url}`;
    const jinaResponse = await axios.get(jinaUrl);
    const content = jinaResponse.data;

    // 2. Qwen ile analiz et ve Landing Page taslağı oluştur
    const systemInstruction = `Sen bir içerik ve web tasarım stratejistisin. 
    Gelen YouTube videosu içeriğini (transcript veya sayfa metni) analiz et.
    Bu videonun konusuna, hedef kitlesine ve mesajına uygun profesyonel bir "Landing Page" taslağı oluştur.
    Tasarım dili, renk paleti, ana bölümler (Hero, Features, Testimonials, vb.) ve içerik hiyerarşisini belirt.
    Yanıtını mutlaka şu JSON formatında döndür:
    {
      "video_summary": "...",
      "target_audience": "...",
      "design_language": "...",
      "colors": ["#...", "#..."],
      "landing_page_sections": [
        { "title": "...", "content": "..." }
      ],
      "cta_text": "...",
      "technical_details": "..."
    }`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Aşağıdaki YouTube videosu içeriğini analiz et ve bir Landing Page taslağı oluştur:\n\n${content}` }
      ],
      model: MODELS.ANALYZER,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return res.status(200).json({ analysis, success: true });

  } catch (error: any) {
    console.error("YouTube Analysis Error:", error);
    return res.status(500).json({ error: "YouTube videosu analiz edilirken bir hata oluştu." });
  }
}
