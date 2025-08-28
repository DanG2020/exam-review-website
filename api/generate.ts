// api/generate.ts
export const config = { runtime: 'nodejs' } as const;

import OpenAI from 'openai';

export default async function handler(req: any, res: any) {
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

    const { prompt, model = 'gpt-4o-mini' } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Missing prompt' });
      return;
    }

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
    console.error('API /api/generate failed:', err);
    res.status(500).json({
      error: err?.message || 'OpenAI request failed',
      details: err?.response?.data ?? null,
    });
  }
}
