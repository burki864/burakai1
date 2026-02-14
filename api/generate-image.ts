
export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt } = req.body;
    let finalPrompt = prompt ? prompt.trim() : "";
    
    // Clean Turkish trigger words: ["resim", "görsel", "çiz"]
    const triggers = ["resim", "görsel", "çiz"];
    triggers.forEach(t => {
      finalPrompt = finalPrompt.replace(new RegExp(t, "gi"), "");
    });
    finalPrompt = finalPrompt.trim();

    if (!finalPrompt) {
      return res.status(400).json({ error: 'Prompt content is required after trigger cleaning.' });
    }

    const HF_TOKEN = process.env.HF_TOKEN;
    if (!HF_TOKEN) {
      return res.status(500).json({ error: 'Neural link failed: HF_TOKEN is missing.' });
    }

    // Call HuggingFace Inference API for FLUX.1-schnell
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
      throw new Error(`HuggingFace API error: ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    // Return image as base64 data URL
    const imageUrl = `data:image/jpeg;base64,${base64Data}`;

    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('[GENERATE_IMAGE_ERROR]', error);
    return res.status(500).json({ 
      error: error.message || 'Vision synthesis failed.' 
    });
  }
}
