import { GoogleGenAI, Modality } from "@google/genai";
import { SettingsState, Message, Attachment, Language } from "../types";

// Tip güvenliği için modelleri bir enum veya sabit olarak tutmak daha iyidir
const MODELS = {
  TEXT_FAST: "gemini-1.5-flash",
  TEXT_SMART: "gemini-1.5-pro",
  IMAGE_DEFAULT: "gemini-2.5-flash-image",
  IMAGE_PRO: "gemini-3-pro-image-preview",
  VIDEO: "veo-3.1-fast-generate-preview",
  SPEECH: "gemini-2.5-flash-preview-tts"
};

export class GeminiService {
  private genAI: GoogleGenAI | null = null;

  /**
   * AI örneğini bir kez oluşturup cache'liyoruz. 
   * Her metod çağrıldığında yeniden instance oluşturmak maliyetlidir.
   */
  private getAI(): GoogleGenAI {
    if (this.genAI) return this.genAI;

    // Tarayıcı ve ortam değişkeni kontrolü (Vite, Next.js ve Node uyumlu)
    const apiKey = 
      (import.meta as any)?.env?.VITE_GEMINI_API_KEY || 
      process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
      process.env.GEMINI_API_KEY || 
      (window as any).process?.env?.API_KEY;

    if (!apiKey) {
      throw new Error("Gemini API Key bulunamadı. Lütfen .env dosyanızı kontrol edin.");
    }

    this.genAI = new GoogleGenAI({ apiKey });
    return this.genAI;
  }

  /**
   * Metin akışını optimize edilmiş şekilde yönetir.
   */
  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    attachments: Attachment[],
    onChunk: (text: string) => void,
    researchEnabled: boolean = false
  ) {
    const ai = this.getAI();
    const modelName = researchEnabled ? MODELS.TEXT_FAST : MODELS.TEXT_SMART;
    const model = ai.getGenerativeModel({ 
      model: modelName,
      systemInstruction: settings.systemPrompt || `You are BurakAI. Personality: ${settings.personality}. Language: ${settings.language}.`
    });

    // Geçmiş mesajları ve ekleri formatla
    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [
          { text: prompt },
          ...attachments
            .filter(att => ['image', 'video'].includes(att.type))
            .map(att => ({
              inlineData: { data: att.data, mimeType: att.mimeType }
            }))
        ]
      }
    ];

    const tools = researchEnabled ? [{ googleSearch: {} }] : [];

    try {
      const result = await model.generateContentStream({
        contents,
        generationConfig: {
          temperature: settings.creativity,
          topP: 0.95,
        },
        tools,
      });

      let fullText = "";
      const groundingUrls: { title: string; uri: string }[] = [];

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          onChunk(text);
        }

        // Grounding verilerini topla
        const metadata = chunk.candidates?.[0]?.groundingMetadata;
        metadata?.groundingChunks?.forEach((c: any) => {
          if (c.web) groundingUrls.push({ title: c.web.title, uri: c.web.uri });
        });
      }

      return { text: fullText, groundingUrls: groundingUrls.length > 0 ? groundingUrls : undefined };
    } catch (error) {
      console.error("Metin üretimi sırasında hata:", error);
      throw error;
    }
  }

  /**
   * Görsel üretimi için hata toleranslı yapı.
   */
  async generateImage(prompt: string, aspectRatio = "1:1", imageSize = "1K"): Promise<string> {
    const ai = this.getAI();
    const usePro = imageSize !== "1K";
    const modelName = usePro ? MODELS.IMAGE_PRO : MODELS.IMAGE_DEFAULT;
    
    try {
      const model = ai.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          // @ts-ignore - SDK tip tanımı bazen imageConfig'i kapsamayabilir
          imageConfig: { aspectRatio, ...(usePro ? { imageSize } : {}) }
        }
      });

      const part = result.response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (!part?.inlineData) throw new Error("Görsel verisi alınamadı.");

      return `data:image/png;base64,${part.inlineData.data}`;
    } catch (error: any) {
      // Pro model hata verirse otomatik olarak Flash modeline dön (Fallback)
      if (usePro) return this.generateImage(prompt, aspectRatio, "1K");
      throw error;
    }
  }

  /**
   * Ses sentezleme (TTS)
   */
  async generateSpeech(text: string, language: Language = Language.EN): Promise<string> {
    const ai = this.getAI();
    try {
      const model = ai.getGenerativeModel({ model: MODELS.SPEECH });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Say in ${language}: ${text}` }] }],
        generationConfig: {
          responseModalities: [Modality.AUDIO],
          // @ts-ignore
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
        }
      });

      const audioData = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!audioData) throw new Error("Ses üretilemedi.");
      
      return `data:audio/wav;base64,${audioData}`;
    } catch (error) {
      console.error("TTS Hatası:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();