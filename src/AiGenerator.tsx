import { useState } from 'react';
import { generateQuizQuestions } from './gpt';
import type { QuizQuestion } from './types';


function AiGenerator() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const response = await generateQuizQuestions(input);
    setOutput(response);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">AI Quiz Generator</h1>
      <textarea
        className="w-full p-3 border rounded mb-4"
        rows={8}
        placeholder="Paste course notes or lecture content here..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Generating...' : 'Generate Questions'}
      </button>

      <pre className="whitespace-pre-wrap bg-gray-100 p-4 mt-6 rounded">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
}

export default AiGenerator;