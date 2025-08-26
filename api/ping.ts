// api/ping.js
export default function handler(req, res) {
  console.log('[ping] invoked');
  res.status(200).json({
    ok: true,
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    node: process.version,
  });
}
