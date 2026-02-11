
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt, history, settings, attachments } = req.body;
    if (!process.env.API_KEY) return res.status(500).json({ error: 'API_KEY Missing' });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Use gemini-3-pro-preview for highest quality results
    const modelName = 'gemini-3-pro-preview';

    const userParts: any[] = [{ text: prompt }];
    if (attachments && attachments.length > 0) {
      attachments.forEach((att: any) => {
        userParts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      });
    }

    const generationConfig: any = {
      // Reinforced Core Directive
      systemInstruction: 'You are BurakAI, an advanced AI with real-time web access and creative vision. You are helpful, precise, and professional. Always use your search tool for up-to-date information.',
      temperature: settings?.creativity ?? 0.7,
      tools: [{ googleSearch: {} }] // Always enable search for "Real-time web access"
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        ...history.map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: userParts }
      ],
      config: generationConfig
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingUrls = groundingChunks
      .filter((c: any) => c.web)
      .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    
    if (groundingUrls.length > 0) {
      res.write(`METADATA:${JSON.stringify({ groundingUrls })}\n`);
    }

    res.write(response.text || "");
    res.end();

  } catch (error: any) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
