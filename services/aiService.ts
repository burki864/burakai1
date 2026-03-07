import { Message, SettingsState } from "../types";

const MODELS = {
  CHAT: "Qwen/Qwen2.5-72B-Instruct", 
  IMAGE: "black-forest-labs/FLUX.1-schnell", 
  VIDEO: "ali-vilab/modelscope-damo-text-to-video-synthesis" 
};

// API Endpoint'leri
const API_ENDPOINTS = {
  CHAT: "/api/chat",
  IMAGE: "/api/image",
  VIDEO: "/api/video"
};

export class AIService {
  async generateText(
    prompt: string,
    history: Message[],
    settings?: SettingsState,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const fullPrompt = `User: ${prompt}\nAssistant:`;

    try {
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: { 
            max_new_tokens: 1024, 
            return_full_text: false,
            wait_for_model: true 
          }
        })
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorDetail}`);
      }

      const result = await response.json();
      let output = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
      
      if (!output) throw new Error("Modelden boş yanıt döndü.");
      const cleanOutput = output.replace(/Assistant:/g, "").trim();
      
      if (onChunk) onChunk(cleanOutput);
      return cleanOutput;

    } catch (error: any) {
      console.error("Chat Hatası:", error);
      throw new Error(`[Bağlantı Hatası]: ${error.message}`);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await fetch(API_ENDPOINTS.IMAGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Görsel Hatası:", error);
      throw error;
    }
  }

  async generateVideo(prompt: string, aspectRatio?: string): Promise<string> {
    try {
      const response = await fetch(API_ENDPOINTS.VIDEO, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Video Hatası:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();