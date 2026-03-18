import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

/**
 * BurakAI Görev Bazlı Model Dağılımı (2026 Standartları)
 */
export const MODELS = {
  // En zeki ve tutarlı kod yazıcı (B-UILDER)
  BUILDER: "llama-3.3-70b-versatile",

  // Link ve YouTube analizinde limit canavarı (ANALYZER)
  ANALYZER: "llama-3.1-8b-instant",

  // Görsel/Video analizinde standart (VISION)
  VISION: "llama-3.2-11b-vision-preview",

  // Asla takılmayan, en yüksek limitli hızlı model (FAST)
  FAST: "llama-3.1-8b-instant",
};

// Geriye dönük uyumluluk
export const CHAT_MODELS = [MODELS.BUILDER, MODELS.FAST, "gemma2-9b-it"];
export const VISION_MODEL = MODELS.VISION;
