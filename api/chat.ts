import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

/**
 * Handles chat requests using Gemini 3 Pro.
 * Provides multi-modal capabilities (text + images) and Google Search grounding.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt, history, settings, attachments } = req.body;
    
    // Initialize the Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Format history for Gemini model (roles: user/model)
    const contents = (history || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Construct the current user turn parts
    const currentParts: any[] = [{ text: prompt }];

    // Inject image attachments for multi-modal context
    if (attachments && Array.isArray(attachments)) {
      attachments.forEach((att: any) => {
        if (att.type === 'image' && att.data) {
          currentParts.push({
            inlineData: {
              data: att.data,
              mimeType: att.mimeType || 'image/jpeg'
            }
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: currentParts
    });

    // Model selection: gemini-3-pro-preview is preferred for "Neural Assistant" complex tasks
    const model = 'gemini-3-pro-preview';

    // Prepare generation configuration
    const generationConfig: any = {
      systemInstruction: settings?.systemPrompt || "You are BurakAI, a high-performance neural assistant.",
      temperature: settings?.creativity ?? 0.7,
    };

    // Enable Google Search grounding if searchEnabled toggle is active in settings
    if (settings?.searchEnabled) {
      generationConfig.tools = [{ googleSearch: {} }];
    }

    // Use streaming mode for real-time responsiveness
    const stream = await ai.models.generateContentStream({
      model: model,
      contents: contents,
      config: generationConfig,
    });

    // Configure response for chunked text streaming
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    for await (const chunk of stream) {
      const chunkText = chunk.text;
      if (chunkText) {
        res.write(chunkText);
      }
    }
    
    res.end();

  } catch (error: any) {
    console.error('Server-side Neural Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during neural synthesis.' });
  }
}
