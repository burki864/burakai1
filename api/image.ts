// api/image.ts (Backend)

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Groq } from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const HF_TOKEN = process.env.HF_TOKEN;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { prompt } = req.body;

  try {
    // 1. PROMPT OPTİMİZASYONU (Groq ile kısa ve öz)
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "Convert to a short, highly detailed English image prompt. Keywords only. Max 40 words." },
        { role: "user", content: prompt },
      ],
      model: "llama-3.1-8b-instant",
    });
    const optimizedPrompt = completion.choices[0]?.message?.content?.replace(/[\r\n]+/gm, " ").trim() || prompt;

    // 2. ÖNCE HUGGING FACE DENE (Vercel üzerinden)
    try {
      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        {
          headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
          method: "POST",
          body: JSON.stringify({ inputs: optimizedPrompt }),
        }
      );

      if (hfResponse.ok) {
        const buffer = await hfResponse.arrayBuffer();
        if (buffer.byteLength > 500) {
          const base64Image = Buffer.from(buffer).toString('base64');
          return res.status(200).json({ 
            url: `data:image/webp;base64,${base64Image}`, 
            success: true,
            provider: "HF" 
          });
        }
      }
    } catch (e) { console.warn("HF fail, moving to Client-Side Fallback"); }

    // 3. KRİTİK NOKTA: HF BAŞARISIZSA, POLLINATIONS URL'SİNİ DÖNDÜR
    // Ama görseli sunucuda üretme, sadece linki ver, tarayıcı (client) yüklesin!
    const seed = Math.floor(Math.random() * 1000000);
    const clientUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(optimizedPrompt)}?width=1024&height=576&model=flux&nologo=true&seed=${seed}`;

    return res.status(200).json({ 
      url: clientUrl, 
      success: true,
      provider: "Client-Side-Pollinations" 
    });

  } catch (error) {
    return res.status(500).json({ error: "Sistem meşgul." });
  }
}