import OpenAI from "openai";

export const config = {
  runtime: "nodejs", // DeepSeek streaming için Node.js runtime daha stabildir
};

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com", // DeepSeek endpoint'i
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt, history, settings, researchEnabled } = req.body;

    // DeepSeek Modelleri: 
    // 1. "deepseek-chat" (V3 - Genel kullanım ve kod için)
    // 2. "deepseek-reasoner" (R1 - Akıl yürütme ve çok karmaşık kod sorunları için)
    const activeModel = researchEnabled ? "deepseek-reasoner" : "deepseek-chat";

    const messages: any[] = [
      { 
        role: "system", 
        content: (settings?.systemPrompt || "You are BurakAI, a high-performance neural assistant.") +
                 "\nKeep responses concise, professional, and use markdown."
      }
    ];

    // Geçmiş mesajları ekle
    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      });
    }

    // Mevcut prompt'u ekle
    messages.push({ role: "user", content: prompt });

    const stream = await openai.chat.completions.create({
      model: activeModel,
      messages: messages,
      temperature: settings?.creativity ?? 0.7,
      stream: true, // Streaming açık
    });

    // Header ayarları (Vercel ve tarayıcı streaming için)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        res.write(content);
      }
    }

    res.end();
  } catch (error: any) {
    console.error("[DEEPSEEK_ERROR]", error);
    res.status(500).json({ error: error.message || "DeepSeek Engine Link Failure." });
  }
}