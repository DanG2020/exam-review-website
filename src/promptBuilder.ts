type Allowed = 'multiple-choice' | 'written' | 'matching';
export function buildPrompt(opts: {
  topic: string;
  count: number;
  allowedTypes: Allowed[];
  reference?: string;
}) {
  const ref = (opts.reference || '').trim();
  return `
Make EXACTLY ${opts.count} questions as JSON only.
Allowed types: ${opts.allowedTypes.join(', ')}.
Each object must match one of:
- multiple-choice: { id:number, type:"multiple-choice", text:string, points:number, options:string[] }
- written:         { id:number, type:"written",         text:string, points:number, answerBoxes:number }
- matching:        { id:number, type:"matching",        text:string, points:number, leftItems:string[], rightItems:string[] }
No answers, no explanations, no markdown — only a JSON array.
Topic: ${opts.topic}.
Use the material below as reference (don’t copy verbatim).
---
${ref || 'None'}
---`.trim();
}