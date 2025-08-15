import { OpenAI } from 'openai'
import type { QuizQuestion } from './types';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

type AllowedType = 'multiple-choice' | 'written' | 'matching';

export interface GenerateOptions {
  count?: number;                       // how many to generate
  allowedTypes?: AllowedType[];         // which types are allowed
}

/** Coerce GPT output into your internal QuizQuestion shape */
function normalizeQuestions(raw: any[]): QuizQuestion[] {
  const arr = Array.isArray(raw) ? raw : [];
  let nextId = 1;

  return arr.map((q: any) => {
    const base = {
      id: Number(q.id) || nextId++,
      text: String(q.text ?? ''),
      points: Number(q.points ?? 1),
    };

    const t = String(q.type ?? '').toLowerCase();

    if (t === 'multiple-choice' || t === 'multiplechoice' || t === 'mcq') {
      const options: string[] =
        (Array.isArray(q.options) && q.options) ||
        (Array.isArray(q.choices) && q.choices) ||
        [];
      return { ...base, type: 'multiple-choice', options } as QuizQuestion;
    }

    if (t === 'matching' || (Array.isArray(q.items) && (Array.isArray(q.matches) || Array.isArray(q.rightItems)))) {
      let leftItems: string[] = [];
      let rightItems: string[] = [];

      if (Array.isArray(q.items) && Array.isArray(q.matches)) {
        leftItems = q.items.map((x: any) => String(x));
        rightItems = q.matches.map((x: any) => String(x));
      } else if (Array.isArray(q.leftItems) && Array.isArray(q.rightItems)) {
        leftItems = q.leftItems.map((x: any) => String(x));
        rightItems = q.rightItems.map((x: any) => String(x));
      } else if (Array.isArray(q.pairs)) {
        q.pairs.forEach((p: any) => {
          if (p && typeof p === 'object' && 'left' in p && 'right' in p) {
            leftItems.push(String(p.left));
            rightItems.push(String(p.right));
          } else if (Array.isArray(p) && p.length >= 2) {
            leftItems.push(String(p[0]));
            rightItems.push(String(p[1]));
          }
        });
      }

      return { ...base, type: 'matching', leftItems, rightItems } as QuizQuestion;
    }

    const answerBoxes =
      Number(q.answerBoxes) && Number(q.answerBoxes) > 0 ? Number(q.answerBoxes) : 1;

    return { ...base, type: 'written', answerBoxes } as QuizQuestion;
  });
}

/**
 * Generate questions. Pass the user's reference text in `prompt`,
 * and control count/types via `opts` (wire these from your sliders/toggles).
 */
export async function generateQuizQuestions(
  prompt: string,
  opts: GenerateOptions = {}
): Promise<QuizQuestion[]> {
  const count = Math.max(1, Number(opts.count ?? 5));
  const allowedTypes = (opts.allowedTypes?.length
    ? opts.allowedTypes
    : (['multiple-choice', 'written', 'matching'] as AllowedType[])
  );

  // A tiny header the model will follow; your pasted practice text goes below.
  const header = `
Make EXACTLY ${count} questions as JSON only.
Allowed types: ${allowedTypes.join(', ')}.
Each object must match one of:
- multiple-choice: { id:number, type:"multiple-choice", text:string, points:number, options:string[] }
- written:         { id:number, type:"written",         text:string, points:number, answerBoxes:number }
- matching:        { id:number, type:"matching",        text:string, points:number, leftItems:string[], rightItems:string[] }
No answers, no explanations, no markdown — only a JSON array.
Use the material below as reference (don’t copy verbatim).
---
${prompt?.trim() || 'None'}
---`.trim();

  const res = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        // Keep the system message generic; don't hardcode "5"
        role: 'system',
        content:
          'You create quiz questions. You must output ONLY a valid JSON array with the exact property names. Do not include markdown code fences or any text outside the array.',
      },
      { role: 'user', content: header },
    ],
    temperature: 0.7,
  });

  let output = res.choices[0].message.content || '[]';
  output = output.trim();
  if (output.startsWith('```')) {
    output = output.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }

  try {
    const parsed = JSON.parse(output);
    const normalized = normalizeQuestions(parsed);

    // Enforce allowed types + count, then re-index IDs 1..N
    const filtered = normalized
      .filter(q => allowedTypes.includes(q.type as AllowedType))
      .slice(0, count)
      .map((q, i) => ({ ...q, id: i + 1 }));

    return filtered;
  } catch (err) {
    console.error('Failed to parse/normalize GPT output:', err);
    return [];
  }
}
