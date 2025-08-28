// Force Node serverless runtime (not Edge)
export const config = { runtime: 'nodejs' } as const;

export default function handler(req: any, res: any) {
  // No imports, no env, nothing that can fail
  res.status(200).json({ ok: true, t: Date.now() });
}
