import path from "path";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import express from "express";
import { createApiApp } from "./lib/apiApp.js";

async function startServer() {
  const app = createApiApp();
  const PORT = 3000;

  // Hugging Face Proxy (v3 syntax)
  app.use(
    createProxyMiddleware({
      target: "https://router.huggingface.co",
      changeOrigin: true,
      pathFilter: "/models",
      on: {
        error: (err, req, res) => {
          console.error("Proxy Error:", err);
        }
      }
    })
  );

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
