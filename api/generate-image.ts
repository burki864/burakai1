
export const config = {
  runtime: 'nodejs',
};

/**
 * Constants for Prompt Enhancement
 */
const NEGATIVE_PROMPT = "deformed, bad anatomy, extra fingers, distorted face, blurry, low quality, mutated hands, watermark, text, signature, grainy, low resolution";

const FALLBACK_PROMPT = "cinematic realistic portrait photography, sharp focus, highly detailed";

/**
 * Smart Prompt Enhancer Layer
 * Transforms simple user inputs into high-detail cinematic prompts.
 */
function enhancePrompt(userPrompt: string): string {
  const input = userPrompt.trim();
  if (!input || input.length < 3) return FALLBACK_PROMPT;

  const lower = input.toLowerCase();
  
  // 1. Anime Detection (Conditional Logic)
  if (lower.includes("anime") || lower.includes("manga") || lower.includes("illustration") || lower.includes("drawing")) {
    return `clean anime illustration of ${input}, vibrant colors, sharp lines, high resolution digital art, masterpiece, aesthetic composition`;
  }

  // 2. Realistic Base
  let enhanced = `ultra realistic cinematic photo of ${input}`;

  // 3. Scene Expansion - Portraits
  if (["man", "woman", "girl", "boy", "person", "human", "face", "portrait"].some(key => lower.includes(key))) {
    enhanced += ", professional portrait photography, detailed skin texture, realistic eyes, natural anatomy, realistic hands, soft bokeh background";
  }

  // 4. Scene Expansion - Environments
  if (["city", "street", "building", "landscape", "forest", "mountain", "ocean", "room", "interior"].some(key => lower.includes(key))) {
    enhanced += ", cinematic environment lighting, hyper-detailed architectural details, wide angle, depth of field, atmospheric perspective";
  }

  // 5. Final Quality Polish
  enhanced += ", sharp focus, studio lighting, high detail, 4k resolution, volumetric lighting, raytracing, professional color grading";

  return enhanced;
}

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

    // 1. Process Prompt via Enhancer
    const polishedPrompt = enhancePrompt(prompt);
    console.log(`[PROMPT POLISHER] Original: "${prompt}" -> Polished: "${polishedPrompt}"`);

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
          "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: polishedPrompt,
              parameters: {
                negative_prompt: NEGATIVE_PROMPT,
                width: width,
                height: height,
                num_inference_steps: 4, // Schnell optimized
                guidance_scale: 0.0,    // Schnell usually ignores or requires low guidance
              },
            }),
          }
        );

        // Handle 503 Service Unavailable (Model loading)
        if (response.status === 503) {
          console.warn(`[RETRY ${i + 1}] Model loading. Retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HuggingFace API error (${response.status}): ${errorText}`);
        }

        // Validate Response Type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.startsWith("image/")) {
          throw new Error(`Unexpected content type from API: ${contentType}`);
        }

        break; // Success
      } catch (err: any) {
        lastError = err;
        if (i === maxRetries - 1) throw err;
      }
    }

    if (!response || !response.ok) {
      throw lastError || new Error("Failed to communicate with the neural synthesis core.");
    }

    // 4. Binary Image Handling to Base64
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = response.headers.get("content-type") || "image/png";
    const imageUrl = `data:${mimeType};base64,${base64Image}`;

    // 5. Final Output
    return res.status(200).json({ imageUrl });

  } catch (error: any) {
    console.error('[GENERATE-IMAGE ERROR]', error);
    return res.status(500).json({ 
      error: error.message || 'Vision synthesis link failed. Neural core may be overloaded.' 
    });
  }
}
