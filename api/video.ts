import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, VISION_MODEL } from '../lib/groq';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // For video analysis, we expect a list of frames (base64) or a single summary request
  const { frames, prompt = "Summarize the events in this video based on these frames." } = req.body;

  if (!frames || !Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ error: "Frames are required" });
  }

  if (!groq) {
    return res.status(500).json({ error: "Groq not initialized" });
  }

  try {
    // We send multiple frames to the vision model
    const contentParts: any[] = [{ type: "text", text: prompt }];
    
    // Limit to top 5 frames to avoid token limits
    const selectedFrames = frames.slice(0, 5);
    
    selectedFrames.forEach((frame: string) => {
      contentParts.push({
        type: "image_url",
        image_url: { url: frame }
      });
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: contentParts,
        },
      ],
      model: VISION_MODEL,
    });

    const summary = completion.choices[0]?.message?.content || "";
    return res.status(200).json({ summary });
  } catch (error: any) {
    console.error("Video Analysis API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
