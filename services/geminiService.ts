
import { SettingsState, Message } from "../types";

export class GeminiService {
  /**
   * Proxies the request to our backend API to handle streaming safely.
   */
  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    onChunk: (text: string) => void
  ) {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history, settings }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to connect to Neural Core');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (!reader) throw new Error("Stream reader not available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onChunk(chunk);
      }

      return fullText;
    } catch (error: any) {
      console.error("Frontend Service Error:", error);
      throw new Error(error.message || "Neural Link Interrupted.");
    }
  }

  /**
   * Proxies image generation to the backend.
   */
  async generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to synthesize image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error: any) {
      console.error("Image Synthesis Error:", error);
      throw new Error(error.message || "Neural Image synthesis failed.");
    }
  }
}

export const geminiService = new GeminiService();
