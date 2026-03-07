import { Message, SettingsState } from "../types";

const MODELS = {
  CHAT: "Qwen/Qwen2.5-72B-Instruct", 
  IMAGE: "black-forest-labs/FLUX.1-schnell", 
  VIDEO: "ali-vilab/modelscope-damo-text-to-video-synthesis" 
};

// En güvenli ve 404 vermeyecek ana URL
const HF_BASE_URL = "https://api-inference.huggingface.co/models";

export class AIService {
  private getApiKey(): string {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_TOKEN || import.meta.env.VITE_HUGGING_FACE_TOKEN;
    if (!apiKey) throw new Error("API Token eksik! .env dosyasını kontrol et.");
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
      const response = await fetch(`${HF_BASE_URL}/${MODELS.CHAT}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: { 
            max_new_tokens: 1024, 
            return_full_text: false,
            wait_for_model: true // Model yüklenene kadar bekler (503 hatasını azaltır)
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

  // Görsel ve Video fonksiyonları da aynı HF_BASE_URL'i kullanmalı
}

export const aiService = new AIService();