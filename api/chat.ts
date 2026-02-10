
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs', // Use Node.js runtime for standard process.env access
};

export default async function handler(req: any, res: any) {
  // Handle Vercel Serverless Function signature
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, history, settings } = req.body;

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: 'SERVER_CONFIG_ERROR: Missing API_KEY' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: settings?.systemPrompt || 'You are BurakAI, a professional assistant.',
        temperature: settings?.creativity ?? 0.7,
        topP: 0.95,
        topK: 40,
      },
      history: history.map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      })),
    });

    const streamResponse = await chat.sendMessageStream({ message: prompt });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of streamResponse) {
      if (chunk.text) {
        res.write(chunk.text);
      }
    }
    
    res.end();

  } catch (error: any) {
    console.error('API Chat Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    } else {
      res.end();
    }
  }
}
