
import { SettingsState, Message, Attachment } from "../types";

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

  async generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio }),
      });
      if (!response.ok) throw new Error('Failed to synthesize image');
      const data = await response.json();
      return data.imageUrl;
    } catch (error: any) {
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
