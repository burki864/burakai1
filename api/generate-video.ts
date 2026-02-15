// Not: Pika için resmi bir SDK yoksa 'axios' veya 'fetch' kullanman en güvenlisidir.
import axios from 'axios';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, aspectRatio = '16:9' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required for video synthesis.' });
    }

    const PIKA_API_KEY = process.env.PIKA_API_KEY;

    // 1. ADIM: Video Üretimini Başlat (Generate)
    const generateResponse = await axios.post(
      'https://api.pika.art/v1/generate',
      {
        promptText: prompt,
        options: {
          aspectRatio: aspectRatio === '16:9' ? 1 : (aspectRatio === '9:16' ? 2 : 0), // Pika oranları sayısal alabilir
          frameRate: 24
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${PIKA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const jobId = generateResponse.data.jobId;

    // 2. ADIM: Polling (Video hazır olana kadar bekle)
    const startTime = Date.now();
    const pollTimeout = 50000; // 50 saniye (Vercel/Serverless sınırı)
    let videoUrl = null;

    while (Date.now() - startTime < pollTimeout) {
      const statusResponse = await axios.get(
        `https://api.pika.art/v1/jobs/${jobId}`,
        {
          headers: { 'Authorization': `Bearer ${PIKA_API_KEY}` }
        }
      );

      const job = statusResponse.data;

      if (job.status === 'completed') {
        videoUrl = job.videoUrl;
        break;
      } else if (job.status === 'failed') {
        throw new Error('Pika synthesis failed: Job marked as failed.');
      }

      // 5 saniye bekle ve tekrar dene
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // 3. ADIM: Yanıt Döndür
    if (!videoUrl) {
      return res.status(202).json({ 
        message: 'Synthesis in progress on Pika servers.',
        jobId: jobId 
      });
    }

    return res.status(200).json({ videoUrl });

  } catch (error: any) {
    console.error('[PIKA-GENERATE ERROR]', error.response?.data || error.message);
    return res.status(500).json({ 
      error: error.response?.data?.message || 'An internal error occurred during Pika synthesis.' 
    });
  }
}