
import { GoogleGenAI } from "@google/genai";
import { SettingsState, Message } from "../types";

export class GeminiService {
  private createClient(): GoogleGenAI {
    // Fixed: Always use new GoogleGenAI({apiKey: process.env.API_KEY}); directly.
    return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
  }

  async generateTextStream(
    prompt: string,
    history: Message[],
    settings: SettingsState,
    onChunk: (text: string) => void
  ) {
    try {
      const ai = this.createClient();
      
      // Direct SDK call is more reliable in this environment
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [
          ...history.map(h => ({
            // Fixed: Explicitly cast role to "model" | "user" to satisfy strict SDK types
            role: (h.role === 'assistant' ? 'model' : 'user') as "model" | "user",
            parts: [{ text: h.content }]
          })),
          { role: 'user', parts: [{ text: prompt }] }
        ],
        config: {
          systemInstruction: settings.systemPrompt,
          temperature: settings.creativity,
          topP: 0.95,
          topK: 40,
        },
      });

      let fullText = "";
      for await (const chunk of responseStream) {
        // Fixed: Directly access the .text property (it's a getter, not a method)
        const text = chunk.text;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      }
      return fullText;
    } catch (error: any) {
      console.error("Gemini Direct SDK Error:", error);
      throw new Error(error.message || "Neural Link Interrupted: Check your connection.");
    }
  }

  async generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
    try {
      const ai = this.createClient();
      const genResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
          imageConfig: { 
            aspectRatio: aspectRatio as any 
          } 
        }
      });
      
      // Fixed: Iterate through all parts to find the image part (inlineData) as per guidelines
      const part = genResponse.candidates?.[0]?.content?.parts.find(p => p.inlineData);
      if (part?.inlineData?.data) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
      throw new Error("Model failed to synthesize image data.");
    } catch (error: any) {
      console.error("Image Synthesis Error:", error);
      throw new Error(error.message || "Neural Image synthesis failed.");
    }
  }
}

export const geminiService = new GeminiService();
