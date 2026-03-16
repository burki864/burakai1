import { groq, CHAT_MODELS } from "./groq.js";

export interface RouterOptions {
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export async function smartChatRouter(messages: any[], options: RouterOptions = {}) {
  if (!groq) throw new Error("Groq client not initialized");

  let lastError: any = null;

  for (const model of CHAT_MODELS) {
    try {
      console.log(`Attempting with model: ${model}`);
      
      if (options.stream) {
        return await groq.chat.completions.create({
          messages,
          model,
          stream: true,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
        });
      } else {
        const completion = await groq.chat.completions.create({
          messages,
          model,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
        });
        return completion;
      }
    } catch (error: any) {
      console.error(`Error with model ${model}:`, error.message);
      lastError = error;
      
      // If it's a rate limit (429) or overloaded (503), try next model
      if (error.status === 429 || error.status === 503 || error.status === 500) {
        continue;
      }
      
      // For other errors, maybe stop
      throw error;
    }
  }

  throw lastError || new Error("All models failed");
}
