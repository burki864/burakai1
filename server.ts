import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

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
    const HF_TOKEN = process.env.VITE_HUGGINGFACE_TOKEN || process.env.VITE_HUGGING_FACE_TOKEN;
    try {
      const response = await fetch(`https://router.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/image", async (req, res) => {
    const HF_TOKEN = process.env.VITE_HUGGINGFACE_TOKEN || process.env.VITE_HUGGING_FACE_TOKEN;
    try {
      const response = await fetch(`router.huggingface.co/models/black-forest-labs/FLUX.1-schnell`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) return res.status(response.status).send(await response.text());
      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video", async (req, res) => {
    const HF_TOKEN = process.env.VITE_HUGGINGFACE_TOKEN || process.env.VITE_HUGGING_FACE_TOKEN;
    try {
      const response = await fetch(`https://router.huggingface.co/models/ali-vilab/modelscope-damo-text-to-video-synthesis`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      });
      if (!response.ok) return res.status(response.status).send(await response.text());
      const blob = await response.blob();
      const buffer = Buffer.from(await blob.arrayBuffer());
      res.setHeader('Content-Type', 'video/mp4');
      res.send(buffer);
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
