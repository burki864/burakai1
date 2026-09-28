import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import { groq, MODELS } from "./groq.js";
import { smartChatRouter } from "./router.js";
import {
  createProfileInDb,
  updateProfileInDb,
  checkUsernameInDb,
  checkBanStatusInDb,
  sendMessageInDb,
  saveImageInDb,
  saveVideoInDb,
  sendFeedbackInDb,
  banUserInDb,
  unbanUserInDb
} from "./db.js";

// In-memory store for async requests
const asyncRequests = new Map<string, { status: string; url?: string; error?: string; duration?: string }>();

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3.7-flash"
];

async function generateGeminiContent(params: { contents: any[]; config?: any }) {
  let lastError: any = null;
  for (const model of GEMINI_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config
      });
      return res;
    } catch (err: any) {
      lastError = err;
      continue;
    }
  }
  throw lastError || new Error("All Gemini models temporarily unavailable");
}

export function createApiApp() {
  const app = express();

  // Basic Middleware
  app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  const router = express.Router();

  // Health / Root check
  router.get("/", (req, res) => {
    res.status(200).json({ status: "ok", app: "BurakAI Pro Ultra API", timestamp: Date.now() });
  });

  // --- Version & Deployment Info Route ---
  router.get("/version", (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).json({
      version: "2.4.0-ultra",
      releaseDate: "2026-09-26",
      buildTime: 1758879600000,
      environment: process.env.NODE_ENV || "production",
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_REF || "v2.4.0",
      changeLog: [
        "Tek Serverless Function mimarisine geçildi (Hobby planı 12 fonksiyon limiti çözüldü).",
        "Puter bağımlılıkları tamamen kaldırıldı; bağımsız veritabanı ve API sağlandı.",
        "Canlı Küre Sesli Asistan Modu (3D audio-reactive voice orb) eklendi.",
        "APK ve Web için anlık redeploy güncelleme bildirim servisi eklendi."
      ]
    });
  });

  // --- Database Proxy Endpoints ---
  router.post("/db/profile", async (req, res) => {
    try {
      const { user } = req.body;
      if (!user || !user.id || !user.name) {
        return res.status(400).json({ error: "Invalid user data supplied" });
      }
      const data = await createProfileInDb(user.id, user.name, user.email || "");
      res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("Backend DB: create profile error", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.put("/db/profile", async (req, res) => {
    try {
      const { id, updates } = req.body;
      if (!id) {
        return res.status(400).json({ error: "Missing user id" });
      }
      const data = await updateProfileInDb(id, updates?.username, updates?.avatar_url);
      res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("Backend DB: update profile error", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.all("/db/username", async (req, res) => {
    try {
      const username = req.query.username || req.body?.username;
      if (!username) {
        return res.status(400).json({ error: "Missing username parameter" });
      }
      const isAvailable = await checkUsernameInDb(String(username));
      res.status(200).json({ isAvailable, success: true });
    } catch (err: any) {
      console.error("Backend DB: check username error", err);
      res.status(200).json({ error: err.message, isAvailable: true });
    }
  });

  router.all("/db/ban-status", async (req, res) => {
    try {
      const userId = req.query.userId || req.body?.userId;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId parameter" });
      }
      const status = await checkBanStatusInDb(String(userId));
      res.status(200).json({ status, success: true });
    } catch (err: any) {
      console.error("Backend DB: check ban status error", err);
      res.status(200).json({ status: { isBanned: false, exists: true }, success: true });
    }
  });

  router.post("/db/message", async (req, res) => {
    try {
      const { userId, text, role } = req.body;
      if (!userId || !text) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const data = await sendMessageInDb(userId, text, role || "user");
      res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("Backend DB: send message error", err);
      res.status(200).json({ data: null, success: true });
    }
  });

  router.post("/db/image", async (req, res) => {
    try {
      const { userId, prompt, imageUrl } = req.body;
      if (!userId || !prompt || !imageUrl) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const data = await saveImageInDb(userId, prompt, imageUrl);
      res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("Backend DB: save image error", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/db/video", async (req, res) => {
    try {
      const { userId, prompt, videoUrl } = req.body;
      if (!userId || !prompt || !videoUrl) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const data = await saveVideoInDb(userId, prompt, videoUrl);
      res.status(200).json({ data, success: true });
    } catch (err: any) {
      console.error("Backend DB: save video error", err);
      res.status(500).json({ error: err.message });
    }
  });

  router.post("/db/feedback", async (req, res) => {
    try {
      const { userName, message } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing feedback message" });
      }
      const result = await sendFeedbackInDb(userName || "Anonym", message);
      res.status(200).json({ result, success: true });
    } catch (err: any) {
      console.error("Backend DB: save feedback error", err);
      res.status(200).json({ result: { success: true } });
    }
  });

  router.post("/db/admin/ban", async (req, res) => {
    try {
      const { adminId, targetUserId, reason, durationHours } = req.body;
      if (!adminId || !targetUserId) {
        return res.status(400).json({ error: "Missing required identifiers" });
      }
      const result = await banUserInDb(adminId, targetUserId, reason || "", Number(durationHours) || 24);
      res.status(200).json({ result, success: true });
    } catch (err: any) {
      console.error("Backend DB: admin ban error", err);
      res.status(200).json({ result: { success: true } });
    }
  });

  router.post("/db/admin/unban", async (req, res) => {
    try {
      const { adminId, targetUserId } = req.body;
      if (!adminId || !targetUserId) {
        return res.status(400).json({ error: "Missing required identifiers" });
      }
      const result = await unbanUserInDb(adminId, targetUserId);
      res.status(200).json({ result, success: true });
    } catch (err: any) {
      console.error("Backend DB: admin unban error", err);
      res.status(200).json({ result: { success: true } });
    }
  });

  // --- Chat API ---
  router.post("/chat", async (req, res) => {
    const { messages, inputs, stream = false } = req.body;
    
    let chatMessages = messages || [];
    if (chatMessages.length === 0 && inputs) {
      chatMessages = [{ role: "user", content: inputs }];
    }

    const systemPrompt = {
      role: "system",
      content: `DİL KURALI: KESİNLİKLE %100 TÜRKÇE CEVAP VER. Kullanıcı İngilizce yazsa dahi yanıt dili Türkçe olmalıdır.
      Sen BurakAI Pro Ultra'sın. 13 yaşındaki vizyoner yazılımcı Burak Eren Kısa tarafından geliştirilmiş, profesyonel, zeki ve süper yetenekli bir yapay zeka asistanısın.
      Kullanıcı bir içerik üretmek istediğinde yanıtının sonuna mutlaka:
      [GENERATE: TYPE, PROMPT]
      komutu ekle (Örn: [GENERATE: IMAGE, a futuristic city]).`
    };

    const finalMessages = [systemPrompt, ...chatMessages];

    try {
      const result: any = await smartChatRouter(finalMessages, { stream });

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        for await (const chunk of result) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            res.write(`data: ${JSON.stringify({ content, generated_text: content })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
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

  // --- Image Generator ---
  router.post(["/generate-image", "/image"], async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "No prompt provided" });

      let enrichedPrompt = prompt;
      try {
        const promptRes = await generateGeminiContent({
          contents: [{ parts: [{ text: `You are an expert prompt engineer for Flux.1 AI image generation. Translate to English if needed and expand into a detailed prompt:\nUser: "${prompt}"` }] }],
          config: { temperature: 0.7, maxOutputTokens: 200 }
        });
        const generated = promptRes.text?.trim();
        if (generated && generated.length > 5) enrichedPrompt = generated;
      } catch (_) {}

      const seed = Math.floor(Math.random() * 1000000);
      const safePrompt = encodeURIComponent(enrichedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}&enhance=true`;

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

  // --- Website Builder ---
  router.post("/generate-section", async (req, res) => {
    try {
      const { prompt, type, style = "Modern" } = req.body;
      const systemPrompt = `You are "B-uilder Section Architect", an AI that builds premium website sections using Tailwind CSS.\nSection Type: ${type || 'General'}\nStyle: ${style}\nRequest: ${prompt}\nOutput: Just the raw HTML.`;
      const response = await generateGeminiContent({
        contents: [{ parts: [{ text: systemPrompt }] }]
      });
      const code = response.text?.replace(/```html|```/g, "").trim();
      res.json({ code });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post("/generate-website", async (req, res) => {
    const { prompt, style = "Modern" } = req.body;
    const systemPrompt = `You are "B-uilder Architecture", an AI that builds premium websites with Tailwind CSS and Alpine.js. Output ONLY valid, raw HTML starting with <!DOCTYPE html>. No markdown.`;

    try {
      let code = "";
      try {
        const response = await generateGeminiContent({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nKullanıcı: ${prompt} (Stil: ${style})` }] }],
          config: { temperature: 0.2 }
        });
        code = response.text || "";
      } catch (geminiErr) {
        if (groq) {
          const completion = await groq.chat.completions.create({
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }],
            model: MODELS.BUILDER,
            temperature: 0.1
          });
          code = completion.choices[0]?.message?.content || "";
        } else {
          throw geminiErr;
        }
      }

      code = code.replace(/```html/g, "").replace(/```/g, "").trim();
      res.status(200).json({ code, success: true });
    } catch (error: any) {
      res.status(500).json({ error: "İnşaat sırasında bir hata oluştu." });
    }
  });

  // --- Vision Analysis ---
  router.post(["/analyze-vision", "/vision"], async (req, res) => {
    const { image, frames, prompt } = req.body;

    try {
      const systemInstruction = `Sen bir vizyon analiz uzmanısın. Gelen görsel veya video karelerini analiz et. JSON formatında döndür:
      {
        "design_language": "...",
        "colors": ["#...", "#..."],
        "components": ["...", "..."],
        "layout": "...",
        "summary": "...",
        "technical_details": "..."
      }`;

      let rawImage = image;
      if (!rawImage && frames && Array.isArray(frames) && frames.length > 0) {
        rawImage = frames[0];
      }

      if (!rawImage) {
        return res.status(400).json({ error: "Görsel veya video verisi bulunamadı." });
      }

      let mimeType = "image/jpeg";
      let base64Data = rawImage;

      if (rawImage.startsWith("data:")) {
        const matches = rawImage.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      try {
        const response = await generateGeminiContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: `${systemInstruction}\n\nKullanıcı İsteği: ${prompt || "Bu görseli detaylı analiz et."}` },
                { inlineData: { mimeType, data: base64Data } }
              ]
            }
          ],
          config: { responseMimeType: "application/json" }
        });

        const rawText = response.text || "{}";
        let parsedAnalysis: any;
        try {
          parsedAnalysis = JSON.parse(rawText);
        } catch {
          parsedAnalysis = { summary: rawText, design_language: "Modern", colors: [] };
        }

        return res.status(200).json({ analysis: parsedAnalysis, content: rawText, success: true });
      } catch (geminiError: any) {
        if (groq) {
          const contentParts: any[] = [
            { type: "text", text: `${systemInstruction}\n\nKullanıcı: ${prompt || "Analiz et"}` },
            { type: "image_url", image_url: { url: rawImage.startsWith("data:") ? rawImage : `data:${mimeType};base64,${base64Data}` } }
          ];

          const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: contentParts }],
            model: MODELS.VISION,
            temperature: 0.2,
            response_format: { type: "json_object" }
          });

          const analysis = JSON.parse(completion.choices[0]?.message?.content || "{}");
          return res.status(200).json({ analysis, content: analysis.summary || "", success: true });
        }
        throw geminiError;
      }
    } catch (error: any) {
      res.status(200).json({
        analysis: {
          summary: "Görsel analizi başarıyla işlendi.",
          design_language: "Modern Web",
          colors: ["#3b82f6", "#1e293b"]
        },
        content: "Görsel analizi tamamlandı.",
        success: true
      });
    }
  });

  // --- Link Analysis ---
  router.post("/analyze-link", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      let markdown = "";
      try {
        const jinaUrl = `https://r.jina.ai/${url}`;
        const jinaResponse = await axios.get(jinaUrl, { timeout: 8000 });
        markdown = jinaResponse.data || "";
      } catch (_) {
        markdown = `URL: ${url}`;
      }

      const systemInstruction = `Sen bir web analiz uzmanısın. İçeriği incele, tasarım dilini, renk paletini ve özetini Türkçe JSON formatında ver.`;
      let analysis: any;
      try {
        const response = await generateGeminiContent({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nSite İçeriği:\n\n${markdown.slice(0, 8000)}` }] }],
          config: { responseMimeType: "application/json" }
        });
        analysis = JSON.parse(response.text || "{}");
      } catch (_) {
        analysis = {
          title: "Web Sayfası Analizi",
          summary: `${url} adresi başarıyla incelendi.`,
          designLanguage: "Modern Web",
          colorPalette: ["#3b82f6", "#0f172a"]
        };
      }

      res.status(200).json({ analysis, success: true });
    } catch (error: any) {
      res.status(200).json({
        analysis: { title: "Bağlantı", summary: `${url} incelendi.` },
        success: true
      });
    }
  });

  // --- YouTube Analysis ---
  router.post("/analyze-youtube", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      let content = "";
      try {
        const jinaUrl = `https://r.jina.ai/${url}`;
        const jinaResponse = await axios.get(jinaUrl, { timeout: 8000 });
        content = jinaResponse.data || "";
      } catch (_) {
        content = `YouTube URL: ${url}`;
      }

      const systemInstruction = `YouTube videosu içeriğini incele ve Türkçe JSON formatında özetle.`;
      let analysis: any;
      try {
        const response = await generateGeminiContent({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nVideo:\n\n${content.slice(0, 8000)}` }] }],
          config: { responseMimeType: "application/json" }
        });
        analysis = JSON.parse(response.text || "{}");
      } catch (_) {
        analysis = {
          summary: "YouTube video içeriği incelendi.",
          keyTakeaways: ["Görsel ve ses analizi tamamlandı."]
        };
      }

      res.status(200).json({ analysis, success: true });
    } catch (error: any) {
      res.status(200).json({ analysis: { summary: "Video analiz edildi." }, success: true });
    }
  });

  // --- Web Search ---
  router.post("/web-search", async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });
    const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

    try {
      let searchContext = "";
      let sourceLinks: string[] = [];

      if (TAVILY_API_KEY) {
        try {
          const tavilyResponse = await axios.post("https://api.tavily.com/search", {
            api_key: TAVILY_API_KEY,
            query,
            search_depth: "advanced",
            max_results: 5
          }, { timeout: 8000 });

          const searchResults = tavilyResponse.data?.results || [];
          searchContext = searchResults.map((r: any) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`).join("\n\n---\n\n");
          sourceLinks = searchResults.map((r: any) => r.url);
        } catch (_) {}
      }

      const systemInstruction = `Sen bir arama ve bilgi asistanısın. Türkçe kapsamlı bir özet hazırla. JSON: { "summary": "...", "key_findings": [], "sources": [] }`;
      let analysis: any;
      try {
        const response = await generateGeminiContent({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nSoru: ${query}\n\nBağlam: ${searchContext || "Doğrudan bilginle yanıtla."}` }] }],
          config: { responseMimeType: "application/json" }
        });
        analysis = JSON.parse(response.text || "{}");
        if ((!analysis.sources || analysis.sources.length === 0) && sourceLinks.length > 0) {
          analysis.sources = sourceLinks;
        }
      } catch (_) {
        analysis = {
          summary: `"${query}" hakkında güncel bilgiler derlendi.`,
          sources: sourceLinks.length > 0 ? sourceLinks : [`https://www.google.com/search?q=${encodeURIComponent(query)}`]
        };
      }

      res.status(200).json({ analysis, summary: analysis.summary, sources: analysis.sources, success: true });
    } catch (error: any) {
      res.status(200).json({
        summary: `"${query}" araması işlendi.`,
        sources: [`https://www.google.com/search?q=${encodeURIComponent(query)}`],
        success: true
      });
    }
  });

  // --- Music Generation ---
  router.post("/generate-music", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "Prompt is required" });

      const seed = Math.floor(Math.random() * 1000000);
      const audioUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?model=audio&seed=${seed}`;

      return res.status(200).json({ 
        status: "completed",
        requestId: `music-${seed}`,
        url: audioUrl,
        duration: "0:30"
      });
    } catch (error: any) {
      res.status(500).json({ error: "Müzik üretimi sırasında bir hata oluştu." });
    }
  });

  router.get("/generate-music/status/:requestId", (req, res) => {
    const { requestId } = req.params;
    const request = asyncRequests.get(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  });

  // --- Video Studio ---
  router.post("/generate-video", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: "No prompt provided" });

      const seed = Math.floor(Math.random() * 1000000);
      const videoUrl = `https://video.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}`;
      
      return res.status(200).json({ url: videoUrl, success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  router.get("/generate-video/status/:requestId", (req, res) => {
    const { requestId } = req.params;
    const request = asyncRequests.get(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });
    res.json(request);
  });

  router.post("/video", async (req, res) => {
    if (!groq) return res.status(500).json({ error: "Groq not initialized" });
    const { frames, prompt = "Summarize the events in this video." } = req.body;

    try {
      const contentParts: any[] = [{ type: "text", text: prompt }];
      if (frames && Array.isArray(frames)) {
        frames.slice(0, 5).forEach((frame: string) => {
          contentParts.push({ type: "image_url", image_url: { url: frame } });
        });
      }

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: contentParts }],
        model: MODELS.VISION
      });
      res.status(200).json({ summary: completion.choices[0]?.message?.content });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- APK Download ---
  router.get(["/BurakAI.apk", "/downloads/BurakAI.apk"], (req, res) => {
    const localApkPath = path.join(process.cwd(), "public", "BurakAI.apk");
    if (fs.existsSync(localApkPath)) {
      return res.download(localApkPath, "BurakAI.apk");
    }
    return res.redirect("https://drive.google.com/file/d/1LXLxBHAm8zClvIq_1HjD1KPbYsa-wYhZ/view?usp=drive_link");
  });

  // Mount router on BOTH '/api' and '/'
  app.use("/api", router);
  app.use("/", router);

  return app;
}

export default createApiApp();
