import { groq, CHAT_MODELS } from "./groq.js";

export interface RouterOptions {
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export async function smartChatRouter(messages: any[], options: RouterOptions = {}) {
  if (!groq) throw new Error("Groq client not initialized");

  // 1️⃣ ÖNCELİKLE MESAJLARI TEMİZLE (Attachments hatasını çözer)
  const cleanMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // 2️⃣ TÜRKÇE VE KİMLİK AYARI (İngilizce cevap sorununu çözer)
  // Eğer gelen mesajların içinde zaten bir 'system' mesajı yoksa en başa ekle
  const hasSystemPrompt = cleanMessages.some(m => m.role === 'system');
  
  const finalMessages = hasSystemPrompt 
    ? cleanMessages 
    : [
        { 
          role: 'system', 
          content: 'Sen BurakAI adında, 13 yaşındaki dahi yazılımcı Burak Eren Kısa tarafından geliştirilmiş bir yapay zekasın. Kesinlikle TÜRKÇE cevap vermelisin. Nazik, zeki ve teknik konularda uzman bir asistan ol.' 
        },
        ...cleanMessages
      ];

  let lastError: any = null;

  for (const model of CHAT_MODELS) {
    try {
      console.log(`🚀 Deneniyor: ${model}`);
      
      const config = {
        messages: finalMessages, // Temizlenmiş ve sistem mesajı eklenmiş dizi
        model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      };

      if (options.stream) {
        return await groq.chat.completions.create({
          ...config,
          stream: true,
        });
      } else {
        const completion = await groq.chat.completions.create(config);
        
        // Yanıtın boş gelip gelmediğini kontrol et
        if (!completion.choices?.[0]?.message?.content) {
          throw new Error("Model boş yanıt döndü.");
        }
        
        return completion;
      }
    } catch (error: any) {
      console.error(`⚠️ ${model} Hatası:`, error.message);
      lastError = error;
      
      // 🛡️ Failover: 400 (Format), 429 (Limit), 500/503 (Sunucu) hatalarında bir sonrakini dene
      if (
        error.status === 400 || 
        error.status === 424 || // Dependency hatası (bazen Groq'da oluyor)
        error.status === 429 || 
        error.status === 503 || 
        error.status === 500
      ) {
        console.log(`🔄 Hata ${error.status} alındı, sıradaki modele geçiliyor...`);
        continue;
      }
      
      throw error;
    }
  }

  throw lastError || new Error("Maalesef tüm modeller başarısız oldu.");
}