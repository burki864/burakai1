import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { groq, MODELS } from '../lib/groq.js';

export const runtime = 'edge';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { query } = req.body;
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

  if (!query) {
    return res.status(400).json({ error: "Search query is required" });
  }

  if (!TAVILY_API_KEY) {
    return res.status(500).json({ error: "TAVILY_API_KEY is not set" });
  }

  if (!groq) {
    return res.status(500).json({ error: "Groq not initialized" });
  }

  try {
    // 1. Tavily ile web araması yap
    const tavilyResponse = await axios.post('https://api.tavily.com/search', {
      api_key: TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      max_results: 5
    });

    const searchResults = tavilyResponse.data.results;
    const searchContext = searchResults.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join('\n\n---\n\n');

    // 2. Llama-3.1-8b-instant ile özetle
    const systemInstruction = `Sen bir arama asistanısın. Gelen web arama sonuçlarını incele ve kullanıcı sorusuna en doğru, güncel ve özlü yanıtı ver.
    Yanıtını B-UILDER modülüne (kod yazıcı) girdi olarak verebilecek teknik detayda hazırla.
    Kullanılan teknolojiler, güncel trendler ve tasarım yaklaşımlarını belirt.
    Yanıtını mutlaka şu JSON formatında döndür:
    {
      "summary": "...",
      "key_findings": ["...", "..."],
      "sources": ["...", "..."],
      "technical_trends": "...",
      "design_recommendations": "..."
    }`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `Soru: ${query}\n\nArama Sonuçları:\n${searchContext}` }
      ],
      model: MODELS.FAST,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return res.status(200).json({ analysis, success: true });

  } catch (error: any) {
    console.error("Web Search Error:", error);
    return res.status(500).json({ error: "Web araması yapılırken bir hata oluştu." });
  }
}
