
import { SettingsState, Message, Attachment } from "../types";
import { GoogleGenAI } from "@google/genai";

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

  async generateVideo(prompt: string, aspectRatio: '16:9' | '9:16' = '16:9', onProgress?: (msg: string) => void): Promise<string> {
    // Create fresh instance to use latest API key from selection dialog
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    onProgress?.("Initiating neural video synthesis...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    onProgress?.("Synthesizing frames in the cloud...");
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      onProgress?.(this.getRandomLoadingMessage());
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Neural synthesis failed to produce content.");

    onProgress?.("Finalizing video stream...");
    // Must append API key when fetching from the download link
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  private getRandomLoadingMessage() {
    const messages = [
      "Encoding temporal dimensions...",
      "Interpolating motion vectors...",
      "Refining neural textures...",
      "Spatio-temporal synthesis in progress...",
      "Applying cinematic lighting...",
      "Stabilizing visual coherence...",
      "Dreaming the pixels into existence...",
      "Mapping neural pathways..."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

export const geminiService = new GeminiService();
