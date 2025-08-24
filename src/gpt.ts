// src/gpt.ts — server-backed version (no OpenAI key in the browser)
import type { QuizQuestion } from './types';

type AllowedType = 'multiple-choice' | 'written' | 'matching';

export interface GenerateOptions {
  count?: number;
  allowedTypes?: AllowedType[];
  enforceExactCount?: boolean; // default true
  topic?: string;
}

/* -------------------- Helpers: varied filler + dedupe -------------------- */

function pick<T>(arr: T[], i: number) {
  return arr[i % arr.length];
}

function createFillerQuestion(
  id: number,
  allowed: AllowedType[],
  topic: string,
): QuizQuestion {
  // prefer MC → Matching → Written if available
  const prefer: AllowedType[] = ['multiple-choice', 'matching', 'written'];
  const type = prefer.find(t => allowed.includes(t)) || 'written';

  if (type === 'multiple-choice') {
    const stems = [
      `Which statement about ${topic} is most accurate?`,
      `Which option best illustrates ${topic} in practice?`,
      `Which concept is core to ${topic}?`,
      `Which of these is most closely tied to ${topic}?`,
      `Which description best matches ${topic}?`,
    ];
    const variants = [
      [`A core idea in ${topic}`, `Sometimes related to ${topic}`, `Tangential`, `Not related`],
      [`Fundamental to ${topic}`, `Peripheral to ${topic}`, `Outdated`, `Incorrect`],
      [`Central principle of ${topic}`, `Occasionally relevant`, `Rarely relevant`, `Contradictory`],
    ];
    const options = pick(variants, id - 1).slice();
    const stem = pick(stems, id - 1);

    return {
      id,
      type: 'multiple-choice',
      text: stem,
      points: 1,
      options,
      correctIndex: 0,
      explanation: `Option 1 is directly tied to ${topic}; others are less central or unrelated.`,
    };
  }

  if (type === 'matching') {
    const leftBanks = [
      ['Term A', 'Term B', 'Term C'],
      ['Concept X', 'Concept Y', 'Concept Z'],
      ['Layer 1', 'Layer 2', 'Layer 3'],
    ];
    const rightBanks = [
      ['Definition A', 'Definition B', 'Definition C'],
      ['Example X', 'Example Y', 'Example Z'],
      ['Role 1', 'Role 2', 'Role 3'],
    ];
    const leftItems = pick(leftBanks, id - 1).slice();
    const rightItems = pick(rightBanks, id - 1).slice();
    return {
      id,
      type: 'matching',
      text: `Match items to their brief descriptions (${topic}).`,
      points: 1,
      leftItems,
      rightItems,
      correctMatches: [0, 1, 2],
      explanation: 'Each item pairs with the like-labeled description.',
    };
  }

  const prompts = [
    `Define one key idea in ${topic} and give a one-sentence example.`,
    `Briefly explain why ${topic} matters in practice.`,
    `State a principle of ${topic} and how it’s applied.`,
    `Describe a common pitfall to avoid in ${topic}.`,
  ];
  return {
    id,
    type: 'written',
    text: pick(prompts, id - 1),
    points: 1,
    answerBoxes: 1,
    expectedAnswers: ['Concise definition/example'],
    explanation: 'A short, precise statement is enough.',
  };
}

function ensureExactCount(
  items: QuizQuestion[],
  total: number,
  allowed: AllowedType[],
  topic: string,
): QuizQuestion[] {
  // De-duplicate by normalized question text first
  const seen = new Set<string>();
  const unique: QuizQuestion[] = [];
  for (const q of items) {
    const key = String(q.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      unique.push(q);
    }
  }

  // Top up with varied fillers if needed
  while (unique.length < total) {
    unique.push(createFillerQuestion(unique.length + 1, allowed, topic));
  }
  if (unique.length > total) unique.length = total;

  // Reindex 1..N
  return unique.map((q, i) => ({ ...q, id: i + 1 }));
}

/* -------------------- Normalization -------------------- */

function normalizeQuestions(raw: any[]): QuizQuestion[] {
  const arr = Array.isArray(raw) ? raw : [];
  let nextId = 1;

  return arr.map((q: any) => {
    const t = String(q.type ?? '').toLowerCase();

    const base = {
      id: Number(q.id) || nextId++,
      text: String(q.text ?? ''),
      points: Number.isFinite(q.points) ? Number(q.points) : 1,
      explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
    };

    if (t === 'multiple-choice' || t === 'multiplechoice' || t === 'mcq') {
      const options: string[] =
        (Array.isArray(q.options) ? q.options : Array.isArray(q.choices) ? q.choices : []).map(String);

      let correctIndex: number | undefined = undefined;
      if (Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < options.length) {
        correctIndex = q.correctIndex;
      }

      return {
        ...base,
        type: 'multiple-choice',
        options,
        correctIndex,
      } as QuizQuestion;
    }

    if (
      t === 'matching' ||
      (Array.isArray(q.items) && (Array.isArray(q.matches) || Array.isArray(q.rightItems)))
    ) {
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

      let correctMatches: number[] | undefined = undefined;
      if (Array.isArray(q.correctMatches)) {
        const cm = q.correctMatches.map((n: any) => Number(n));
        const valid =
          cm.length === leftItems.length &&
          cm.every((n) => Number.isInteger(n) && n >= 0 && n < rightItems.length);
        correctMatches = valid ? cm : undefined;
      }

      return {
        ...base,
        type: 'matching',
        leftItems,
        rightItems,
        correctMatches,
      } as QuizQuestion;
    }

    const answerBoxes =
      Number(q.answerBoxes) && Number(q.answerBoxes) > 0 ? Number(q.answerBoxes) : 1;

    const expectedAnswers = Array.isArray(q.expectedAnswers)
      ? q.expectedAnswers.map((s: any) => String(s))
      : undefined;

    return {
      ...base,
      type: 'written',
      answerBoxes,
      expectedAnswers,
    } as QuizQuestion;
  });
}

/* -------------------- Server call + retry -------------------- */

async function callOnce(prompt: string, model: string = 'gpt-4o-mini') {
  // Calls your serverless endpoint (see api/generate.ts)
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err?.error || `HTTP ${resp.status}`);
  }
  const data = await resp.json();
  let output = (data?.content ?? '[]').trim();
  if (output.startsWith('```')) {
    output = output.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  }
  return output;
}

/* -------------------- Main Generator -------------------- */

export async function generateQuizQuestions(
  prompt: string,
  opts: GenerateOptions = {}
): Promise<QuizQuestion[]> {
  const count = Math.max(1, Number(opts.count ?? 5));
  const allowedTypes: AllowedType[] =
    opts.allowedTypes?.length
      ? opts.allowedTypes
      : (['multiple-choice', 'written', 'matching'] as AllowedType[]);
  const topic = (opts.topic || 'this subject').toString();
  const enforce = opts.enforceExactCount !== false; // default true

  // First attempt
  let raw: string;
  try {
    raw = await callOnce(prompt);
  } catch {
    raw = '[]';
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Retry with stronger uniqueness reminder
    const retry = `${prompt}

IMPORTANT: All questions must be UNIQUE. Do not reuse the same stem or template. Vary phrasing, subtopics, and structure. Return ONLY a JSON array.`;
    try {
      raw = await callOnce(retry, 'gpt-4o-mini');
      parsed = JSON.parse(raw);
    } catch {
      parsed = [];
    }
  }

  // Accept either a top-level array, or {items: [...]}, or {questions: [...]}
  const arr =
    Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.items)
      ? parsed.items
      : Array.isArray(parsed?.questions)
      ? parsed.questions
      : [];

  const normalized = normalizeQuestions(arr);

  // Filter to allowed types
  const filtered = normalized.filter((q) => allowedTypes.includes(q.type as AllowedType));

  // Enforce exact count (with dedupe + varied fillers)
  if (enforce) {
    return ensureExactCount(filtered, count, allowedTypes, topic);
  }

  // Or just slice + reindex
  return filtered.slice(0, count).map((q, i) => ({ ...q, id: i + 1 }));
}
