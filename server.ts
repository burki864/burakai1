import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import axios from "axios";
import { groq, MODELS } from "./lib/groq.js";
import { smartChatRouter } from "./lib/router.js";

// In-memory store for async requests (Polling logic)
const asyncRequests = new Map<string, { status: string; url?: string; error?: string; duration?: string }>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Basic Middleware
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // 2. Hugging Face Proxy (v3 syntax)
  app.use(
    createProxyMiddleware({
      target: "https://router.huggingface.co",
      changeOrigin: true,
      pathFilter: "/models",
      on: {
        error: (err, req, res) => {
          console.error('Proxy Error:', err);
        }
      }
    })
  );

  // 3. Local API routes
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

  // AI Image Generator (Pollinations.ai)
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "No prompt provided" });

      console.log("Enriching prompt with Groq...");
      let enrichedPrompt = prompt;
      
      try {
        if (groq) {
          const completion = await groq.chat.completions.create({
            messages: [
              { 
                role: "system", 
                content: "You are an expert prompt engineer. Enrich the user's image prompt to be highly detailed, artistic, and optimized for Flux.1. Keep it concise but descriptive. Output ONLY the enriched prompt." 
              },
              { role: "user", content: prompt }
            ],
            model: MODELS.FAST,
          });
          enrichedPrompt = completion.choices[0]?.message?.content || prompt;
        }
      } catch (groqError) {
        console.warn("Groq Optimization Error (using original prompt):", groqError);
      }

      console.log("Enriched Prompt:", enrichedPrompt);

      const seed = Math.floor(Math.random() * 1000000);
      const safePrompt = encodeURIComponent(enrichedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1280&height=720&model=flux&nologo=true&seed=${seed}&enhance=true`;

      return res.status(200).json({ 
        url: imageUrl,
        enrichedPrompt,
        success: true,
        provider: "Pollinations.ai"
      });
    } catch (error: any) {
      console.error("Image Generation Error:", error.message);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // AI Website Builder (B-UILDER)
  app.post("/api/generate-website", async (req, res) => {
    if (!groq) return res.status(500).json({ error: "Groq not initialized" });

    const { prompt, style = 'Modern' } = req.body;

    try {
      console.log(`Building website with style: ${style}...`);
      
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are "B-uilder Architecture", an AI that builds premium websites with React-like state management using Alpine.js.
            
            ### 🧠 ARCHITECTURAL RULES (FOR FUNCTIONALITY):
            1. **STATE ENGINE**: Every site MUST start with a global 'x-data' object on the body. 
               - Example: <body x-data="{ cartCount: 0, isMenuOpen: false, activeTab: 'all' }" class="bg-[#030712] text-white">
            2. **REACTIVE BUTTONS**: Buttons must not be empty. Use Alpine.js directives:
               - Add to Cart: 'x-on:click="cartCount++"'
               - Toggle Menu: 'x-on:click="isMenuOpen = !isMenuOpen"'
               - Transitions: Use 'x-show' with 'x-transition' for smooth opening/closing.
            3. **DYNAMIC COMPONENTS**: 
               - Use 'x-text="cartCount"' to show live updates.
               - Use 'x-bind:class' to change styles based on state (e.g., active button color).

            ### 🎨 2026 DESIGN (PREMIUM LOOK):
            - **Bento-Grid** layout (grid-cols-12).
            - **Glassmorphism** everywhere (backdrop-blur-xl, bg-white/5, border-white/10).
            - **Typography**: Inter/Outfit, tracking-tighter, massive gradients.
            - **Images**: Use high-quality Unsplash URLs only.

            ### 🛠️ STACK (REQUIRED):
            - Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
            - Alpine.js (The Brain): <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
            - Animate on Scroll: <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
            - <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

            ### ❌ OUTPUT RULES:
            - Output ONLY valid, raw HTML starting with <!DOCTYPE html>.
            - Initialize AOS: <script>document.addEventListener('DOMContentLoaded', () => { AOS.init({once: true, duration: 800}); });</script>
            - No explanations. No markdown code blocks. Just code.`
          },
          { role: "user", content: prompt },
        ],
        model: MODELS.BUILDER,
        temperature: 0.1,
      });

      let code = completion.choices[0]?.message?.content || "";
      // Clean up markdown if present
      code = code.replace(/```html/g, "").replace(/```/g, "").trim();

      res.status(200).json({ code, success: true });
    } catch (error: any) {
      console.error("Website Generation Error:", error);
      res.status(500).json({ error: "İnşaat sırasında bir hata oluştu." });
    }
  });

  // --- NEW ANALYSIS MODULES ---

  // Vision Analysis
  app.post("/api/analyze-vision", async (req, res) => {
    if (!groq) return res.status(500).json({ error: "Groq not initialized" });
    const { image, frames, prompt } = req.body;

    try {
      const systemInstruction = `Sen bir vizyon analiz uzmanısın. Gelen görselleri (tekil veya video kareleri) analiz et. 
      Analiz sonucunu B-UILDER modülüne (kod yazıcı) girdi olarak verebilecek teknik detayda hazırla.
      Tasarım dili, renk paleti (hex kodları), kullanılan komponentler, layout yapısı ve içerik hiyerarşisini belirt.
      Yanıtını mutlaka şu JSON formatında döndür:
      {
        "design_language": "...",
        "colors": ["#...", "#..."],
        "components": ["...", "..."],
        "layout": "...",
        "summary": "...",
        "technical_details": "..."
      }`;

      const contentParts: any[] = [{ type: "text", text: `${systemInstruction}\n\nKullanıcı İsteği: ${prompt || "Bu görseli/videoyu analiz et."}` }];

      if (image) {
        contentParts.push({ type: "image_url", image_url: { url: image } });
      } else if (frames && Array.isArray(frames)) {
        frames.slice(0, 5).forEach((frame: string) => {
          contentParts.push({ type: "image_url", image_url: { url: frame } });
        });
      } else {
        return res.status(400).json({ error: "Image or frames are required" });
      }

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: contentParts }],
        model: MODELS.VISION,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
      res.status(200).json({ analysis, success: true });
    } catch (error: any) {
      console.error("Vision Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Link Analysis
  app.post("/api/analyze-link", async (req, res) => {
    if (!groq) return res.status(500).json({ error: "Groq not initialized" });
    const { url } = req.body;

    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const jinaResponse = await axios.get(jinaUrl);
      const markdown = jinaResponse.data;

      const systemInstruction = `Sen bir web analiz uzmanısın. Gelen sitenin markdown içeriğini incele.
      Sitenin tasarım dilini, renk paletini (hex kodları), ana fonksiyonlarını ve içerik hiyerarşisini analiz et.
      Yanıtını mutlaka şu JSON formatında döndür:
      {
        "design_language": "...",
        "colors": ["#...", "#..."],
        "functions": ["...", "..."],
        "content_hierarchy": "...",
        "summary": "...",
        "technical_details": "..."
      }`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Aşağıdaki sitenin içeriğini analiz et:\n\n${markdown}` }
        ],
        model: MODELS.ANALYZER,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
      res.status(200).json({ analysis, success: true });
    } catch (error: any) {
      console.error("Link Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // YouTube Analysis
  app.post("/api/analyze-youtube", async (req, res) => {
    if (!groq) return res.status(500).json({ error: "Groq not initialized" });
    const { url } = req.body;

    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const jinaResponse = await axios.get(jinaUrl);
      const content = jinaResponse.data;

      const systemInstruction = `Sen bir içerik ve web tasarım stratejistisin. YouTube videosu içeriğini analiz et.
      Bu videonun konusuna uygun profesyonel bir "Landing Page" taslağı oluştur.
      Yanıtını mutlaka şu JSON formatında döndür:
      {
        "video_summary": "...",
        "target_audience": "...",
        "design_language": "...",
        "colors": ["#...", "#..."],
        "landing_page_sections": [
          { "title": "...", "content": "..." }
        ],
        "cta_text": "...",
        "technical_details": "..."
      }`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Aşağıdaki YouTube videosu içeriğini analiz et:\n\n${content}` }
        ],
        model: MODELS.ANALYZER,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
      res.status(200).json({ analysis, success: true });
    } catch (error: any) {
      console.error("YouTube Analysis Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Web Search
  app.post("/api/web-search", async (req, res) => {
    if (!groq) return res.status(500).json({ error: "Groq not initialized" });
    const { query } = req.body;
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    if (!TAVILY_API_KEY) return res.status(500).json({ error: "TAVILY_API_KEY is not set" });

    try {
      const tavilyResponse = await axios.post('https://api.tavily.com/search', {
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "advanced",
        max_results: 5
      });

      const searchResults = tavilyResponse.data.results;
      const searchContext = searchResults.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join('\n\n---\n\n');

      const systemInstruction = `Sen bir arama asistanısın. Web arama sonuçlarını incele ve kullanıcı sorusuna en doğru yanıtı ver.
      Yanıtını mutlaka şu JSON formatında döndür:
      {
        "summary": "...",
        "key_findings": ["...", "..."],
        "sources": ["...", "..."],
        "technical_trends": "...",
        "design_recommendations": "..."
      }`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Soru: ${query}\n\nArama Sonuçları:\n${searchContext}` }
        ],
        model: MODELS.FAST,
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
      res.status(200).json({ analysis, success: true });
    } catch (error: any) {
      console.error("Web Search Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- END NEW ANALYSIS MODULES ---

  // AI Music Generation (Direct URL)
  app.post("/api/generate-music", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const seed = Math.floor(Math.random() * 1000000);
      // Pollinations AI Audio API URL (Direct construction)
      const audioUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?model=audio&seed=${seed}`;

      return res.status(200).json({ 
        status: 'completed',
        requestId: `music-${seed}`,
        url: audioUrl,
        duration: '0:30'
      });
    } catch (error: any) {
      console.error("Music Generation Error:", error);
      res.status(500).json({ error: "Müzik üretimi sırasında bir hata oluştu." });
    }
  });

  app.get("/api/generate-music/status/:requestId", (req, res) => {
    const { requestId } = req.params;
    const request = asyncRequests.get(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  });

  // AI Video Generation (Async with Polling)
  // AI Video Studio (Pollinations.ai)
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "No prompt provided" });

      console.log("Generating video with Pollinations.ai...");
      const seed = Math.floor(Math.random() * 1000000);
      const videoUrl = `https://video.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}`;
      
      return res.status(200).json({ 
        url: videoUrl,
        success: true 
      });
    } catch (error: any) {
      console.error("Video Generation Error:", error.message);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.get("/api/generate-video/status/:requestId", (req, res) => {
    const { requestId } = req.params;
    const request = asyncRequests.get(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  });

  // AI Image Generator (Pollinations.ai)
  app.post("/api/image", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "No prompt provided" });

      console.log("Generating image with Pollinations.ai...");
      
      // Optional prompt enrichment
      let optimizedPrompt = prompt;
      try {
        if (groq) {
          const completion = await groq.chat.completions.create({
            messages: [
              { 
                role: "system", 
                content: "You are an expert AI prompt engineer. Translate the user's request to English if needed and expand it into a highly detailed, artistic, and cinematic prompt for an image generator. Output ONLY the expanded prompt text." 
              },
              { role: "user", content: prompt },
            ],
            model: MODELS.FAST,
          });
          optimizedPrompt = completion.choices[0]?.message?.content || prompt;
        }
      } catch (groqError) {
        console.warn("Groq Optimization Error (using original prompt):", groqError);
      }

      const seed = Math.floor(Math.random() * 1000000);
      const safePrompt = encodeURIComponent(optimizedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1280&height=720&model=flux&nologo=true&seed=${seed}&enhance=true`;

      return res.status(200).json({ 
        url: imageUrl,
        success: true,
        optimizedPrompt: optimizedPrompt
      });
    } catch (error: any) {
      console.error("Image Generation Error:", error.message);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  app.post("/api/vision", async (req, res) => {
    if (!groq) return res.status(500).json({ error: "Groq not initialized" });
    
    const { image, prompt = "What is in this image?" } = req.body;

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
        model: MODELS.VISION,
      });
      res.status(200).json({ content: completion.choices[0]?.message?.content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/video", async (req, res) => {
    if (!groq) return res.status(500).json({ error: "Groq not initialized" });
    
    const { frames, prompt = "Summarize the events in this video based on these frames." } = req.body;

    try {
      const contentParts: any[] = [{ type: "text", text: prompt }];
      frames.slice(0, 5).forEach((frame: string) => {
        contentParts.push({ type: "image_url", image_url: { url: frame } });
      });

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: contentParts }],
        model: MODELS.VISION,
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
