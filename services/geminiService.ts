
import { GoogleGenAI, Modality, Type, GenerateContentResponse, VideoGenerationReferenceType, VideoGenerationReferenceImage } from "@google/genai";
import { SettingsState, Message, Attachment, Language } from "../types";

export class GeminiService {
  private getAI() {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  /**
   * Generates text stream using Gemini 3 series models
   */
  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    attachments: Attachment[],
    onChunk: (text: string) => void,
    researchEnabled: boolean = false
  ): Promise<{ text: string; groundingUrls?: { title: string; uri: string }[] }> {
    const ai = this.getAI();
    const model = researchEnabled ? "gemini-3-flash-preview" : "gemini-3.1-pro-preview";
    
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Add current prompt and attachments
    const currentParts: any[] = [{ text: prompt }];
    attachments.forEach(att => {
      if (att.type === 'image' || att.type === 'video') {
        currentParts.push({
          inlineData: {
            data: att.data,
            mimeType: att.mimeType
          }
        });
      }
    });

    contents.push({ role: 'user', parts: currentParts });

    const tools: any[] = [];
    if (researchEnabled) {
      tools.push({ googleSearch: {} });
    }

    try {
      const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: settings.systemPrompt || `You are BurakAI, a highly advanced neural assistant. Personality: ${settings.personality}. Language: ${settings.language}.`,
          tools,
          temperature: settings.creativity,
        }
      });

      let fullText = "";
      let groundingUrls: { title: string; uri: string }[] = [];

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
        
        // Extract grounding metadata if available (usually in the last chunk or metadata)
        const chunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
          chunks.forEach((c: any) => {
            if (c.web) {
              groundingUrls.push({ title: c.web.title, uri: c.web.uri });
            }
          });
        }
      }

      return { text: fullText, groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined };
    } catch (error: any) {
      console.error("Neural Link Interrupted:", error);
      throw error;
    }
  }

  /**
   * Generates images using gemini-3-pro-image-preview
   */
  async generateImage(prompt: string, aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1", imageSize: "1K" | "2K" | "4K" = "1K"): Promise<string> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize
          }
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      throw new Error("No image data received from neural uplink.");
    } catch (error: any) {
      console.error('Image Synthesis Error:', error);
      throw error;
    }
  }

  /**
   * Generates video using veo-3.1-fast-generate-preview
   */
  async generateVideo(
    prompt: string, 
    userId: string, 
    aspectRatio: '16:9' | '9:16' = '16:9', 
    onProgress?: (msg: string) => void
  ): Promise<string> {
    const ai = this.getAI();
    onProgress?.("Initiating Veo Synthesis...");
    
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
          numberOfVideos: 1,
          resolution: '1080p',
          aspectRatio
        }
      });

      while (!operation.done) {
        onProgress?.("Neural Rendering in Progress...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) throw new Error("Video generation failed - no link received.");

      const response = await fetch(downloadLink, {
        method: 'GET',
        headers: {
          'x-goog-api-key': process.env.GEMINI_API_KEY || '',
        },
      });

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Video Proxy Error:", error);
      throw error;
    }
  }

  /**
   * Generates speech using gemini-2.5-flash-preview-tts
   */
  async generateSpeech(text: string, language: Language = Language.EN): Promise<string> {
    const ai = this.getAI();
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say clearly in ${language === Language.TR ? 'Turkish' : 'English'}: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return `data:audio/wav;base64,${base64Audio}`;
      }
      throw new Error("Speech synthesis failed.");
    } catch (error: any) {
      console.error("TTS Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
