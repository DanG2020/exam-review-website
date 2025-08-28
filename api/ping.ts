import type { VercelRequest, VercelResponse } from '@vercel/node';

// make the runtime explicit
export const config = { runtime: 'nodejs20.x' };

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    node: process.version,
    hasKey: !!process.env.OPENAI_API_KEY,
  });
}
