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
   * Metin Yanıtı Üretir (Chat - Groq Destekli)
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

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const output = data.content || data.generated_text; 
      
      if (onChunk) onChunk(output);
      return output;
    } catch (error: any) {
      console.error("Chat Servis Hatası:", error);
      throw new Error(`[Bağlantı Hatası]: ${error.message}`);
    }
  }

  /**
   * Görsel Üretir (Image - Pollinations)
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await fetch(API_ENDPOINTS.IMAGE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&model=flux&nologo=true&seed=${Date.now()}`;
      }

      const data = await response.json();
      return data.url; 
    } catch (error) {
      return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true`;
    }
  }

  /**
   * Görsel/Video Analizi Yapar (Vision)
   */
  async analyzeVision(prompt: string, attachments: Attachment[]): Promise<any> {
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
      throw new Error(errData.error || "Görsel analizi başarısız.");
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
  }

  /**
   * Link Analizi Yapar
   */
  async analyzeLink(url: string): Promise<any> {
    const response = await fetch(API_ENDPOINTS.LINK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) throw new Error("Link analizi başarısız.");
    const data = await response.json();
    
    return {
      title: "Web Analysis",
      summary: data.analysis.summary,
      designLanguage: data.analysis.design_language,
      colorPalette: data.analysis.colors,
      hierarchy: [data.analysis.content_hierarchy, ...data.analysis.functions]
    };
  }

  /**
   * YouTube Analizi Yapar
   */
  async analyzeYouTube(url: string): Promise<any> {
    const response = await fetch(API_ENDPOINTS.YOUTUBE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) throw new Error("YouTube analizi başarısız.");
    const data = await response.json();
    
    return {
      summary: data.analysis.video_summary,
      keyTakeaways: [data.analysis.target_audience, data.analysis.design_language],
      landingPageConcept: {
        title: data.analysis.landing_page_sections[0]?.title || "Video Concept",
        heroText: data.analysis.landing_page_sections[0]?.content || ""
      }
    };
  }

  /**
   * Web Araması Yapar
   */
  async webSearch(query: string): Promise<any> {
    const response = await fetch(API_ENDPOINTS.SEARCH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) throw new Error("Arama başarısız.");
    const data = await response.json();
    
    return {
      summary: data.analysis.summary,
      sources: data.analysis.sources.map((url: string) => ({ title: "Source", url }))
    };
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

      if (!response.ok) throw new Error("Web sitesi üretimi başarısız.");
      const data = await response.json();
      
      return {
        title: "Generated Website",
        description: "Your premium website has been generated.",
        sections: [{ name: "Main", content: "Full page code generated." }],
        code: data.code
      };
    } catch (error) {
      console.error("Website Hatası:", error);
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