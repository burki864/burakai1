import { Message, SettingsState, Attachment } from "../types";

const API_ENDPOINTS = {
  CHAT: "/api/chat",
  IMAGE: "/api/generate-image",
  VISION: "/api/analyze-vision",
  LINK: "/api/analyze-link",
  YOUTUBE: "/api/analyze-youtube",
  SEARCH: "/api/web-search",
  WEBSITE: "/api/generate-website"
};

export class AIService {
  /**
   * Metin Yanıtı Üretir (Chat - Multi-provider Gemini / Groq / OpenAI)
   */
  async generateText(
    prompt: string,
    history: Message[],
    settings?: SettingsState,
    onChunk?: (text: string) => void
  ): Promise<string> {
    try {
      const response = await fetch(API_ENDPOINTS.CHAT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...history, { id: 'temp', role: 'user', content: prompt, timestamp: Date.now() }],
          settings: settings 
        })
      });

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.error) {
            errMessage = errData.error;
            if (errData.details && Array.isArray(errData.details)) {
              errMessage += `\nDetaylar: ${errData.details.join(' | ')}`;
            }
          }
        } catch (_) {}
        throw new Error(errMessage);
      }

      const data = await response.json();
      const output = data.content || data.generated_text;
      
      if (!output) {
        throw new Error("Yapay zeka boş bir yanıt döndürdü.");
      }
      
      if (onChunk) onChunk(output);
      return output;
    } catch (error: any) {
      console.error("❌ BurakAI Chat Servis Hatası:", error);
      throw new Error(error.message || "Bağlantı kurulamadı.");
    }
  }

  /**
   * Görsel Üretir (Hugging Face / Pollinations Flux)
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await fetch(API_ENDPOINTS.IMAGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) return data.url;
      } else {
        const err = await response.text();
        console.warn("Görsel API uyarısı:", err);
      }
    } catch (error) {
      console.warn("Görsel servisi fallback devrede:", error);
    }
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${Date.now()}`;
  }

  /**
   * Görsel/Video Analizi Yapar (Vision)
   */
  async analyzeVision(prompt: string, attachments: Attachment[]): Promise<any> {
    try {
      const imgAtt = attachments.find(a => a.type === 'image');
      const image = imgAtt 
        ? (imgAtt.data.startsWith('data:') ? imgAtt.data : `data:${imgAtt.mimeType || 'image/jpeg'};base64,${imgAtt.data}`) 
        : null;
      const frames = attachments
        .filter(a => a.type === 'video')
        .map(a => a.data.startsWith('data:') ? a.data : `data:${a.mimeType || 'image/jpeg'};base64,${a.data}`);

      const response = await fetch(API_ENDPOINTS.VISION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          image,
          frames
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Görsel analizi başarısız oldu (HTTP ${response.status})`);
      }
      const data = await response.json();
      
      const analysisObj = data.analysis || {};
      return {
        analysis: analysisObj.summary || analysisObj.technical_details || "Analiz tamamlandı.",
        designObservations: [
          ...(analysisObj.design_language ? [analysisObj.design_language] : []),
          ...(Array.isArray(analysisObj.components) ? analysisObj.components : [])
        ],
        suggestedImprovements: analysisObj.layout ? [analysisObj.layout] : []
      };
    } catch (error: any) {
      console.error("❌ Vision Servis Hatası:", error);
      throw error;
    }
  }

  /**
   * Link Analizi Yapar
   */
  async analyzeLink(url: string): Promise<any> {
    try {
      const response = await fetch(API_ENDPOINTS.LINK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Link analizi başarısız oldu (HTTP ${response.status})`);
      }
      const data = await response.json();
      
      return {
        title: "Web Analysis",
        summary: data.analysis.summary,
        designLanguage: data.analysis.design_language,
        colorPalette: data.analysis.colors || [],
        hierarchy: [data.analysis.content_hierarchy, ...(data.analysis.functions || [])]
      };
    } catch (error: any) {
      console.error("❌ Link Analiz Hatası:", error);
      throw error;
    }
  }

  /**
   * YouTube Analizi Yapar
   */
  async analyzeYouTube(url: string): Promise<any> {
    try {
      const response = await fetch(API_ENDPOINTS.YOUTUBE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `YouTube analizi başarısız oldu (HTTP ${response.status})`);
      }
      const data = await response.json();
      
      return {
        summary: data.analysis.video_summary,
        keyTakeaways: [data.analysis.target_audience, data.analysis.design_language],
        landingPageConcept: {
          title: data.analysis.landing_page_sections?.[0]?.title || "Video Concept",
          heroText: data.analysis.landing_page_sections?.[0]?.content || ""
        }
      };
    } catch (error: any) {
      console.error("❌ YouTube Analiz Hatası:", error);
      throw error;
    }
  }

  /**
   * Web Araması Yapar
   */
  async webSearch(query: string): Promise<any> {
    try {
      const response = await fetch(API_ENDPOINTS.SEARCH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Web araması başarısız oldu (HTTP ${response.status})`);
      }
      const data = await response.json();
      
      return {
        summary: data.analysis.summary,
        sources: (data.analysis.sources || []).map((url: string) => ({ title: "Kaynak", url }))
      };
    } catch (error: any) {
      console.error("❌ Web Arama Hatası:", error);
      throw error;
    }
  }

  /**
   * Web Sitesi Üretir
   */
  async generateWebsite(prompt: string, style: string = 'Modern'): Promise<any> {
    try {
      const response = await fetch(API_ENDPOINTS.WEBSITE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Web sitesi üretimi başarısız.");
      }
      const data = await response.json();
      
      return {
        title: "Generated Website",
        description: "Your premium website has been generated.",
        sections: [{ name: "Main", content: "Full page code generated." }],
        code: data.code
      };
    } catch (error: any) {
      console.error("❌ Website Üretim Hatası:", error);
      throw error;
    }
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
