
import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, aspectRatio = "1:1" } = req.body;
    // Türkçe image tetikleyici kontrolü (sadece ekleme)
    let finalPrompt = prompt.trim();
    const lower = finalPrompt.toLowerCase();
    const triggers = ["resim", "görsel", "çiz"];

    const hasTrigger = triggers.some(t => lower.includes(t));
    if (!hasTrigger) {
      return res.status(400).json({ error: "Image trigger word not found." });
    }

    // tetik kelimeleri prompttan temizle
    triggers.forEach(t => {
      finalPrompt = finalPrompt.replace(new RegExp(t, "gi"), "");
    });
    finalPrompt = finalPrompt.trim();

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'Neural link failed: API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Using gemini-2.5-flash-image as per guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: `Generate a high-quality, cinematic, ultra-realistic image of: ${finalPrompt}` }] }],
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any || "1:1"
        }
      }
    });

    let imageUrl = '';
    // Iterate through parts to find the image data
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      throw new Error("No image data returned from neural core.");
    }

    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('[GENERATE-IMAGE ERROR]', error);
    return res.status(500).json({ 
      error: error.message || 'Vision synthesis link failed. Neural core may be overloaded.' 
    });
  }
}
