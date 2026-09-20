import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

/**
 * BurakAI Görev Bazlı Model Dağılımı (Aktif ve Stabil Modeller)
 */
export const MODELS = {
  BUILDER: "llama-3.3-70b-versatile",
  ANALYZER: "llama-3.1-8b-instant",
  VISION: "llama-3.2-11b-vision-preview",
  FAST: "llama-3.1-8b-instant",
};

// Aktif modeller
export const CHAT_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "mixtral-8x7b-32768"
];
export const VISION_MODEL = MODELS.VISION;

