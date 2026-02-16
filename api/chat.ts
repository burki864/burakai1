export const config = {
  runtime: "nodejs",
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { prompt, history } = req.body;

    // Hugging Face üzerinden Qwen 2.5 - 72B (Çok zeki ve tutarlıdır)
    const response = await fetch(
      "https://route.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_TOKEN}`, // Hugging Face'den alacağın ücretsiz token
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen2.5-72B-Instruct",
          messages: [
            { role: "system", content: "Sen BurakAI asistanısın. Kodlama ve teknik konularda uzman, kısa ve net cevaplar veren bir yardımcısın." },
            ...history.map((h: any) => ({
              role: h.role === "user" ? "user" : "assistant",
              content: h.content
            })),
            { role: "user", content: prompt }
          ],
          max_tokens: 1500,
          stream: false // Basitlik için başlangıçta false yapabilirsin
        }),
      }
    );

    const data = await response.json();
    const resultText = data.choices[0].message.content;

    res.status(200).send(resultText);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}