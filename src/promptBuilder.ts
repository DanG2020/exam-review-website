type Allowed = 'multiple-choice' | 'written' | 'matching';

/**
 * Strong prompt that enforces:
 * - EXACT count
 * - Allowed types only
 * - Unique questions (no repeated stems/templates)
 * - (Optional) minimal answer metadata for auto-grading
 *
 * NOTE: If you *don’t* want answers, set `withAnswers: false`.
 */
export function buildPrompt(opts: {
  topic: string;
  count: number;
  allowedTypes: Allowed[];
  reference?: string;
  withAnswers?: boolean; // default true
}) {
  const ref = (opts.reference || '').trim();
  const withAnswers = opts.withAnswers !== false;

  const baseSchema = `
Make EXACTLY ${opts.count} questions as a JSON array ONLY (no markdown, no prose).
Each element MUST be one of:

- multiple-choice:
  {
    "id": number,
    "type": "multiple-choice",
    "text": string,
    "points": number,
    "options": string[]${withAnswers ? `,
    "correctIndex": number` : ''}
    ${withAnswers ? `,
    "explanation": string` : ''}
  }

- written:
  {
    "id": number,
    "type": "written",
    "text": string,
    "points": number,
    "answerBoxes": number${withAnswers ? `,
    "expectedAnswers": string[]` : ''}
    ${withAnswers ? `,
    "explanation": string` : ''}
  }

- matching:
  {
    "id": number,
    "type": "matching",
    "text": string,
    "points": number,
    "leftItems": string[],
    "rightItems": string[]${withAnswers ? `,
    "correctMatches": number[]` : ''}
    ${withAnswers ? `,
    "explanation": string` : ''}
  }
`.trim();

  const constraints = `
Rules:
- Allowed types ONLY: ${opts.allowedTypes.join(', ')}.
- Return ONLY a JSON array (no keys, no wrapper object, no markdown).
- IDs can be 1..N in order.
- All questions must be UNIQUE. Do not repeat stems, do not use the same template repeatedly.
- Vary phrasing and subtopics. Avoid template-y "Which of the following..." for every item.
- Keep points to small integers (1–3).
${withAnswers ? '- Include minimal solutions (correctIndex / correctMatches / expectedAnswers) and a 1–2 sentence explanation.' : '- DO NOT include any answers or explanations.'}
`.trim();

  const topicLine = `Topic: ${opts.topic}.`;
  const refBlock = `
Use the material below as reference (don’t copy verbatim).
---
${ref || 'None'}
---`.trim();

  return [baseSchema, constraints, topicLine, refBlock].join('\n\n');
}
