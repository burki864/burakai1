import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash'
];

const SYSTEM_PROMPT = `DİL KURALI: KESİNLİKLE VE ASLA TÜRKÇE DIŞINDA BİR DİLDE CEVAP VERME! 
Kullanıcı 'hi', 'hello' veya 'selam' dese bile cevabın her zaman %100 Türkçe olmalıdır. 
Sen BurakAI Pro Ultra'sın. 13 yaşındaki vizyoner yazılımcı Burak Eren Kısa tarafından geliştirilmiş, profesyonel, zeki ve süper yetenekli bir yapay zeka asistanısın. 
Asla kırık görsel linkleri veya markdown resim formatı (![...](...)) kullanma. 
Eğer kullanıcı bir görsel, video veya web sitesi oluşturmak isterse, bunu algılayıp yanıtının sonuna mutlaka [GENERATE: TYPE, PROMPT] formatında bir komut ekle. Örnek: [GENERATE: IMAGE, kedi resmi]`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET Healthcheck & Browser Test
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'BurakAI Serverless Chat Endpoint',
      method_supported: 'POST',
      message: 'BurakAI API aktif. Mesaj göndermek için POST isteği yapın.'
    });
  }

  // Method Check (POST zorunlu)
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method Not Allowed. Sadece POST istekleri kabul edilmektedir.',
      received_method: req.method 
    });
  }

  // Body Parsing (String veya Obje desteği)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (_) {
      return res.status(400).json({ error: "Geçersiz JSON gövdesi." });
    }
  }

  const { messages, inputs } = body || {};
  let chatMessages = messages;
  if (!chatMessages && inputs) {
    chatMessages = [{ role: 'user', content: inputs }];
  }

  if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
    return res.status(400).json({ error: "Geçerli bir mesaj listesi (messages array) gönderilmelidir." });
  }

  const cleanMessages = chatMessages.map((m: any) => ({
    role: m.role || 'user',
    content: (m.content || "").trim()
  })).filter(m => m.content.length > 0);

  const errors: string[] = [];

  // --- 1. GEMINI API (@google/genai) ---
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY1;
  if (geminiApiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const geminiContents = cleanMessages
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      if (geminiContents.length === 0) {
        geminiContents.push({ role: 'user', parts: [{ text: 'Merhaba' }] });
      }

      for (const model of GEMINI_MODELS) {
        try {
          console.log(`🚀 Gemini deneniyor: ${model}`);
          const response = await ai.models.generateContent({
            model,
            contents: geminiContents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              temperature: 0.7
            }
          });

          const text = response.text?.trim();
          if (text) {
            console.log(`✅ Gemini ${model} başarılı!`);
            return res.status(200).json({ 
              role: "assistant", 
              content: text, 
              generated_text: text,
              provider: "gemini",
              model 
            });
          }
        } catch (err: any) {
          const errMsg = `Gemini (${model}): ${err.message || err}`;
          console.warn(`⚠️ ${errMsg}`);
          errors.push(errMsg);
        }
      }
    } catch (sdkErr: any) {
      errors.push(`Gemini SDK Init Error: ${sdkErr.message}`);
    }
  } else {
    errors.push("GEMINI_API_KEY ortam değişkeni bulunamadı.");
  }

  // --- 2. GROQ API (Yüksek Hız) ---
  if (process.env.GROQ_API_KEY) {
    const groqModels = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];
    for (const model of groqModels) {
      try {
        console.log(`🚀 Groq deneniyor: ${model}`);
        const finalGroqMessages = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...cleanMessages.filter((m: any) => m.role !== 'system')
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({ 
            messages: finalGroqMessages,
            model, 
            temperature: 0.3 
          })
        });

        if (!response.ok) {
          const errData = await response.text();
          throw new Error(`HTTP ${response.status}: ${errData.slice(0, 150)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          console.log(`✅ Groq ${model} başarılı!`);
          return res.status(200).json({ 
            role: "assistant", 
            content, 
            generated_text: content,
            provider: "groq",
            model 
          });
        }
      } catch (err: any) {
        const errMsg = `Groq (${model}): ${err.message || err}`;
        console.warn(`⚠️ ${errMsg}`);
        errors.push(errMsg);
      }
    }
  }

  // --- 3. OPENAI API ---
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log(`🚀 OpenAI deneniyor: gpt-4o-mini`);
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...cleanMessages.filter((m: any) => m.role !== 'system')
          ], 
          model: 'gpt-4o-mini',
          temperature: 0.5 
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 150)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        return res.status(200).json({ 
          role: "assistant", 
          content, 
          generated_text: content,
          provider: "openai" 
        });
      }
    } catch (err: any) {
      errors.push(`OpenAI: ${err.message || err}`);
    }
  }

  // --- 4. ANTHROPIC (CLAUDE) ---
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log(`🚀 Anthropic deneniyor: claude-3-5-sonnet-20240620`);
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 2048,
          system: SYSTEM_PROMPT,
          messages: cleanMessages.filter((m: any) => m.role === 'user' || m.role === 'assistant')
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 150)}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text?.trim();
      if (content) {
        return res.status(200).json({ 
          role: "assistant", 
          content, 
          generated_text: content,
          provider: "anthropic" 
        });
      }
    } catch (err: any) {
      errors.push(`Anthropic: ${err.message || err}`);
    }
  }

  // --- JSON HATA YANITI DÖNDÜR (Kesinlikle HTML Yok, Anlaşılır Hata Detayı) ---
  console.error("❌ Tüm modeller tükendi:", errors);
  return res.status(502).json({ 
    error: "Yapay zeka modellerinden yanıt alınamadı. Lütfen Vercel panelinizde GEMINI_API_KEY veya GROQ_API_KEY ortam değişkenini tanımladığınızdan emin olun.",
    details: errors,
    role: "assistant",
    success: false
  });
}
