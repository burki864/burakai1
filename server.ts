import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Hugging Face Proxy (v3 syntax)
  app.use(
    "/models",
    createProxyMiddleware({
      target: "https://api-inference.huggingface.co",
      changeOrigin: true,
      pathRewrite: {
        "^/": "/models/", // Express strips /models, so we add it back for Hugging Face
      },
      on: {
        proxyReq: (proxyReq, req) => {
          // Log for debugging if needed
          // console.log('Proxying:', req.method, req.url);
        },
        error: (err, req, res) => {
          console.error('Proxy Error:', err);
        }
      }
    })
  );

  app.use(express.json());

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
