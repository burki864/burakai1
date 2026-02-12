
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt, history, settings, attachments } = req.body;
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Process history into Gemini format
    const contents = history.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Build current user message parts
    const currentParts: any[] = [{ text: prompt }];
    if (attachments && attachments.length > 0) {
      attachments.forEach((att: any) => {
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction: settings?.systemPrompt || 'You are BurakAI, a high-performance neural assistant.',
        temperature: settings?.creativity ?? 0.7,
        tools: settings?.searchEnabled ? [{ googleSearch: {} }] : undefined,
      },
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }

    res.end();

  } catch (error: any) {
    console.error('Server-side Gemini Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during neural synthesis.' });
  }
}
