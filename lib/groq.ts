import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

export const CHAT_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "gemma2-9b-it"
];

export const VISION_MODEL = "llama-3.2-11b-vision-preview";
