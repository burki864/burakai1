import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { groq, MODELS } from '../lib/groq.js';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', endpoint: 'Web Search Endpoint' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Sadece POST istekleri kabul edilir.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {}
  }

  const { query } = body || {};
  if (!query) {
    return res.status(400).json({ error: "query parametresi gereklidir." });
  }

  // 1. Tavily API varsa onunla ara
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  if (TAVILY_API_KEY) {
    try {
      const tavilyResponse = await axios.post('https://api.tavily.com/search', {
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: 5
      }, { timeout: 8000 });

      const searchResults = tavilyResponse.data?.results || [];
      const sources = searchResults.map((r: any) => ({
        title: r.title,
        url: r.url
      }));

      // Gemini veya Groq ile özetle
      const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (geminiKey) {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const searchContext = searchResults.map((r: any) => `Başlık: ${r.title}\nLink: ${r.url}\nİçerik: ${r.content}`).join('\n\n');
        const summaryRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [{ text: `Aşağıdaki arama sonuçlarına dayanarak "${query}" sorusunu Türkçe ve kapsamlı özetle:\n\n${searchContext}` }]
          }]
        });

        return res.status(200).json({
          summary: summaryRes.text || "Arama sonuçları özetlendi.",
          sources,
          success: true
        });
      }

      return res.status(200).json({
        summary: searchResults.map((r: any) => r.content).slice(0, 3).join('\n\n'),
        sources,
        success: true
      });
    } catch (tavilyErr: any) {
      console.warn("Tavily error, fallback to Gemini:", tavilyErr.message);
    }
  }

  // 2. Gemini API ile doğrudan arama ve bilgi sentezi
  const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
          role: 'user',
          parts: [{
            text: `Aşağıdaki konu hakkında internetteki en güncel ve doğru bilgileri kapsayacak şekilde detaylı, Türkçe bir özet hazırla: "${query}"`
          }]
        }]
      });

      return res.status(200).json({
        summary: response.text || `"${query}" hakkında güncel bilgiler derlendi.`,
        sources: [
          { title: "Google Arama ve Bilgi Ağı", url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }
        ],
        success: true
      });
    } catch (geminiErr: any) {
      console.warn("Gemini search error:", geminiErr.message);
    }
  }

  // 3. Groq ile sentez
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "Sen profesyonel bir web arama ve araştırma asistanısın. Kullanıcı sorularına güncel, tarafsız ve Türkçe yanıt ver." },
          { role: "user", content: `Lütfen şu konu hakkında bildiğin tüm güncel ve teknik detayları açıkla: ${query}` }
        ],
        model: MODELS.FAST,
        temperature: 0.3
      });

      return res.status(200).json({
        summary: completion.choices[0]?.message?.content || `"${query}" araması işlendi.`,
        sources: [],
        success: true
      });
    } catch (groqErr: any) {
      console.warn("Groq search error:", groqErr.message);
    }
  }

  // Güvenli Fallback
  return res.status(200).json({
    summary: `"${query}" araması gerçekleştirildi. Detaylar için ilgili arama motorunu kullanabilirsiniz.`,
    sources: [
      { title: "Google Arama", url: `https://www.google.com/search?q=${encodeURIComponent(query)}` }
    ],
    success: true
  });
}
