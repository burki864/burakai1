import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL_PRIORITY = [
  { provider: 'groq', model: 'llama-3.3-70b-versatile' },
  { provider: 'anthropic', model: 'claude-3-5-sonnet-20240620' },
  { provider: 'gemini', model: 'gemini-1.5-flash' }
];

const SYSTEM_PROMPT = `You are a Senior Web Architect. 
Output ONLY a valid JSON object. No conversation, no markdown blocks.
The JSON must be a flat map of filenames to content.
Requirement: Use Tailwind CSS via CDN. Modern, Dark Glassmorphism, Neon styles.
Example: { "index.html": "...", "script.js": "..." }`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  const { prompt, currentProject } = req.body;

  for (const item of MODEL_PRIORITY) {
    try {
      console.log(`🚀 Deneniyor: ${item.provider}`);
      let content = "";

      // --- GROQ ---
      if (item.provider === 'groq' && process.env.GROQ_API_KEY) {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: `PROMPT: ${prompt}\nCONTEXT: ${currentProject || "None"}` }],
            model: item.model,
            response_format: { type: "json_object" }
          })
        });
        const data = await response.json();
        content = data.choices?.[0]?.message?.content;
      } 
      // --- ANTHROPIC ---
      else if (item.provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: item.model, max_tokens: 4096, system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: `Generate JSON for: ${prompt}` }]
          })
        });
        const data = await response.json();
        content = data.content?.[0]?.text;
      }
      // --- GEMINI (v1 Endpoint - 404 Hatasız) ---
      else if (item.provider === 'gemini' && process.env.GEMINI_API_KEY) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${item.model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nRequest: ${prompt}` }] }]
          })
        });
        const data = await response.json();
        content = data.candidates?.[0]?.content?.parts?.[0]?.text;
      }

      if (content) {
        // JSON Temizleme (Markdown temizliği)
        const cleanJson = content.substring(content.indexOf('{'), content.lastIndexOf('}') + 1);
        const parsed = JSON.parse(cleanJson);
        return res.status(200).json({ project: parsed, provider: item.provider });
      }
    } catch (e) {
      console.error(`${item.provider} başarısız, sıradaki modele geçiliyor...`);
    }
  }
  return res.status(500).json({ error: "Tüm modeller meşgul, lütfen az sonra tekrar dene." });
}