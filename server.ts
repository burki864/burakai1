import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import Groq from "groq-sdk";
import { smartChatRouter } from "./lib/router";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Hugging Face Proxy (v3 syntax)
  // Root level middleware with pathFilter to keep the full path
  app.use(
    createProxyMiddleware({
      target: "https://router.huggingface.co",
      changeOrigin: true,
      pathFilter: "/models",
      on: {
        proxyReq: (proxyReq, req) => {
          // Log for debugging
          // console.log('Proxying:', req.method, req.url);
        },
        error: (err, req, res) => {
          console.error('Proxy Error:', err);
        }
      }
    })
  );

  app.use(express.json());

  // Local API routes for development (simulating Vercel functions)
  app.post("/api/chat", async (req, res) => {
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
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/image", async (req, res) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !token) return res.status(500).json({ error: "Cloudflare credentials missing" });

    try {
      const { prompt, inputs } = req.body;
      const imagePrompt = prompt || inputs;
      
      if (!imagePrompt) return res.status(400).json({ error: "No prompt provided" });

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: imagePrompt }),
        }
      );
      if (!response.ok) return res.status(response.status).send(await response.text());
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vision", async (req, res) => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return res.status(500).json({ error: "GROQ_API_KEY is not set" });
    
    const { image, prompt = "What is in this image?" } = req.body;
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    try {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        model: "llama-3.2-11b-vision-preview",
      });
      res.status(200).json({ content: completion.choices[0]?.message?.content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video", async (req, res) => {
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return res.status(500).json({ error: "GROQ_API_KEY is not set" });
    
    const { frames, prompt = "Summarize the events in this video based on these frames." } = req.body;
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    try {
      const contentParts: any[] = [{ type: "text", text: prompt }];
      frames.slice(0, 5).forEach((frame: string) => {
        contentParts.push({ type: "image_url", image_url: { url: frame } });
      });

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: contentParts }],
        model: "llama-3.2-11b-vision-preview",
      });
      res.status(200).json({ summary: completion.choices[0]?.message?.content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
