import { GoogleGenAI } from "@google/genai";

export const config = {
  runtime: "nodejs",
};

/**
 * BurakAI Multi-Modal Chat Handler
 * Model: gemini-3-pro-preview
 * Features: Native Vision, Google Search Grounding, Streamed Responses
 */
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { prompt, history, settings, attachments, researchEnabled } = req.body;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Construct contents for Gemini API
    const contents: any[] = [];

    // Add conversation history
    if (history && history.length > 0) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      });
    }

    // Prepare current user turn with potential images
    const currentParts: any[] = [{ text: prompt }];

    if (attachments && attachments.length > 0) {
      attachments.forEach((att: any) => {
        if (att.type === 'image') {
          currentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data // base64 string
            }
          });
        }
      });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    // Configuration including System Instruction and Tools
    const config: any = {
      systemInstruction: (settings?.systemPrompt || "You are BurakAI, a high-performance neural assistant.") +
        "\n\nVISUAL ANALYSIS:\n" +
        "- You have native vision. Analyze images with extreme precision.\n" +
        "- If asked to draw, use [GENERATE_IMAGE: {description}].\n" +
        "\nRESEARCH MODE:\n" +
        "- If research mode is active, use Google Search to provide up-to-date information.\n" +
        "\nFORMATTING:\n" +
        "- Use clear spacing, markdown, and keep responses concise yet professional.",
      temperature: settings?.creativity ?? 0.7,
    };

    // Enable Google Search if Research Mode is on
    if (researchEnabled) {
      config.tools = [{ googleSearch: {} }];
    }

    // gemini-3-pro-preview is required for high-quality multi-modal and search tasks
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-pro-preview",
      contents,
      config,
    });

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
      }
    }

    res.end();
  } catch (error: any) {
    console.error("[BURAKAI_CORE_ERROR]", error);
    res.status(500).json({ error: error.message || "Neural link failure: Gemini Engine error." });
  }
}