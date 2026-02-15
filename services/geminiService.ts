
import { SettingsState, Message, Attachment } from "../types";

export class GeminiService {
  /**
   * Routes chat request to /api/chat (Server-side Gemini)
   */
  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    attachments: Attachment[],
    onChunk: (text: string) => void,
    researchEnabled: boolean = false
  ): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history, settings, attachments, researchEnabled })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Synthesis failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error('Response stream unavailable');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        onChunk(chunk);
      }

      return fullText;
    } catch (error: any) {
      console.error("Neural Link Interrupted:", error);
      throw error;
    }
  }

  /**
   * Routes image synthesis to /api/generate-image
   */
  async generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Image synthesis failed');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error: any) {
      console.error('Image Synthesis Error:', error);
      throw error;
    }
  }

  /**
   * Routes video synthesis to /api/generate-video
   */
  async generateVideo(
    prompt: string, 
    userId: string, 
    aspectRatio: '16:9' | '9:16' = '16:9', 
    onProgress?: (msg: string) => void
  ): Promise<string> {
    onProgress?.("Initiating Proxy Uplink...");
    
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, userId, aspectRatio })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Video synthesis failed');
      }

      const data = await response.json();
      return data.videoUrl;
    } catch (error: any) {
      console.error("Video Proxy Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
