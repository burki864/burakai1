
import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { SettingsState, Message, Attachment } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Generates a text stream using gemini-3-flash-preview.
   */
  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    attachments: Attachment[],
    onChunk: (text: string) => void
  ): Promise<string> {
    try {
      const ai = this.getAI();
      
      const contents = history.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

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
   * Synthesizes image using gemini-2.5-flash-image.
   * Iterates through parts to find synthesized image data.
   */
  async generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
    try {
      const ai = this.getAI();
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

      // The model may return multiple parts; find the one with image data
      const candidates = response.candidates || [];
      if (candidates.length > 0) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      throw new Error('Neural core synthesis complete, but no image payload was found in the stream.');
    } catch (error: any) {
      console.error('Image Synthesis Error:', error);
      throw error;
    }
  }

  /**
   * Synthesizes cinematic video using veo-3.1-fast-generate-preview.
   */
  async generateVideo(
    prompt: string, 
    userId: string, 
    aspectRatio: '16:9' | '9:16' = '16:9', 
    onProgress?: (msg: string) => void
  ): Promise<string> {
    onProgress?.("Validating Neural Credentials...");
    
    // Check for required API Key selection for Veo models
    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      await aistudio.openSelectKey();
    }

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

      onProgress?.("Neural core processing temporal vectors...");

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
        onProgress?.("Synthesizing motion frames...");
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video synthesis failed: Missing download URI.");

      const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!videoResponse.ok) throw new Error("Failed to retrieve synthesized motion packet.");

      const blob = await videoResponse.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Veo Synthesis Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
