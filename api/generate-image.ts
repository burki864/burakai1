
export const config = {
  runtime: 'nodejs',
};

const STYLE = "ultra realistic, cinematic lighting, natural anatomy, professional photography, sharp focus, detailed face, correct hands, high quality, 4k";
const NEGATIVE = "deformed, bad anatomy, extra fingers, distorted face, blurry, low quality, ugly, mutated hands";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, aspectRatio = "1:1" } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const hfToken = process.env.HF_API_KEY;
    if (!hfToken) {
      console.error("HF_API_KEY is missing from environment variables.");
      return res.status(500).json({ error: 'Server configuration error: HF_API_KEY missing.' });
    }

    // 1. Prompt Enhancement
    const finalPrompt = `${STYLE}, ${prompt.trim()}`;

    // 2. Aspect Ratio to Size Mapping
    let width = 1024;
    let height = 1024;
    
    if (aspectRatio === "16:9") {
      width = 1344;
      height = 768;
    } else if (aspectRatio === "9:16") {
      width = 768;
      height = 1344;
    }

    // 3. HuggingFace Call with Retry Logic
    let response;
    let lastError = null;
    const maxRetries = 3;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        response = await fetch(
          "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: finalPrompt,
              parameters: {
                negative_prompt: NEGATIVE,
                width: width,
                height: height,
              },
            }),
          }
        );

        if (response.status === 503) {
          console.warn(`Attempt ${i + 1}: Model loading (503). Retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HuggingFace API error (${response.status}): ${errorText}`);
        }

        // Success - break the retry loop
        break;
      } catch (err: any) {
        lastError = err;
        if (i === maxRetries - 1) throw err;
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error("Failed to communicate with the neural synthesis core.");
    }

    // 4. Binary Image Handling
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const imageUrl = `data:image/png;base64,${base64Image}`;

    // 5. Return JSON
    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('HuggingFace Neural Synthesis Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Vision synthesis link failed. Neural core may be overloaded.' 
    });
  }
}
