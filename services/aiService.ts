import { Message, SettingsState } from "../types";

const MODELS = {
  CHAT: "Qwen/Qwen2.5-72B-Instruct", 
  IMAGE: "black-forest-labs/FLUX.1-schnell", 
  VIDEO: "ali-vilab/modelscope-damo-text-to-video-synthesis" 
};

export class AIService {
  private getApiKey(): string {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_TOKEN || import.meta.env.VITE_HUGGING_FACE_TOKEN;
    if (!apiKey) throw new Error("API Token eksik!");
    return apiKey.trim();
  }

  async generateText(
    prompt: string,
    history: Message[],
    settings?: SettingsState,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const fullPrompt = `User: ${prompt}\nAssistant:`;

    try {
      // Proxy üzerinden gidiyoruz
      const response = await fetch(`/models/${MODELS.CHAT}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: { max_new_tokens: 1024, return_full_text: false }
        })
      });

      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorDetail}`);
      }

      const result = await response.json();
      let output = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
      
      if (!output) throw new Error("Boş yanıt.");
      const cleanOutput = output.replace(/Assistant:/g, "").trim();
      
      if (onChunk) onChunk(cleanOutput);
      return cleanOutput;

    } catch (error: any) {
      console.error("Chat Hatası:", error);
      // Ekranda hatayı görebilmen için hatayı fırlatıyoruz
      throw new Error(`[Bağlantı Hatası]: ${error.message}`);
    }
  }

  async generateImage(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    try {
      const response = await fetch(`/models/${MODELS.IMAGE}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
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
    const apiKey = this.getApiKey();
    try {
      const response = await fetch(`/models/${MODELS.VIDEO}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
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