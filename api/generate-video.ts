import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

/**
 * Handles video generation using the Veo 3.1 Fast model.
 * Polls for operation completion to return the final MP4 download link.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for video synthesis.' });
    }

    // Initialize the Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Initiate video generation operation
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio as any
      }
    });

    // Poll for operation completion. 
    // Note: Video generation can take time; we poll within the handler's execution window.
    const startTime = Date.now();
    const pollTimeout = 50000; // 50 seconds limit for serverless environment

    while (!operation.done && (Date.now() - startTime < pollTimeout)) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation });
    }

    // If still in progress after timeout, return the operation name for potential client-side polling
    if (!operation.done) {
      return res.status(202).json({ 
        message: 'Synthesis in progress. High-quality neural rendering takes time.',
        operationId: (operation as any).name 
      });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error('Video generation failed: Synthesis result unavailable.');
    }

    // Secure the download link with the API key as per Veo requirements
    const videoUrl = `${downloadLink}&key=${process.env.API_KEY}`;

    return res.status(200).json({ videoUrl });

  } catch (error: any) {
    console.error('[GENERATE-VIDEO ERROR]', error);
    return res.status(500).json({ error: error.message || 'An internal error occurred during synthesis.' });
  }
}
