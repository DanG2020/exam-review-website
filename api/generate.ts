// api/generate.ts
export const config = { runtime: 'nodejs' };

type Req = any;
type Res = any;

async function readJson(req: Req) {
  // If body is already parsed
  if (req?.body && typeof req.body === 'object') return req.body;

  // Otherwise read raw stream
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async function handler(req: Req, res: Res) {
  // (Optional) handle CORS preflight if needed
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing OPENAI_API_KEY on server' }));
    return;
  }

  const body = await readJson(req);
  const { prompt, model = 'gpt-4o-mini' } = body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    res.statusCode = 400;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing prompt' }));
    return;
  }

  try {
    // Dynamic import works in CommonJS
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

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ content }));
  } catch (err: any) {
    console.error('OpenAI error:', err?.status, err?.message, err?.response?.data);
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: err?.message || 'OpenAI request failed',
        details: err?.response?.data ?? null,
      })
    );
  }
}
