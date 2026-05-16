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
    const image = attachments.find(a => a.type === 'image')?.data;
    const frames = attachments.filter(a => a.type === 'video').map(a => a.data);

    const response = await fetch(API_ENDPOINTS.VISION, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt, 
        image: image ? `data:image/jpeg;base64,${image}` : null,
        frames: frames.map(f => `data:image/jpeg;base64,${f}`)
      })
    });

    if (!response.ok) throw new Error("Analiz başarısız.");
    const data = await response.json();
    
    // UI'ın beklediği formata dönüştür
    return {
      analysis: data.analysis.summary || data.analysis.technical_details,
      designObservations: [data.analysis.design_language, ...data.analysis.components],
      suggestedImprovements: [data.analysis.layout]
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
    const lower = input.toLowerCase();
    
    // Attachment önceliği
    if (attachments.some(a => a.type === 'image')) return 'IMAGE_ANALYZE';
    if (attachments.some(a => a.type === 'video')) return 'VIDEO_ANALYZE';
    
    // URL önceliği
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YOUTUBE_ANALYZE';
    if (lower.includes('http://') || lower.includes('https://')) return 'LINK_ANALYZE';

    // Komut ve anahtar kelime eşleşmesi
    if (lower.startsWith('/image') || lower.includes('görsel oluştur') || lower.includes('resim yap') || lower.includes('çiz')) return 'IMAGE_CREATE';
    if (lower.startsWith('/web') || lower.includes('site kur') || lower.includes('web sitesi yap')) return 'WEB_BUILD_CREATE';
    if (lower.startsWith('/search') || lower.includes('ara') || lower.includes('kimdir') || lower.includes('nedir')) return 'WEB_SEARCH';
    
    return 'CHAT';
  }
}

export const aiService = new AIService();