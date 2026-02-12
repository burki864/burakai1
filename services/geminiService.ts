
import { SettingsState, Message, Attachment } from "../types";
import { MODELS } from "../constants";

export class GeminiService {
  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    attachments: Attachment[],
    onChunk: (text: string) => void
  ): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          history, 
          settings,
          attachments 
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errData.error || 'Connection failed.');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error("Stream unavailable");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
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
   * Generates a high-quality image using the Pollinations Flux model via our backend.
   * Resolves with a direct URL string to prevent component loading hangs.
   */
  async generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
    console.log("Synthesizing Vision for:", prompt);
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      const data = await response.json();
      console.log("API RESPONSE:", data);

      if (!response.ok) {
        throw new Error(data.error || 'Vision synthesis failed at the core.');
      }

      if (typeof data.imageUrl !== 'string') {
        throw new Error('Malformed response: imageUrl is missing or invalid.');
      }

      return data.imageUrl;
    } catch (error: any) {
      console.error('Image Generation Service Error:', error);
      throw error;
    }
  }

  async generateVideo(prompt: string, userId: string, aspectRatio: '16:9' | '9:16' = '16:9', onProgress?: (msg: string) => void): Promise<string> {
    onProgress?.("Initiating Pika Synthesis Flow...");
    
    try {
      const response = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio, userId }),
      });

      if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Pika production link failed.");
      }

      const data = await response.json();
      onProgress?.("Motion vectors calculated. Finalizing clip...");
      return data.videoUrl;
    } catch (error: any) {
      console.error("Pika Service Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
