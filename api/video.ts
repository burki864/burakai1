
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt, resolution = '1080p', aspectRatio = '16:9' } = req.body;

  try {
    if (!process.env.API_KEY) throw new Error('API_KEY is not configured on the server.');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: resolution as any,
        aspectRatio: aspectRatio as any
      }
    });

    // Poll for operation completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    
    if (!downloadLink) throw new Error("Video synthesis returned no content.");

    // Return the download link; client will fetch with key appended
    return res.status(200).json({ 
      videoUrl: `${downloadLink}&key=${process.env.API_KEY}` 
    });

  } catch (error: any) {
    console.error('API Video Error:', error);
    return res.status(500).json({ error: error.message || 'Video synthesis failed.' });
  }
}
