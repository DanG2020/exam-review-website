import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { runtime: 'nodejs20.x' };

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

    const { prompt, model = 'gpt-4o-mini' } = (req.body as any) ?? {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Missing prompt' });
      return;
    }

    // dynamic import avoids any top-level bundling issues
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

    res.status(200).json({
      content: completion.choices?.[0]?.message?.content ?? '[]',
    });
  } catch (err: any) {
    // This shows up in the Vercel Function logs
    console.error('generate handler crash:', err?.stack || err);
    res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
