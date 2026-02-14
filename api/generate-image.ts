export const config = { 
  runtime: 'nodejs',
};

// 🔥 GROQ PROMPT OPTIMIZER
async function optimizeWithGroq(prompt: string) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "Translate the user's prompt to English and improve it for high-quality image generation. Keep it concise but detailed."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, aspectRatio = "1:1" } = req.body;
    let finalPrompt = prompt ? prompt.trim() : "";
    const triggers = ["resim", "görsel", "çiz"];

    triggers.forEach(t => {
      finalPrompt = finalPrompt.replace(new RegExp(t, "gi"), "");
    });

    finalPrompt = finalPrompt.trim();

    if (!finalPrompt) {
      return res.status(400).json({ error: 'Prompt content is required after cleaning trigger words.' });
    }

    // 🔥 GROQ TRANSLATE + IMPROVE
    finalPrompt = await optimizeWithGroq(finalPrompt);

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'Neural synthesis link failed: HF_TOKEN is missing.' });
    }

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: finalPrompt,
          parameters: {
            num_inference_steps: 20,
            guidance_scale: 5.0,
            negative_prompt: "blurry, low quality, extra objects, distorted, bad anatomy, cropped"
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    
    const imageUrl = `data:image/jpeg;base64,${base64Data}`;

    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('[GENERATE_IMAGE_ERROR]', error);
    return res.status(500).json({ 
      error: error.message || 'Vision synthesis link failed. Neural core may be overloaded.' 
    });
  }
}
