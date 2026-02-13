
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, aspectRatio, userId } = req.body;

  if (!prompt || !userId) {
    return res.status(400).json({ error: 'Missing required parameters: prompt or userId' });
  }

  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'Neural link failed: API_KEY is missing.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Initiate Veo generation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9'
      }
    });

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 15; // 15 * 5s = 75s (Serverless timeout usually around 60s, so this is aggressive)
    
    while (!operation.done && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
      attempts++;
    }

    if (!operation.done) {
      throw new Error("Video synthesis is taking longer than expected. Please check your history in a few moments.");
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("Video synthesis failed: No output URI returned.");
    }

    // Append API key for download
    const videoUrl = `${downloadLink}&key=${API_KEY}`;

    return res.status(200).json({ videoUrl });

  } catch (error: any) {
    console.error('Veo Production Error:', error);
    return res.status(500).json({ error: error.message || 'An internal error occurred during synthesis.' });
  }
}
