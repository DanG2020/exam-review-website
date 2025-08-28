// api/generate.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      res.status(500).json({ error: 'Missing OPENAI_API_KEY on server' });
      return;
    }

    // Body can arrive as string in Vercel functions
    let body: any = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }

    const { prompt, model = 'gpt-4o-mini' } = body;
    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Missing prompt' });
      return;
    }

    // Lazy import avoids top-level ESM issues on cold starts/GETs
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: key });

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 2500,
      messages: [
        {
          role: 'system',
          content:
            'You create quiz questions. Output ONLY a valid JSON array with the exact property names. No markdown or extra text.',
        },
        { role: 'user', content: prompt },
      ],
    });

    const content = completion.choices?.[0]?.message?.content ?? '[]';
    res.status(200).json({ content });
  } catch (err: any) {
    console.error('API generate error:', err?.stack || err?.message || err);
    res.status(500).json({
      error: err?.message || 'OpenAI request failed',
      details: err?.response?.data ?? null,
    });
  }
}
