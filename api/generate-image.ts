
export const config = {
  runtime: 'nodejs',
};

/**
 * BurakAI Neural Image Synthesis
 * Model: black-forest-labs/FLUX.1-schnell
 * Implementation: HuggingFace Inference API
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    let finalPrompt = prompt ? prompt.trim() : "";
    
    // Clean Turkish trigger words: ["resim", "görsel", "çiz"]
    // Requirement: Clean trigger words before sending to model, do not alter remaining text.
    const triggers = ["resim", "görsel", "çiz"];
    triggers.forEach(t => {
      finalPrompt = finalPrompt.replace(new RegExp(t, "gi"), "");
    });
    finalPrompt = finalPrompt.trim();

    if (!finalPrompt) {
      return res.status(400).json({ error: 'Vision description is required.' });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'Neural link failed: HF_TOKEN is missing.' });
    }

    // Call HuggingFace Inference API for FLUX.1-schnell
    // Using the high-speed router endpoint
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
            num_inference_steps: 6,
            guidance_scale: 2.5
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace Core Error: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // Convert binary data to base64 for frontend display
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    // Return standard data URL for seamless UI integration
    const imageUrl = `data:image/jpeg;base64,${base64Data}`;

    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('[BURAKAI_VISION_ERROR]', error);
    return res.status(500).json({ 
      error: error.message || 'Vision synthesis failed. Neural link timeout.' 
    });
  }
}
