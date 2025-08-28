import type { VercelRequest, VercelResponse } from '@vercel/node';
export const config = { runtime: 'nodejs' };

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, hasKey: !!process.env.OPENAI_API_KEY, node: process.version });
}
