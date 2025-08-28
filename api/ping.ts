export const config = { runtime: 'nodejs' };

export default function handler(req: any, res: any) {
  res.status(200).json({ ok: true, t: Date.now() });
}