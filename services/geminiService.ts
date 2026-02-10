
import { SettingsState, Message } from "../types";

export class GeminiService {
  /**
   * Calls the secure /api/chat backend endpoint.
   * Zero SDK usage here prevents the "API KEY REQUIRED" browser error.
   */
  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    onChunk: (text: string) => void
  ): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, history, settings }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown server error' }));
        throw new Error(errData.error || 'Connection to Neural Core failed.');
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
   * Calls the secure /api/image backend endpoint.
   */
  async generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Image synthesis error' }));
        throw new Error(errData.error || 'Failed to synthesize image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error: any) {
      console.error("Image Studio Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
