import type { VercelRequest, VercelResponse } from '@vercel/node';
import { groq, MODELS } from '../lib/groq.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt } = req.body;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are "B-uilder Architecture", an AI that builds websites with React-like state management using Alpine.js.

          ### 🧠 ARCHITECTURAL RULES (FOR FUNCTIONALITY):
          1. **STATE ENGINE**: Every site MUST start with a global 'x-data' object on the body. 
             - Example: <body x-data="{ cartCount: 0, isMenuOpen: false, activeTab: 'all' }">
          2. **REACTIVE BUTTONS**: Buttons must not be empty. Use Alpine.js directives:
             - Add to Cart: 'x-on:click="cartCount++"'
             - Toggle Menu: 'x-on:click="isMenuOpen = !isMenuOpen"'
             - Transitions: Use 'x-show' with 'x-transition' for smooth opening/closing.
          3. **DYNAMIC COMPONENTS**: 
             - Use 'x-text="cartCount"' to show live updates.
             - Use 'x-bind:class' to change styles based on state (e.g., active button color).

          ### 🎨 2026 DESIGN (NEXT.JS LOOK):
          - **Bento-Grid** layout (grid-cols-12).
          - **Glassmorphism** everywhere (backdrop-blur-xl).
          - **Typography**: Inter/Outfit, tracking-tighter, massive gradients.

          ### 🛠️ STACK (REQUIRED):
          - Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
          - Alpine.js (The Brain): <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
          - Animate on Scroll: <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
          - <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>

          ### ❌ OUTPUT RULES:
          - Output ONLY valid, raw HTML. 
          - Initialize AOS: <script>document.addEventListener('DOMContentLoaded', () => { AOS.init({once: true}); });</script>
          - No explanations. Just code.`
        },
        { role: "user", content: prompt },
      ],
      model: MODELS.BUILDER,
      temperature: 0.1,
    });

    const code = completion.choices[0]?.message?.content || "";
    const cleanedCode = code.replace(/```html/g, "").replace(/```/g, "").trim();

    return res.status(200).json({ code: cleanedCode, success: true });

  } catch (error: any) {
    return res.status(500).json({ error: "İnşaat sırasında bir hata oluştu." });
  }
}