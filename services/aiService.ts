import { SettingsState, Message, Attachment } from "../types";

const MODELS = {
  CHAT: "Qwen/Qwen2.5-72B-Instruct", // Çok zeki ve okunaklı Türkçe yanıtlar
  IMAGE: "black-forest-labs/FLUX.1-schnell", // Hızlı ve yüksek kalite görsel
  VIDEO: "ali-vilab/modelscope-damo-text-to-video-synthesis" // Temel video üretimi
};

export class AIService {
  private getApiKey(): string {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_TOKEN;
    if (!apiKey) {
      throw new Error("Hugging Face Token bulunamadı. Lütfen Vercel panelinden VITE_HUGGINGFACE_TOKEN değişkenini ekleyin.");
    }
    return apiKey;
  }

  /**
   * Yanıtı daha okunaklı hale getirmek için metni manipüle eder.
   */
  private formatResponse(text: string): string {
    return text
      .replace(/([.!?])\s*(?=[A-ZÇĞİÖŞÜ])/g, "$1\n\n") // Cümle sonlarına çift satır ekler
      .trim();
  }

  /**
   * Chat Fonksiyonu (Hugging Face Inference API)
   */
  async generateText(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const apiKey = this.getApiKey();
    
    // Sistem talimatı ile okunaklılık zorunluluğu
    const systemInstruction = `Sen BurakAI'sın. Yanıtlarını her zaman ferah, paragraflar arasında boşluk bırakarak ve okunaklı bir şekilde ver.`;
    
    // Geçmişi formatla
    const formattedHistory = history.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join("\n");
    const fullPrompt = `<|system|>\n${systemInstruction}\n${formattedHistory}\nUser: ${prompt}\nAssistant:`;

    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${MODELS.CHAT}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: { max_new_tokens: 1024, temperature: 0.7 }
        })
      });

      const result = await response.json();
      let output = result[0]?.generated_text || "";
      
      // Sadece asistanın cevabını al (Prompt'u temizle)
      if (output.includes("Assistant:")) {
        output = output.split("Assistant:").pop();
      }

      const cleanOutput = this.formatResponse(output);
      if (onChunk) onChunk(cleanOutput); // Simüle edilmiş chunk
      
      return cleanOutput;
    } catch (error) {
      console.error("Chat Hatası:", error);
      throw error;
    }
  }
  /**
   * Görsel Üretim Fonksiyonu
   */
  /**
   * Görsel Üretim Fonksiyonu
   */
  async generateImage(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${MODELS.IMAGE}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ inputs: prompt })
      });

      const blob = await response.blob();
      return URL.createObjectURL(blob); // Base64 yerine blob URL döner (daha performanslı)
    } catch (error) {
      console.error("Görsel Hatası:", error);
      throw error;
    }
  }

  /**
   * Video Üretim Fonksiyonu
   */
  async generateVideo(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${MODELS.VIDEO}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}` },
        body: JSON.stringify({ inputs: prompt })
      });

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Video Hatası:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();