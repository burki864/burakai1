import { GoogleGenAI } from "@google/genai";
import { groq, CHAT_MODELS } from "./groq.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Öncelikli ve stabil Gemini modelleri
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.7-flash"
];

export interface RouterOptions {
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export async function smartChatRouter(messages: any[], options: RouterOptions = {}) {
  // 1️⃣ MESAJLARI TEMİZLE
  const cleanMessages = messages.map(m => ({
    role: m.role,
    content: m.content
  }));

  // 2️⃣ TÜRKÇE VE KİMLİK AYARI
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

  // 3️⃣ ÖNCE GEMINI MODELLERİ (Yüksek hız, Türkçe yeteneği ve kararlılık)
  let systemInstruction = "";
  const geminiContents: any[] = [];

  for (const m of finalMessages) {
    if (m.role === 'system') {
      systemInstruction += (systemInstruction ? "\n" : "") + m.content;
    } else {
      geminiContents.push({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || "" }]
      });
    }
  }

  if (!systemInstruction) {
    systemInstruction = 'Sen BurakAI adında, 13 yaşındaki dahi yazılımcı Burak Eren Kısa tarafından geliştirilmiş bir yapay zekasın. Kesinlikle TÜRKÇE cevap vermelisin. Nazik, zeki ve teknik konularda uzman bir asistan ol.';
  }

  const payloadContents = geminiContents.length > 0 ? geminiContents : [{ role: 'user', parts: [{ text: 'Merhaba' }] }];

  for (const geminiModel of GEMINI_MODELS) {
    try {
      console.log(`🚀 Gemini deneniyor: ${geminiModel}`);

      if (options.stream) {
        const streamResponse = await ai.models.generateContentStream({
          model: geminiModel,
          contents: payloadContents,
          config: {
            systemInstruction,
            temperature: options.temperature ?? 0.7,
          }
        });

        async function* convertGeminiStream(stream: any) {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              yield {
                choices: [
                  {
                    delta: { content: text }
                  }
                ]
              };
            }
          }
        }

        return convertGeminiStream(streamResponse);
      } else {
        const response = await ai.models.generateContent({
          model: geminiModel,
          contents: payloadContents,
          config: {
            systemInstruction,
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens || 4096,
          }
        });

        const content = response.text || "Merhaba! Size nasıl yardımcı olabilirim?";
        return {
          choices: [
            {
              message: {
                content,
                role: "assistant"
              }
            }
          ]
        };
      }
    } catch (geminiError: any) {
      console.warn(`⚠️ Gemini ${geminiModel} Hatası:`, geminiError.message || geminiError);
      continue;
    }
  }

  // 4️⃣ GEMINI TÜM MODELLERİ DOLUYSA GROQ DENE
  if (groq) {
    for (const model of CHAT_MODELS) {
      try {
        console.log(`🚀 Groq deneniyor: ${model}`);
        
        const config = {
          messages: finalMessages,
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
          
          if (completion.choices?.[0]?.message?.content) {
            return completion;
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Groq ${model} Hatası:`, error.message);
        continue;
      }
    }
  }

  // Acil durum yerel yanıtı
  if (options.stream) {
    async function* fallbackStream() {
      yield {
        choices: [
          {
            delta: { content: "Merhaba! BurakAI olarak hizmetinizdeyim. Size nasıl yardımcı olabilirim?" }
          }
        ]
      };
    }
    return fallbackStream();
  }

  return {
    choices: [
      {
        message: {
          content: "Merhaba! BurakAI olarak hizmetinizdeyim. Size nasıl yardımcı olabilirim?",
          role: "assistant"
        }
      }
    ]
  };
}
