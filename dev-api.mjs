// dev-api.mjs — local dev server only (production still uses /api/generate.ts on Vercel)
import http from "node:http";
import OpenAI from "openai";

const PORT = 4001;
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const json = (res, code, obj) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(obj));
};

http.createServer(async (req, res) => {
  if (req.url === "/api/generate" && req.method === "POST") {
    let body = "";
    req.on("data", c => (body += c));
    req.on("end", async () => {
      try {
        if (!process.env.OPENAI_API_KEY) return json(res, 500, { error: "Missing OPENAI_API_KEY" });
        const { prompt, model = "gpt-4o-mini" } = JSON.parse(body || "{}");
        if (typeof prompt !== "string" || !prompt.trim()) return json(res, 400, { error: "Missing prompt" });

        const completion = await client.chat.completions.create({
          model,
          temperature: 0.7,
          max_tokens: 2500,
          messages: [
            { role: "system", content: "You create quiz questions. Output ONLY a valid JSON array with the exact property names. No markdown or extra text." },
            { role: "user", content: prompt }
          ]
        });

        const content = completion.choices?.[0]?.message?.content ?? "[]";
        return json(res, 200, { content });
      } catch (e) {
        console.error("Local API error:", e?.status, e?.message);
        return json(res, 500, { error: e?.message || "OpenAI request failed" });
      }
    });
  } else if (req.url === "/api/generate") {
    json(res, 405, { error: "Method not allowed" });
  } else {
    res.writeHead(404).end();
  }
}).listen(PORT, () => console.log(`dev API listening on http://localhost:${PORT}`));
