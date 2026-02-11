
export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt } = req.body;

  try {
    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) throw new Error('FAL_KEY is not configured on the server.');

    // Using fal.ai REST API for Pika Turbo
    const response = await fetch('https://fal.run/fal-ai/pika/v2/turbo/text-to-video', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Fal.ai synthesis failed.');
    }

    const data = await response.json();
    
    // Fal.ai returns video as { video: { url: "..." } } or similar
    const videoUrl = data.video?.url || data.url;
    
    if (!videoUrl) throw new Error("Video synthesis returned no content.");

    return res.status(200).json({ videoUrl });

  } catch (error: any) {
    console.error('API Video Error:', error);
    return res.status(500).json({ error: error.message || 'Video synthesis failed.' });
  }
}
