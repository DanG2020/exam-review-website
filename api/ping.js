// api/ping.js
module.exports = (req, res) => {
  res.status(200).json({
    ok: true,
    node: process.version,
    hasKey: !!process.env.OPENAI_API_KEY,
    now: new Date().toISOString(),
  });
};

module.exports.config = { runtime: 'nodejs' };
