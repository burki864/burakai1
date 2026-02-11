
export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, aspectRatio = '1:1', width: customWidth, height: customHeight } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Map aspect ratios to dimensions if specific width/height aren't provided
    let width = customWidth || 1024;
    let height = customHeight || 1024;

    if (!customWidth && !customHeight) {
      switch (aspectRatio) {
        case '16:9':
          width = 1280;
          height = 720;
          break;
        case '9:16':
          width = 720;
          height = 1280;
          break;
        case '4:3':
          width = 1024;
          height = 768;
          break;
        case '3:4':
          width = 768;
          height = 1024;
          break;
        case '21:9':
          width = 1440;
          height = 600;
          break;
        default: // 1:1
          width = 1024;
          height = 1024;
      }
    }

    // Generate a random seed for variety
    const seed = Math.floor(Math.random() * 1000000);
    
    // Construct Pollinations.ai URL
    // Model options: 'flux', 'turbo'
    // nologo=true removes the watermark
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=flux&nologo=true&enhance=true`;

    // Return the URL directly to the frontend
    return res.status(200).json({ 
      imageUrl: imageUrl 
    });

  } catch (error: any) {
    console.error('Pollinations API Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Image synthesis link failed.' 
    });
  }
}
