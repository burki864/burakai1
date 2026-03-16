import type { VercelRequest, VercelResponse } from '@vercel/node';
import { smartChatRouter } from '../lib/router.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { messages, inputs, stream = false } = req.body;

  let chatMessages = messages;

  if (!chatMessages || chatMessages.length === 0) {
    if (inputs) {
      chatMessages = [{ role: "user", content: inputs }];
    } else {
      return res.status(400).json({ error: "No messages provided" });
    }
  }

  try {
    const result: any = await smartChatRouter(chatMessages, { stream });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of result) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          res.write(`data: ${JSON.stringify({ content, generated_text: content })}\n\n`);
        }
      }

      res.write('data: [DONE]\n\n');
      return res.end();
    } else {
      const content = result.choices[0]?.message?.content || "";
      return res.status(200).json({ content, generated_text: content });
    }

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}