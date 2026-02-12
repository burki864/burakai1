
// Refactored to use official @google/genai SDK for all neural synthesis tasks
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SettingsState, Message, Attachment } from "../types";

export class GeminiService {
  /**
   * Generates a text stream using Gemini 3 Flash for high-performance neural chat.
   */
  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    attachments: Attachment[],
    onChunk: (text: string) => void
  ): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      // Integrate vision capabilities if attachments are present
      const currentParts: any[] = [{ text: prompt }];
      attachments.forEach(att => {
        currentParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data
          }
        });
      });

      contents.push({
        role: 'user',
        parts: currentParts
      });

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents,
        config: {
          systemInstruction: settings.systemPrompt,
          temperature: settings.creativity,
          tools: settings.searchEnabled ? [{ googleSearch: {} }] : undefined,
          thinkingConfig: { thinkingBudget: 0 } // Optimization for real-time responsiveness
        },
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }

      return fullText;
    } catch (error: any) {
      console.error("Neural Link Interrupted:", error);
      throw error;
    }
  }

  /**
   * Synthesizes a high-fidelity image using gemini-2.5-flash-image.
   */
  async generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
    console.log("Synthesizing Vision for:", prompt);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any
          }
        }
      });

      let imageUrl = "";
      // Iterate candidates to extract synthesized image data
      const candidates = response.candidates || [];
      if (candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!imageUrl) {
        throw new Error('Vision synthesis failed: Image data missing from neural response.');
      }

      return imageUrl;
    } catch (error: any) {
      console.error('Image Generation Service Error:', error);
      throw error;
    }
  }

  /**
   * Synthesizes cinematic video using veo-3.1-fast-generate-preview.
   */
  async generateVideo(prompt: string, userId: string, aspectRatio: '16:9' | '9:16' = '16:9', onProgress?: (msg: string) => void): Promise<string> {
    onProgress?.("Initiating Veo Cinematic Synthesis...");
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio
        }
      });

      onProgress?.("Neural core processing temporal vectors... (Estimated: 1-2m)");

      // Poll neural operation until synthesis is finalized
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("Failed to retrieve finalized cinematic synthesis.");
      }

      // Securely fetch MP4 data utilizing current neural key
      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) {
        throw new Error("Failed to download synthesized motion node.");
      }

      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Veo Synthesis Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
