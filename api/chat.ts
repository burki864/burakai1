import OpenAI from "openai";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { prompt, history, settings } = req.body;

    const openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Chat formatı OpenAI standardında
    const messages = [
      {
        role: "system",
        content:
          settings?.systemPrompt ||
          "You are BurakAI, a high-performance neural assistant.",
      },
      ...(history || []).map((m: any) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      {
        role: "user",
        content: prompt,
      },
    ];

    const stream = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant", // limit açısından rahat model
      messages,
      temperature: settings?.creativity ?? 0.7,
      stream: true,
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        res.write(content);
      }
    }

    res.end();
  } catch (error: any) {
    console.error("Groq Error:", error);
    res
      .status(500)
      .json({ error: error.message || "Groq neural failure." });
  }
}
