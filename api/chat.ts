
export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt, history, settings, attachments } = req.body;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    }

    // Determine model: use vision model if attachments exist, otherwise use a versatile text model
    const hasAttachments = attachments && attachments.length > 0;
    const model = hasAttachments ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';

    const systemMessage = {
      role: 'system',
      content: settings?.systemPrompt || 'You are BurakAI, a high-performance neural assistant powered by Groq. You are helpful, precise, and respond with extreme speed.'
    };

    const messages = [
      systemMessage,
      ...history.map((h: any) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content
      }))
    ];

    // Build the final user message part
    let userContent: any = prompt;
    if (hasAttachments) {
      userContent = [
        { type: 'text', text: prompt },
        ...attachments.map((att: any) => ({
          type: 'image_url',
          image_url: {
            url: `data:${att.mimeType};base64,${att.data}`
          }
        }))
      ];
    }

    messages.push({ role: 'user', content: userContent });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: settings?.creativity ?? 0.7,
        stream: true,
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Groq API request failed');
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No readable stream from Groq');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line === 'data: [DONE]') continue;
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const content = data.choices[0]?.delta?.content || '';
            if (content) {
              res.write(content);
            }
          } catch (e) {
            console.error('Error parsing Groq stream chunk:', e);
          }
        }
      }
    }

    res.end();

  } catch (error: any) {
    console.error('Groq API Error:', error);
    res.status(500).json({ error: error.message || 'An error occurred during synthesis.' });
  }
}
