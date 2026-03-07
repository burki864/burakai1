import { Message } from "../types";

const MODELS = {
  CHAT: "Qwen/Qwen2.5-72B-Instruct", 
  IMAGE: "black-forest-labs/FLUX.1-schnell", 
  VIDEO: "ali-vilab/modelscope-damo-text-to-video-synthesis" 
};

// CORS hatasını aşmak için proxy URL'si (Gerekirse başına eklenir)
const PROXY_URL = "https://corsproxy.io/?"; 

export class AIService {
  private getApiKey(): string {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_TOKEN || import.meta.env.VITE_HUGGING_FACE_TOKEN;
    if (!apiKey) throw new Error("KRİTİK HATA: VITE_HUGGINGFACE_TOKEN bulunamadı!");
    return apiKey.trim();
  }

  /**
   * Chat Fonksiyonu - Detaylı Hata Yakalama Eklenmiş
   */
  async generateText(prompt: string, history: Message[]): Promise<string> {
    const apiKey = this.getApiKey();
    const fullPrompt = `User: ${prompt}\nAssistant:`;
    const targetUrl = `${PROXY_URL}https://api-inference.huggingface.co/models/${MODELS.CHAT}`;

    try {
      const response = await fetch(targetUrl, {
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

      // HTTP Hata Kontrolü (401, 429, 503 vb.)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[HF Sunucu Hatası ${response.status}]: ${errorText}`);
      }

      const result = await response.json();
      let output = Array.isArray(result) ? result[0]?.generated_text : result.generated_text;
      
      if (!output) throw new Error("Modelden geçerli bir metin dönmedi.");
      return output.replace(/Assistant:/g, "").trim();

    } catch (error: any) {
      // Hatayı açıkça konsola ve UI'a gönderiyoruz
      const detailedError = `[Chat Hatası]: ${error.message || "Bağlantı kurulamadı"}`;
      console.error(detailedError);
      throw new Error(detailedError);
    }
  }

  /**
   * Görsel Üretim Fonksiyonu - Detaylı Hata Yakalama Eklenmiş
   */
  async generateImage(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    const targetUrl = `${PROXY_URL}https://api-inference.huggingface.co/models/${MODELS.IMAGE}`;

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: prompt })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`[HF Görsel Hatası ${response.status}]: ${errorText}`);
      }

      const blob = await response.blob();
      if (blob.size < 100) throw new Error("Gelen veri bir görsel değil.");
      
      return URL.createObjectURL(blob);
    } catch (error: any) {
      const detailedError = `[Görsel Hatası]: ${error.message}`;
      console.error(detailedError);
      throw new Error(detailedError);
    }
  }
}

export const aiService = new AIService();