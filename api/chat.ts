
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'edge', // Using Edge runtime for faster streaming if on Vercel
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const { prompt, history, settings } = await req.json();

    if (!process.env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Backend configuration error: Missing API Key' }), { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Fix: Use ai.chats.create instead of ai.models.getGenerativeModel which is not available in the modern SDK
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

    // Fix: sendMessageStream takes a structured message object and returns an async iterable of responses
    const streamResponse = await chat.sendMessageStream({ message: prompt });

    // Create a ReadableStream to stream the chunks back to the frontend
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Fix: Iterate directly over the response from sendMessageStream
          for await (const chunk of streamResponse) {
            // Fix: Access the .text property directly instead of calling it as a method
            const text = chunk.text;
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
        } catch (e) {
          console.error('Streaming error:', e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (error: any) {
    console.error('API Chat Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
  }
}
