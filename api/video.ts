import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, VISION_MODEL } from '../lib/groq.js';

export const runtime = 'edge'; // Vercel 10s timeout sınırını aşmak için

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { frames, prompt } = req.body;

  // Analiz kalitesini artırmak için sistem promptu ekleyelim
  const systemInstruction = "Sen bir video analiz uzmanısın. Kareleri incele ve hareketleri, objeleri ve atmosferi detaylıca açıkla.";
  const finalPrompt = prompt || "Bu videoda neler oluyor? Kareleri analiz et.";

  if (!frames || !Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ error: "Frames are required" });
  }

  try {
    const contentParts: any[] = [{ type: "text", text: `${systemInstruction}\n\nİstek: ${finalPrompt}` }];
    
    // Vercel Payload sınırına takılmamak için kare sayısını ve boyutunu optimize et
    const selectedFrames = frames.slice(0, 5);
    
    selectedFrames.forEach((frame: string) => {
      contentParts.push({
        type: "image_url",
        image_url: { 
          url: frame.startsWith('data:') ? frame : `data:image/jpeg;base64,${frame}` 
        }
      });
    });

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: contentParts }],
      model: VISION_MODEL,
      temperature: 0.2, // Daha tutarlı analiz için
    });

    const summary = completion.choices[0]?.message?.content || "";
    return res.status(200).json({ summary, success: true });

  } catch (error: any) {
    console.error("Video Analysis API Error:", error);
    return res.status(500).json({ error: "Video analiz edilirken bir hata oluştu." });
  }
}