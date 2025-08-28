import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      console.error('Missing OPENAI_API_KEY environment variable');
      res.status(500).json({ error: 'Missing OPENAI_API_KEY on server' });
      return;
    }

    // Parse the request body more safely
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      console.error('Body parsing error:', parseError);
      res.status(400).json({ error: 'Invalid JSON in request body' });
      return;
    }

    const { prompt, model = 'gpt-4o-mini' } = body || {};

    if (typeof prompt !== 'string' || !prompt.trim()) {
      res.status(400).json({ error: 'Missing or invalid prompt' });
      return;
    }

    console.log('Creating OpenAI client...');
    const client = new OpenAI({ 
      apiKey: key,
      timeout: 30000, // 30 second timeout
    });

    console.log('Making OpenAI request...');
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 2500,
      messages: [
        {
          role: 'system',
          content: 'You create quiz questions. Output ONLY a valid JSON array with the exact property names. No markdown or extra text.'
        },
        { role: 'user', content: prompt }
      ]
    });

    const content = completion.choices?.[0]?.message?.content ?? '[]';
    console.log('OpenAI request successful');
    
    res.status(200).json({ content });
    
  } catch (error: any) {
    console.error('API /generate error:', error);
    
    // More detailed error logging
    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
      res.status(500).json({
        error: 'OpenAI API error',
        details: error.response.data,
        status: error.response.status
      });
    } else if (error.request) {
      console.error('Network error:', error.message);
      res.status(500).json({
        error: 'Network error when calling OpenAI',
        message: error.message
      });
    } else {
      console.error('Unexpected error:', error.message);
      res.status(500).json({
        error: error.message || 'Unexpected server error'
      });
    }
  }
}