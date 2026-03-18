import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODELS } from '../lib/groq.js';

export const runtime = 'edge';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { image, frames, prompt } = req.body;

  if (!groq) {
    return res.status(500).json({ error: "Groq not initialized" });
  }

  try {
    const systemInstruction = `Sen bir vizyon analiz uzmanısın. Gelen görselleri (tekil veya video kareleri) analiz et. 
    Analiz sonucunu B-UILDER modülüne (kod yazıcı) girdi olarak verebilecek teknik detayda hazırla.
    Tasarım dili, renk paleti (hex kodları), kullanılan komponentler, layout yapısı ve içerik hiyerarşisini belirt.
    Yanıtını mutlaka şu JSON formatında döndür:
    {
      "design_language": "...",
      "colors": ["#...", "#..."],
      "components": ["...", "..."],
      "layout": "...",
      "summary": "...",
      "technical_details": "..."
    }`;

    const contentParts: any[] = [{ type: "text", text: `${systemInstruction}\n\nKullanıcı İsteği: ${prompt || "Bu görseli/videoyu analiz et."}` }];

    if (image) {
      contentParts.push({
        type: "image_url",
        image_url: { url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}` }
      });
    } else if (frames && Array.isArray(frames)) {
      // Limit frames to avoid payload limits
      frames.slice(0, 5).forEach((frame: string) => {
        contentParts.push({
          type: "image_url",
          image_url: { url: frame.startsWith('data:') ? frame : `data:image/jpeg;base64,${frame}` }
        });
      });
    } else {
      return res.status(400).json({ error: "Image or frames are required" });
    }

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: contentParts }],
      model: MODELS.VISION,
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return res.status(200).json({ analysis, success: true });

  } catch (error: any) {
    console.error("Vision Analysis Error:", error);
    return res.status(500).json({ error: "Görsel analiz edilirken bir hata oluştu." });
  }
}
