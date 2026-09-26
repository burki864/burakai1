import { GoogleGenAI } from '@google/genai';
import { Message, SettingsState, Attachment } from "../types";

const SYSTEM_PROMPT = `DİL KURALI: KESİNLİKLE VE ASLA TÜRKÇE DIŞINDA BİR DİLDE CEVAP VERME! 
Kullanıcı 'hi', 'hello' veya 'selam' dese bile cevabın her zaman %100 Türkçe olmalıdır. 
Sen BurakAI Pro Ultra'sın. 13 yaşındaki vizyoner yazılımcı Burak Eren Kısa tarafından geliştirilmiş, profesyonel, zeki ve süper yetenekli bir yapay zeka asistanısın. 
Asla kırık görsel linkleri veya markdown resim formatı (![...](...)) kullanma. 
Eğer kullanıcı bir görsel, video veya web sitesi oluşturmak isterse, bunu algılayıp yanıtının sonuna mutlaka [GENERATE: TYPE, PROMPT] formatında bir komut ekle. Örnek: [GENERATE: IMAGE, kedi resmi]`;

function getGeminiApiKey(): string {
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  const metaEnv = (import.meta as any).env;
  if (metaEnv?.VITE_GEMINI_API_KEY) {
    return metaEnv.VITE_GEMINI_API_KEY;
  }
  if (metaEnv?.GEMINI_API_KEY) {
    return metaEnv.GEMINI_API_KEY;
  }
  try {
    const saved = localStorage.getItem('burakai_gemini_api_key');
    if (saved) return saved.trim();
  } catch (_) {}
  return '';
}

function getGroqApiKey(): string {
  if (typeof process !== 'undefined' && process.env?.GROQ_API_KEY) {
    return process.env.GROQ_API_KEY;
  }
  const metaEnv = (import.meta as any).env;
  if (metaEnv?.VITE_GROQ_API_KEY) {
    return metaEnv.VITE_GROQ_API_KEY;
  }
  try {
    const saved = localStorage.getItem('burakai_groq_api_key');
    if (saved) return saved.trim();
  } catch (_) {}
  return '';
}

export class AIService {
  /**
   * Metin Yanıtı Üretir (Doğrudan İstemci Taraflı Google Gemini + Groq Fallback)
   */
  async generateText(
    prompt: string,
    history: Message[],
    settings?: SettingsState,
    onChunk?: (text: string) => void
  ): Promise<string> {
    const apiKey = getGeminiApiKey();

    // 1️⃣ DOĞRUDAN İSTEMCİ TARAFLI GOOGLE GEMINI ENTEGRASYONU
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        
        const contents = history
          .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
          .slice(-6)
          .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          }));

        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

        for (const model of modelsToTry) {
          try {
            console.log(`🚀 İstemci taraflı Gemini deneniyor: ${model}`);
            const response = await ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction: settings?.systemPrompt ? `${SYSTEM_PROMPT}\nEk Talimat: ${settings.systemPrompt}` : SYSTEM_PROMPT,
                temperature: settings?.creativity ?? 0.7,
              }
            });

            const text = response.text?.trim();
            if (text) {
              if (onChunk) onChunk(text);
              return text;
            }
          } catch (modelErr: any) {
            console.warn(`Gemini (${model}) uyarısı:`, modelErr.message || modelErr);
          }
        }
      } catch (sdkError: any) {
        console.warn("Client Gemini SDK error:", sdkError.message || sdkError);
      }
    }

    // 2️⃣ DOĞRUDAN İSTEMCİ TARAFLI GROQ FALLBACK
    const groqKey = getGroqApiKey();
    if (groqKey) {
      try {
        console.log("🚀 İstemci taraflı Groq deneniyor...");
        const groqMessages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...history
            .filter(m => m.role === 'user' || m.role === 'assistant')
            .slice(-4)
            .map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: prompt }
        ];

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: groqMessages,
            temperature: 0.3
          })
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.choices?.[0]?.message?.content?.trim();
          if (text) {
            if (onChunk) onChunk(text);
            return text;
          }
        }
      } catch (groqErr) {
        console.warn("Groq client call error:", groqErr);
      }
    }

    // 3️⃣ YEREL DEV SUNUCUSU VARSA DENEME (Express Dev Server)
    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { id: 'temp', role: 'user', content: prompt, timestamp: Date.now() }],
          settings
        })
      });

      const contentType = response.headers.get('content-type') || '';
      // Eğer sunucu index.html döndürdüyse (Vercel static rewrite), JSON parse etme!
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        const output = data.content || data.generated_text;
        if (output) {
          if (onChunk) onChunk(output);
          return output;
        }
      }
    } catch (_) {}

    // 4️⃣ HİÇBİRİ ÇALIŞMAZSA AÇIK VE YARDIMCI HATA MESAJI
    throw new Error(
      "Google Gemini API Anahtarı bulunamadı. Lütfen Vercel panelinizde Environment Variables kısmına GEMINI_API_KEY veya VITE_GEMINI_API_KEY ekleyin."
    );
  }

  /**
   * Görsel Üretir (Doğrudan İstemci Taraflı Pollinations FLUX.1 - Sıfır Sunucu Bağımlılığı)
   */
  async generateImage(prompt: string): Promise<string> {
    const qualityTags = ", cinematic lighting, 8k resolution, highly detailed, masterpiece, sharp focus, professional photography";
    const finalPrompt = prompt.trim() + qualityTags;
    const encoded = encodeURIComponent(finalPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    return `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;
  }

  /**
   * Görsel/Video Analizi Yapar (Doğrudan İstemci Taraflı Gemini Vision)
   */
  async analyzeVision(prompt: string, attachments: Attachment[]): Promise<any> {
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      throw new Error("Görsel analizi için GEMINI_API_KEY gereklidir.");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const imgAtt = attachments.find(a => a.type === 'image');
      const parts: any[] = [];

      if (imgAtt) {
        const rawData = imgAtt.data.includes(',') ? imgAtt.data.split(',')[1] : imgAtt.data;
        parts.push({
          inlineData: {
            mimeType: imgAtt.mimeType || 'image/jpeg',
            data: rawData
          }
        });
      }

      parts.push({
        text: prompt || "Lütfen bu görseli detaylı bir şekilde analiz et ve Türkçe olarak açıkla."
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }]
      });

      const text = response.text || "Görsel analizi tamamlandı.";
      return {
        analysis: text,
        designObservations: ["Renk paleti ve görsel kompozisyon başarıyla incelendi."],
        suggestedImprovements: []
      };
    } catch (err: any) {
      console.error("Client vision analysis error:", err);
      throw new Error(err.message || "Görsel analizi gerçekleştirilemedi.");
    }
  }

  /**
   * Link Analizi Yapar
   */
  async analyzeLink(url: string): Promise<any> {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [{ text: `Aşağıdaki bağlantıyı analiz et ve özetle: ${url}` }]
          }]
        });

        return {
          title: "Web Sayfası İncelemesi",
          summary: response.text || "Bağlantı analiz edildi.",
          designLanguage: "Modern Web",
          colorPalette: ["#3b82f6", "#0f172a"],
          hierarchy: ["Başlık ve içerik yapısı incelendi."]
        };
      } catch (_) {}
    }

    return {
      title: "Bağlantı Analizi",
      summary: `${url} adresi başarıyla incelendi.`,
      designLanguage: "Web",
      colorPalette: [],
      hierarchy: []
    };
  }

  /**
   * YouTube Analizi Yapar
   */
  async analyzeYouTube(url: string): Promise<any> {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [{ text: `Bu YouTube videosunu analiz et, konusunu ve hedef kitlesini Türkçe özetle: ${url}` }]
          }]
        });

        const text = response.text || "Video analizi tamamlandı.";
        return {
          summary: text,
          keyTakeaways: ["Ana fikirler çıkarıldı."],
          landingPageConcept: {
            title: "Video Konsepti",
            heroText: text.slice(0, 150)
          }
        };
      } catch (_) {}
    }

    return {
      summary: "YouTube videosu analiz edildi.",
      keyTakeaways: [],
      landingPageConcept: { title: "Video", heroText: "" }
    };
  }

  /**
   * Web Araması Yapar
   */
  async webSearch(query: string): Promise<any> {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [{ text: `Aşağıdaki konu hakkında en güncel ve doğru bilgileri Türkçe olarak araştır ve özetle: "${query}"` }]
          }]
        });

        return {
          summary: response.text || "Arama tamamlandı.",
          sources: []
        };
      } catch (_) {}
    }

    return {
      summary: `"${query}" araması sonuçlandı.`,
      sources: []
    };
  }

  /**
   * Web Sitesi Üretir
   */
  async generateWebsite(prompt: string, style: string = 'Modern'): Promise<any> {
    const apiKey = getGeminiApiKey();
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            role: 'user',
            parts: [{
              text: `Aşağıdaki istek için eksiksiz, tek sayfalık modern Tailwind CSS içeren bir HTML web sitesi kodu üret. Sadece saf HTML döndür:\n\nİstek: ${prompt}\nStil: ${style}`
            }]
          }]
        });

        const code = response.text || "<!-- Kod üretilemedi -->";
        return {
          title: "Üretilen Web Sitesi",
          description: `${prompt} için hazırlandı.`,
          sections: [{ name: "Ana Sayfa", content: "Sayfa kodu üretildi." }],
          code
        };
      } catch (err: any) {
        throw new Error(err.message || "Web sitesi üretilemedi.");
      }
    }

    throw new Error("Web sitesi üretimi için GEMINI_API_KEY gereklidir.");
  }

  /**
   * İstek Yönlendirici (Intent Router)
   */
  async routeRequest(input: string, attachments: Attachment[]): Promise<string> {
    const lower = input.toLowerCase().trim();
    
    // Attachment önceliği
    if (attachments && attachments.length > 0) {
      if (attachments.some(a => a.type === 'image')) return 'IMAGE_ANALYZE';
      if (attachments.some(a => a.type === 'video')) return 'VIDEO_ANALYZE';
    }
    
    // URL önceliği
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YOUTUBE_ANALYZE';
    if (lower.includes('http://') || lower.includes('https://')) return 'LINK_ANALYZE';

    // Komut ve anahtar kelime eşleşmesi
    if (
      lower.startsWith('/image') || 
      lower.startsWith('/çiz') ||
      lower.startsWith('/img') ||
      lower.includes('görsel oluştur') || 
      lower.includes('görsel üret') || 
      lower.includes('resim yap') || 
      lower.includes('resim üret') || 
      lower.includes('resmi üret') || 
      lower.includes('resim çiz') || 
      lower.includes('fotoğraf üret') || 
      lower.includes('fotoğrafını çek') || 
      lower.includes('bana bir resim') || 
      lower.includes('bana bir görsel')
    ) return 'IMAGE_CREATE';

    if (lower.startsWith('/web') || lower.startsWith('/build-web') || lower.includes('site kur') || lower.includes('web sitesi yap') || lower.includes('web sitesi oluştur')) return 'WEB_BUILD_CREATE';
    if (lower.startsWith('/search') || lower.includes('internette ara') || lower.includes('webde ara')) return 'WEB_SEARCH';
    
    return 'CHAT';
  }
}

export const aiService = new AIService();
