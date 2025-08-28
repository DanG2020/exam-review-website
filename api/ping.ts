// api/ping.ts
export const config = { runtime: 'nodejs' } as const;

export default function handler(req: any, res: any) {
  // ultra-minimal; no env access, no imports
  res.status(200).json({ ok: true, t: Date.now() });
}
