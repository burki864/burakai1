
import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function Pattern
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, history, settings } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Model selection based on user settings or pro defaults
    const model = 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history.map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction: settings?.systemPrompt || 'You are BurakAI, a professional assistant.',
        temperature: settings?.creativity ?? 0.7,
        topP: 0.95,
        topK: 40,
      }
    });

    const text = response.text;
    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('API Chat Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
