
import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, X, Loader2, Settings, HelpCircle } from 'lucide-react';


import { Switch } from '@headlessui/react';
import emailjs from '@emailjs/browser';
import type { QuizQuestion } from './types';
import { generateQuizQuestions } from './gpt';
import { buildPrompt } from './promptBuilder';

import DOMPurify from 'dompurify';



function HelperCoach({
  page,
  onClose
}: {
  page: 'setup' | 'instructions' | 'quiz';
  onClose: () => void;
}) {
  const content: Record<typeof page, { title: string; steps: string[] }> = {
    setup: {
      title: 'Quick Start',
      steps: [
        'Choose your Quiz Topic.',
        'Toggle question types (MC / Written / Matching).',
        'Set Questions Per Page × Number of Pages.',
        'Optional: paste notes/sample questions.',
        'Click “Run” to build the quiz.'
      ]
    },
    instructions: {
      title: 'Before You Start',
      steps: [
        'If enabled, enter the quiz password.',
        'Review the time limit and details.',
        'Click “Start Quiz”.'
      ]
    },
    quiz: {
      title: 'During the Quiz',
      steps: [
        'Use the left sidebar to jump to questions.',
        'Answer, then use Next/Previous Page.',
        'Click “Submit Quiz” for score & explanations.'
      ]
    }
  };

  const c = content[page];

  // --- DRAG STATE ---
  const boxRef = React.useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = React.useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);

  // Bigger by ~1.3–1.5× (wider + roomier paddings)
  const BOX_WIDTH = 360; // px

  // Initial position: bottom-left-ish, or last saved
  const [pos, setPos] = React.useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('coachPos');
      if (saved) return JSON.parse(saved);
    } catch {}
    const left = 16;
    const top = typeof window !== 'undefined'
      ? Math.max(16, window.innerHeight - 320)
      : 100;
    return { x: left, y: top };
  });

  // Persist position
  React.useEffect(() => {
    try { localStorage.setItem('coachPos', JSON.stringify(pos)); } catch {}
  }, [pos]);

  // Clamp inside viewport on resize
  React.useEffect(() => {
    function clampToViewport() {
      const w = boxRef.current?.offsetWidth ?? BOX_WIDTH;
      const h = boxRef.current?.offsetHeight ?? 240;
      const maxX = Math.max(8, window.innerWidth - w - 8);
      const maxY = Math.max(8, window.innerHeight - h - 8);
      setPos(p => ({
        x: Math.min(Math.max(8, p.x), maxX),
        y: Math.min(Math.max(8, p.y), maxY)
      }));
    }
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  }, []);

  // Drag handlers (mouse + touch)
  function startDrag(clientX: number, clientY: number) {
    dragOffsetRef.current = { x: clientX - pos.x, y: clientY - pos.y };
    setDragging(true);
  }

  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  }
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    startDrag(t.clientX, t.clientY);
  }

  React.useEffect(() => {
    function moveTo(clientX: number, clientY: number) {
      const w = boxRef.current?.offsetWidth ?? BOX_WIDTH;
      const h = boxRef.current?.offsetHeight ?? 240;
      const maxX = window.innerWidth - w - 8;
      const maxY = window.innerHeight - h - 8;

      let nx = clientX - dragOffsetRef.current.x;
      let ny = clientY - dragOffsetRef.current.y;

      // Clamp
      nx = Math.max(8, Math.min(nx, maxX));
      ny = Math.max(8, Math.min(ny, maxY));

      setPos({ x: nx, y: ny });
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;
      e.preventDefault();
      moveTo(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      if (!dragging) return;
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      moveTo(t.clientX, t.clientY);
    }
    function endDrag() {
      if (dragging) setDragging(false);
    }

    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup', endDrag);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', endDrag);
    return () => {
      window.removeEventListener('mousemove', onMouseMove as any);
      window.removeEventListener('mouseup', endDrag as any);
      window.removeEventListener('touchmove', onTouchMove as any);
      window.removeEventListener('touchend', endDrag as any);
    };
  }, [dragging]);

  return (
    <div
      ref={boxRef}
      className="fixed z-[70] select-none"
      style={{ left: pos.x, top: pos.y, width: BOX_WIDTH }}
    >
      <div className="bg-white border shadow-2xl rounded-2xl overflow-hidden">
        {/* Draggable header */}
        <div
          className={`flex items-center justify-between px-4 py-3 border-b cursor-move ${dragging ? 'bg-gray-50' : ''}`}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          title="Drag me"
        >
          <div className="font-semibold text-base">{c.title}</div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            title="Don’t show again"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bigger body */}
        <div className="p-4 text-[0.98rem] space-y-3">
          {c.steps.map((s, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-[2px] min-w-[20px] h-[20px] rounded-full border flex items-center justify-center text-[11px]">
                {i + 1}
              </div>
              <div>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function App() {
  const [currentPage, setCurrentPage] = useState<'setup' | 'instructions' | 'quiz'>('setup');
  const [quizTitle, setQuizTitle] = useState('Final Exam- Requires Respondus LockDown Browser');
  const [userName, setUserName] = useState('Daniel Gonzalez');
  const [timeLimit, setTimeLimit] = useState('120');
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizTopic, setQuizTopic] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [questionsPerPage, setQuestionsPerPage] = useState('5');
  const [numberOfPages, setNumberOfPages] = useState('1');
  const [currentQuizPage, setCurrentQuizPage] = useState(1);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [writtenAnswers, setWrittenAnswers] = useState<Record<number, string[]>>({});
  const [matchingAnswers, setMatchingAnswers] = useState<Record<number, number[]>>({});
  const [chatMessage, setChatMessage] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [requirePassword, setRequirePassword] = useState(false);
  const [quizPassword, setQuizPassword] = useState('');
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const quizContentRef = useRef<HTMLDivElement>(null); // 👈 Add here


  const [includeMultipleChoice, setIncludeMultipleChoice] = useState(true);
  const [includeWrittenAnswers, setIncludeWrittenAnswers] = useState(true);
  const [includeMatching, setIncludeMatching] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    correct: number;
    score: number; // percent
    wrong: Array<{
      question: QuizQuestion;
      yourAnswer: any;
      correctAnswer: any;
      explanation?: string;
      autoGraded: boolean; // false for written
    }>;
  }>({
    total: 0,
    correct: 0,
    score: 0,
    wrong: [],
  });

  const [customPrompt, setCustomPrompt] = useState('');

  // ----- Setup page helpers -----
  const MAX_REFERENCE_CHARS = 1400;
  const referenceCount = customPrompt.length;
  const referencePct = Math.min(100, Math.round((referenceCount / MAX_REFERENCE_CHARS) * 100));

  const sampleChips: Array<{ label: string; text: string }> = [
    {
      label: 'Syllabus outline',
      text:
        'Syllabus outline:\n- Week 1: Intro & terminology\n- Week 2: Core concepts\n- Week 3: Problem types\n- Week 4: Case studies',
    },
    {
      label: 'Topics list',
      text:
        'Topics:\n- Relational algebra\n- SQL joins & subqueries\n- Normalization\n- Indexing & query plans',
    },
    {
      label: 'Glossary pairs',
      text:
        'Glossary (Term — Definition):\n- Primary key — Unique row identifier\n- Foreign key — References another table\n- Index — Speeds up lookups',
    },
    {
      label: 'Sample questions',
      text:
        'Sample questions:\n1) Define normalization and provide a quick example.\n2) When would you denormalize? Why?\n3) Compare nested-loop vs hash join.',
    },
  ];

  function addChipText(t: string) {
    setCustomPrompt((prev) => (prev ? prev + '\n\n' + t : t));
  }

  type SubmitAction = 'grade' | 'close-tab';

  const [enableHelper, setEnableHelper] = useState<boolean>(() => {
    try { return localStorage.getItem('enableHelper') !== '0'; } catch { return true; }
  });

  const [submitAction, setSubmitAction] = useState<SubmitAction>(() => {
    try { return (localStorage.getItem('submitAction') as SubmitAction) || 'grade'; } catch { return 'grade'; }
  });

  // When user picks settings, persist them
  useEffect(() => {
    try { localStorage.setItem('enableHelper', enableHelper ? '1' : '0'); } catch {}
    if (!enableHelper) setShowCoach(false);
  }, [enableHelper]);

  useEffect(() => {
    try { localStorage.setItem('submitAction', submitAction); } catch {}
  }, [submitAction]);

  // Replace your old dismissCoach with open/dismiss that respect enableHelper
  const openCoach = () => {
    if (!enableHelper) return;
    setShowCoach(true);
    try { localStorage.removeItem('coachSeen'); } catch {}
  };
  const dismissCoach = () => {
    setShowCoach(false);
    try { localStorage.setItem('coachSeen', '1'); } catch {}
  };

  // Show a super-simple screen if we can’t close the tab (browser restriction)
  const [hardSubmitted, setHardSubmitted] = useState(false);


  const [showCoach, setShowCoach] = useState<boolean>(() => {
    try {
      const helperOn = localStorage.getItem('enableHelper') !== '0';
      const seen = !!localStorage.getItem('coachSeen');
      return helperOn && !seen;
    } catch { return true; }
  });

  useEffect(() => {
    try {
      const seen = !!localStorage.getItem('coachSeen');
      setShowCoach(enableHelper && !seen);
    } catch {
      setShowCoach(enableHelper);
    }
  }, [currentPage, enableHelper]);


  useEffect(() => {
    const container = quizContentRef.current;
    if (!container) return;
    const handleScroll = () => setScrollTop(container.scrollTop);
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    
    if (currentPage === 'quiz' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [currentPage, timeLeft]);

  // Add new useEffect for chat cooldown
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    
    if (cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [cooldownTime]);

  useEffect(() => {
    if (currentPage === 'quiz') {
      document.body.classList.add('quiz-active');
      document.body.classList.add('hide-scrollbar'); // Add this line
    } else {
      document.body.classList.remove('quiz-active');
      document.body.classList.remove('hide-scrollbar'); // Add this line
    }
  }, [currentPage]);


  //const totalQuestions = parseInt(questionsPerPage) * parseInt(numberOfPages);
/*
  useEffect(() => {
    if (isQuizStarted) {
      const totalQuestions = parseInt(questionsPerPage) * parseInt(numberOfPages);
      const newQuestions = generateQuestions(
        quizTopic === 'managerial-accounting' ? 45 : totalQuestions,
        {
          multipleChoice: includeMultipleChoice,
          written: includeWrittenAnswers,
          matching: includeMatching
        },
        quizTopic
      );
      setQuestions(newQuestions);
      questionRefs.current = questionRefs.current.slice(0, quizTopic === 'managerial-accounting' ? 45 : totalQuestions);
    }
  }, [
    isQuizStarted,
    quizTopic,
    questionsPerPage,
    numberOfPages,
    includeMultipleChoice,
    includeWrittenAnswers,
    includeMatching
  ]);
  
*/
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);   // 0..1
  const [genEtaMs, setGenEtaMs] = useState(0);
  const rafRef = useRef<number | null>(null);
  const genStartRef = useRef<number>(0);

  // simple ETA model: base + per-question, clamped
  function estimateGenerationMs(count: number) {
    const base = 1500;      // overhead
    const perQ = 450;       // ~0.45s per question (tweak anytime)
    return Math.min(base + perQ * count, 45000); // cap at 45s
  }
  function fmtEta(ms: number) {
    return `${Math.max(0, Math.ceil(ms / 1000))}s`;
  }

  // cleanup rAF if component unmounts
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);



  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return; // guard double-clicks
    setIsGenerating(true);
    setGenProgress(0);

    // exact total = Questions Per Page × Number of Pages
    const totalQuestions = parseInt(questionsPerPage, 10) * parseInt(numberOfPages, 10);

    // allowed types from toggles
    const allowedTypes = [
      includeMultipleChoice && 'multiple-choice',
      includeWrittenAnswers && 'written',
      includeMatching && 'matching',
    ].filter(Boolean) as Array<'multiple-choice' | 'written' | 'matching'>;

    const topicLabel = (quizTopic.trim() || 'this subject');

    // ---- start progress animation
    const eta = estimateGenerationMs(totalQuestions);
    setGenEtaMs(eta);
    genStartRef.current = performance.now();
    const tick = () => {
      const elapsed = performance.now() - genStartRef.current;
      // Animate to 90% by ETA; final 10% completes when network returns
      const pct = Math.min(0.9, elapsed / eta);
      setGenProgress(pct);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    // ----

    const prompt = buildPrompt({
      topic: topicLabel,
      count: totalQuestions,
      allowedTypes,
      reference: customPrompt,
    });

    try {
      const generated = await generateQuizQuestions(prompt, {
        count: totalQuestions,
        allowedTypes,
        topic: topicLabel,
        enforceExactCount: true,
      });

      setQuestions(generated);
      setCurrentPage('instructions');

    } catch (e: any) {
      console.error(e);
      alert(`Quiz generation failed:\n${e?.message ?? e}`);
      // OPTIONAL: don’t fall back to filler; keep the user on setup page
      return;

    } finally {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setGenProgress(1);
      setTimeout(() => {
        setIsGenerating(false);
        setGenProgress(0);
      }, 400);
    }

  };



  const handleBeginQuiz = async () => {
    if (requirePassword) {
      if (!quizPassword.trim()) return; // guard

      try {
        await emailjs.send(
          'Lockdownrecreation',
          'template_y2t9ruc',
          { message: quizPassword },
          'BR3ar8OdLV04yWZBF'
        );
        // success: continue to quiz
      } catch (err: unknown) {
        console.error('Error sending password:', err);
        return; // bail if email send fails
      }
    }

    setCurrentPage('quiz');
    setTimeLeft(parseInt(timeLimit, 10) * 60);
  };


  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleWrittenAnswer = (questionId: number, answerIndex: number, value: string) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setWrittenAnswers(prev => {
      const next = { ...prev };
      const arr = (next[questionId] ?? []).slice();
      arr[answerIndex] = value;
      next[questionId] = arr;
      return next;
    });
  };

  const handleMatchingAnswer = (questionId: number, leftIndex: number, raw: string) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setMatchingAnswers(prev => {
      const next = { ...prev };
      const arr = (next[questionId] ?? []).slice();

      if (raw === '') {
        delete arr[leftIndex];        // clear selection for this row
      } else {
        const rightIndex = parseInt(raw, 10);
        if (!Number.isNaN(rightIndex)) arr[leftIndex] = rightIndex;
      }

      next[questionId] = arr;
      return next;
    });
  };


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      try {
        await emailjs.send(
          'Lockdownrecreation',
          'template_y2t9ruc',
          {
            message: chatMessage,
          },
          'BR3ar8OdLV04yWZBF'
        );
        setChatMessage('');
        setCooldownTime(30);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const scrollToQuestion = (id: number) => {
    const el = questionRefs.current[id];
    const container = quizContentRef.current;
    if (!el || !container) return;
    container.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' });
  };


  function arraysEqual(a: any[] = [], b: any[] = []) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  function handleSubmit() {
    if (submitAction === 'grade') {
      handleSubmitQuiz();
    } else {
      // Try to close the tab
      // This usually only works if this tab was opened by window.open
      try { window.close(); } catch {}

      // Fallback: show a simple screen telling the user to close the tab
      setTimeout(() => {
        setHardSubmitted(true);
      }, 150);
    }
  }


  function handleSubmitQuiz() {
    const wrong: Array<{
      question: QuizQuestion;
      yourAnswer: any;
      correctAnswer: any;
      explanation?: string;
      autoGraded: boolean;
    }> = [];
    let correctCount = 0;

    for (const q of questions) {
      if (q.type === 'multiple-choice') {
        const your = selectedAnswers[q.id];
        const correct = (q as any).correctIndex;
        const isCorrect = typeof correct === 'number' && your === correct;
        if (!isCorrect) {
          wrong.push({
            question: q,
            yourAnswer: typeof your === 'number' ? (q as any).options?.[your] : undefined,
            correctAnswer: typeof correct === 'number' ? (q as any).options?.[correct] : undefined,
            explanation: (q as any).explanation,
            autoGraded: true,
          });
        } else {
          correctCount++;
        }
      } else if (q.type === 'matching') {
        const your = matchingAnswers[q.id] || [];
        const correct = (q as any).correctMatches || [];
        const isCorrect = arraysEqual(your, correct);
        if (!isCorrect) {
          wrong.push({
            question: q,
            yourAnswer: your,
            correctAnswer: correct,
            explanation: (q as any).explanation,
            autoGraded: true,
          });
        } else {
          correctCount++;
        }
      } else if (q.type === 'written' || q.type === 'written-single' || q.type === 'written-dual') {
        // Don’t auto-grade written; show “needs manual review” + sample solution if provided
        const your = writtenAnswers[q.id] || [];
        wrong.push({
          question: q,
          yourAnswer: your,
          correctAnswer: (q as any).expectedAnswers,
          explanation: (q as any).explanation,
          autoGraded: false,
        });
      }
    }

    const totalAutoGradable = questions.filter(q => q.type === 'multiple-choice' || q.type === 'matching').length;
    const score = totalAutoGradable === 0 ? 0 : Math.round((correctCount / totalAutoGradable) * 100);

    setResults({
      total: questions.length,
      correct: correctCount,
      score,
      wrong,
    });
    setShowResults(true);
    setCurrentPage('quiz'); // keep page, just overlay results
  }

  const renderQuestion = (question: QuizQuestion) => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-[0rem]">
            {(question as any).options?.map?.((option: string, optIndex: number) => {

              const isSelected = selectedAnswers[question.id] === optIndex;
              return (
                <label 
                  key={optIndex} 
                  className={`answer-option flex items-center space-x-2 ${
                    isSelected ? 'selected' : ''
                  }`}
                >
                  <input 
                    type="radio" 
                    name={`answer-${question.id}`}
                    checked={isSelected}
                    onChange={() => handleAnswerSelect(question.id, optIndex)}
                    className="form-radio"
                  />
                  <span className="text-[1.18rem]">{option}</span>

                </label>
              );
            })}
          </div>
        );

      case 'written':
        return (
          <div className="space-y-4">
            {Array.from({ length: question.answerBoxes }).map((_, index) => (
              <div key={index} className="flex items-start space-x-2">
                <textarea
                  className="w-full h-32 p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500"

                  placeholder="Enter your answer here..."
                  value={writtenAnswers[question.id]?.[index] || ''}
                  onChange={(e) => handleWrittenAnswer(question.id, index, e.target.value)}
                />
                <div className="flex items-center justify-center w-8 h-8">
                  <Check className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        );

        case 'matching': {
          const left: string[]  = (question as any).leftItems  ?? [];
          const right: string[] = (question as any).rightItems ?? [];
          const selected = matchingAnswers[question.id] ?? [];

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT: picks */}
              <div className="space-y-3">
                {left.map((item: string, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 p-2 border border-gray-200 rounded-lg"
                  >
                    <span className="text-[1.05rem]">{item}</span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Match</label>
                      <select
                        className="w-32 sm:w-40 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={(selected[i] ?? '').toString()}
                        onChange={(e) => handleMatchingAnswer(question.id, i, e.target.value)}
                      >
                        <option value="">—</option>
                        {right.map((_label: string, optIndex: number) => (
                          <option key={optIndex} value={optIndex}>{optIndex + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* RIGHT: legend */}
              <div className="space-y-3">
                {right.map((item: string, idx: number) => (
                  <div key={idx} className="p-2 border border-gray-200 rounded-lg bg-gray-50 flex items-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border mr-3 text-sm">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }


      case 'written-dual':
        return (
          <div className="flex flex-col gap-4 w-full max-w-[300px]">
            <div className="flex flex-row gap-2 items-start">
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  className="w-[160px] px-2 py-1 rounded-md border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={writtenAnswers[question.id]?.[0] || ''}
                  onChange={(e) => handleWrittenAnswer(question.id, 0, e.target.value)}
                />
                <span className="text-m text-gray-800 mt-2">Answer</span>
              </div>
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  className="w-[60px] px-2 py-1 rounded-md border border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={writtenAnswers[question.id]?.[1] || ''}
                  onChange={(e) => handleWrittenAnswer(question.id, 1, e.target.value)}
                />
                <span className="text-m text-gray-800 mt-2">Units</span>
              </div>
            </div>
          </div>
        );

        case 'written-single':
          return (
            <div className="flex flex-col items-start space-y-1 mt-2">
              <input
                type="text"
                value={writtenAnswers[question.id]?.[0] || ''}
                onChange={(e) => handleWrittenAnswer(question.id, 0, e.target.value)}
                className="w-[160px] h-[32px] px-3 py-1 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="px-12 text-m text-gray-600 ml-[4px]">Answer</span>
            </div>
          );
    }
    
  };
  if (hardSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Quiz submitted</h1>
          <p className="text-gray-600 mb-6">You can now close this tab.</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Close tab
          </button>
        </div>
      </div>
    );
  }

  if (currentPage === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
        <form
          onSubmit={handleStartQuiz}
          className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur p-8"
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-800">Build a Quiz</h2>
              <p className="mt-1 text-slate-500">
                Looks nice here; the “LockDown” style stays on the instructions + exam pages.
              </p>
            </div>

            {/* Settings toolbar button (Setup page) */}
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50"
              aria-label="Open settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>


          

          {/* Basics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="quizTitle" className="block text-sm font-medium text-slate-700 mb-1">
                Quiz Title
              </label>
              <input
                type="text"
                id="quizTitle"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="quizTopic" className="block text-sm font-medium text-slate-700 mb-1">
                Quiz Topic
              </label>
              <input
                type="text"
                id="quizTopic"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                required
                autoComplete="off"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type any topic… e.g., Database Systems, Biology, Calculus, Marketing"
              />
              <p className="mt-1 text-xs text-slate-500">
                You can paste a course code or concept. The generator adapts automatically.
              </p>
            </div>
          </div>

          {/* Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <label htmlFor="questionsPerPage" className="block text-sm font-medium text-slate-700 mb-1">
                Questions Per Page
              </label>
              <input
                type="number"
                id="questionsPerPage"
                value={questionsPerPage}
                onChange={(e) => setQuestionsPerPage(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label htmlFor="numberOfPages" className="block text-sm font-medium text-slate-700 mb-1">
                Number of Pages
              </label>
              <input
                type="number"
                id="numberOfPages"
                value={numberOfPages}
                onChange={(e) => setNumberOfPages(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3"
              />
            </div>

            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-slate-700 mb-1">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter minutes"
              />
            </div>
          </div>

          {/* Password + Toggles */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-900">Require Password</div>
                  <div className="text-sm text-slate-500">Students must enter a password to access the quiz</div>
                </div>
                <Switch
                  checked={requirePassword}
                  onChange={setRequirePassword}
                  className={`${
                    requirePassword ? 'bg-blue-600' : 'bg-slate-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span className="sr-only">Require password</span>
                  <span
                    className={`${
                      requirePassword ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-medium text-slate-900 mb-3">Question Types</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Multiple Choice</div>
                    <div className="text-xs text-slate-500">Questions with predefined options</div>
                  </div>
                  <Switch
                    checked={includeMultipleChoice}
                    onChange={setIncludeMultipleChoice}
                    className={`${
                      includeMultipleChoice ? 'bg-blue-600' : 'bg-slate-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        includeMultipleChoice ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Written Answers</div>
                    <div className="text-xs text-slate-500">Free-form text responses</div>
                  </div>
                  <Switch
                    checked={includeWrittenAnswers}
                    onChange={setIncludeWrittenAnswers}
                    className={`${
                      includeWrittenAnswers ? 'bg-blue-600' : 'bg-slate-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        includeWrittenAnswers ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">Matching</div>
                    <div className="text-xs text-slate-500">Match items from two columns</div>
                  </div>
                  <Switch
                    checked={includeMatching}
                    onChange={setIncludeMatching}
                    className={`${
                      includeMatching ? 'bg-blue-600' : 'bg-slate-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                  >
                    <span
                      className={`${
                        includeMatching ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                    />
                  </Switch>
                </div>
              </div>
            </div>
          </div>

          {/* Course Material */}
          <div className="mt-6">
            <label htmlFor="customPrompt" className="block text-sm font-medium text-slate-700 mb-1">
              Course Material (optional)
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Paste anything helpful: <span className="font-medium">syllabus & learning outcomes, topic list, glossary,
              textbook summaries, grading rubric, or sample questions.</span>
            </p>

            {/* Quick insert chips */}
            <div className="flex flex-wrap gap-2 mb-3">
              {sampleChips.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => addChipText(chip.text)}
                  className="px-2.5 py-1 text-xs rounded-full border border-slate-300 hover:bg-slate-50"
                  title="Insert template"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <textarea
              id="customPrompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g., Topics: ER diagrams, relational algebra, SQL joins, normalization, indexing...\nSample Q: Explain 3NF with a small example..."
              rows={7}
              maxLength={MAX_REFERENCE_CHARS}
              className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Counter + progress */}
            <div className="mt-2 flex items-center justify-between">
              <div className="h-1.5 w-48 bg-slate-200 rounded">
                <div
                  className={`h-1.5 rounded ${referencePct > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${referencePct}%` }}
                />
              </div>
              <span className={`text-xs ${referencePct > 90 ? 'text-red-600' : 'text-slate-500'}`}>
                {referenceCount}/{MAX_REFERENCE_CHARS} characters
              </span>
            </div>
          </div>
          

          {/* Run */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={isGenerating}
              className={
                'w-full py-3 rounded-md font-medium flex items-center justify-center ' +
                (isGenerating
                  ? 'bg-slate-400 text-white cursor-wait'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700')
              }
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating…
                </>
              ) : (
                'Run'
              )}
            </button>

            {isGenerating && (
              <div className="mt-3">
                <div className="h-2 w-full bg-slate-200 rounded">
                  <div
                    className="h-2 bg-blue-600 rounded transition-[width] duration-200"
                    style={{ width: `${Math.round(genProgress * 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  Generating quiz… {Math.round(genProgress * 100)}% • ~{fmtEta(genEtaMs * (1 - genProgress))} left
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Settings Modal */}
        {settingsOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Settings</h3>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-md border px-2 py-1 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              {/* Helper Agent Toggle */}
              <div className="flex items-center justify-between py-3">
                <div className="mr-4">
                  <div className="text-sm font-medium text-gray-900">Helper Agent</div>
                  <div className="text-sm text-gray-500">Show the floating tips box on all pages.</div>
                </div>
                <Switch
                  checked={enableHelper}
                  onChange={setEnableHelper}
                  className={`${enableHelper ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span className={`${enableHelper ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </Switch>
              </div>

              {/* Submit behavior */}
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900 mb-2">On Submit</div>
                <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="submitAction"
                    checked={submitAction === 'grade'}
                    onChange={() => setSubmitAction('grade')}
                  />
                  <span className="text-sm text-gray-700">Grade the quiz (show results)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="submitAction"
                    checked={submitAction === 'close-tab'}
                    onChange={() => setSubmitAction('close-tab')}
                  />
                  <span className="text-sm text-gray-700">Close tab immediately</span>
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  Note: most browsers only let scripts close tabs they opened. If closing is blocked, a “Quiz submitted” screen will appear.
                </p>
              </div>
            </div>
          </div>
        )}

        {showCoach && <HelperCoach page="setup" onClose={dismissCoach} />}

        {enableHelper && !showCoach && (
          <button
            type="button"
            onClick={() => setShowCoach(true)}
            className="fixed bottom-4 left-4 z-[80] inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow hover:bg-gray-50"
            title="Show help"
            aria-label="Show help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        )}

      </div>
    );
  }


  if (currentPage === 'instructions') {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Sticky Brightspace Header */}
        <div className="sticky top-0 z-50 bg-white relative">

          <div className="sticky top-0 z-50 w-full bg-white">
            <img
              src="/mylsbanner.png"
              alt="Brightspace Header"
              className="w-full h-auto object-contain block"
            />
          </div>

        </div>
    
        {/* Scrollable Content BELOW the sticky header */}
        <div className="flex-1 overflow-y-auto p-8 font-lato text-[#202122] pl-[100px] pr-8">
          <h1 className="text-[40px] font-normal leading-[3.5rem] mb-14 break-words">
            Summary - {quizTitle}
          </h1>
          {/* QUIZ DETAILS */}
          <h2 className="text-[30px] font-normal mt-14 mb-4">Quiz Details</h2>
          <div className="space-y-4 text-[1.2rem] leading-[1.4rem] tracking-[.01rem]">
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Current Time</h3>
              <p>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Current User</h3>
              <p>{userName} (username: {userName.toLowerCase().replace(' ', '')})</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Time Limit</h3>
              <p>{timeLimit} minutes</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Availability</h3>
              <p>
                Available on {new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric'
                })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} until{" "}
                {new Date(Date.now() + parseInt(timeLimit) * 60000).toLocaleDateString('en-US', {
                  month: 'short',
                  day: '2-digit',
                  year: 'numeric'
                })} {new Date(Date.now() + parseInt(timeLimit) * 60000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black-500 mt-8 mb-2">Attempts</h3>
              <p>Allowed - 1, Completed - 0</p>
            </div>
          </div>

          {/* INSTRUCTIONS */}
          <h2 className="text-[30px] font-normal mt-10 mb-8">Instructions</h2>
          <p className="text-[1.20rem] leading-[1.4rem] tracking-[.01rem] mb-8">
            When the timer reaches zero, your answers will be automatically saved and submitted.
          </p>
          <p className="text-[1.20rem] leading-[1.4rem] tracking-[.01rem] mb-8">
            Click "Start Quiz" to begin Attempt 1.
          </p>

          {/* QUIZ REQUIREMENTS */}
          <h2 className="text-[30px] font-normal mb-2">Quiz Requirements</h2>

          {requirePassword ? (
            <>
              <p className="text-[16px] font-semibold text-gray-600 mt-6 mb-4">
                A password is required to start your attempt.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <label htmlFor="quizPassword" className="font-semibold text-[.95rem]">Quiz password:</label>

            
            <input
              type="text"
              id="quizPassword"
              value={quizPassword}
              onChange={(e) => setQuizPassword(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-[250px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </>
      ) : (
        <p className="text-[16px] text-gray-600 mt-6 mb-4">No password required.</p>
      )}
          <button
            onClick={handleBeginQuiz}
            disabled={requirePassword && !quizPassword}
            className={`mt-2 px-5 py-2 rounded-md font-medium text-white ${
              (!requirePassword || quizPassword)
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-blue-300 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            Start Quiz!
          </button>
        </div>            
        {showCoach && <HelperCoach page="instructions" onClose={dismissCoach} />}
        {enableHelper && !showCoach && (
          <button
            type="button"
            onClick={() => setShowCoach(true)}
            className="fixed bottom-4 left-4 z-[80] inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow hover:bg-gray-50"
            title="Show help"
            aria-label="Show help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        )}

        {/* Settings Modal (Instructions page) */}
        {settingsOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Settings</h3>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="rounded-md border px-2 py-1 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              {/* Helper Agent Toggle */}
              <div className="flex items-center justify-between py-3">
                <div className="mr-4">
                  <div className="text-sm font-medium text-gray-900">Helper Agent</div>
                  <div className="text-sm text-gray-500">Show the floating tips box on all pages.</div>
                </div>
                <Switch
                  checked={enableHelper}
                  onChange={setEnableHelper}
                  className={`${enableHelper ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span className={`${enableHelper ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </Switch>
              </div>

              {/* Submit behavior */}
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-900 mb-2">On Submit</div>
                <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="submitAction"
                    checked={submitAction === 'grade'}
                    onChange={() => setSubmitAction('grade')}
                  />
                  <span className="text-sm text-gray-700">Grade the quiz (show results)</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="submitAction"
                    checked={submitAction === 'close-tab'}
                    onChange={() => setSubmitAction('close-tab')}
                  />
                  <span className="text-sm text-gray-700">Close tab immediately</span>
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  Note: most browsers only let scripts close tabs they opened. If closing is blocked, a “Quiz submitted” screen will appear.
                </p>
              </div>
            </div>
          </div>
        )}



    </div>
    );
  }

  return (
    <div
    className="min-h-screen flex flex-col bg-white overflow-x-hidden"
    style={currentPage === 'quiz' ? { overflowY: 'scroll', scrollbarWidth: 'none' } : {}}
  >
<div className="sticky top-0 z-50 bg-white shadow-sm">
  <img 
    src="/mylsbanner.png" 
    alt="Brightspace Header" 
    className="w-full"
    style={{ objectFit: 'cover' }}
  />
  <div className="pl-[100px] pr-6 py-4">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-700 truncate max-w-[calc(100%-320px)]">
        {quizTitle}
      </h1>
      <div className="flex items-center gap-3 mr-[100px]">


        <svg width="18" height="18" viewBox="0 0 36 36" className="transform -rotate-90">
          <circle cx="18" cy="18" r="16" stroke="#E5E7EB" strokeWidth="6" fill="none" />
          <circle cx="18" cy="18" r="16" stroke="#3B82F6" strokeWidth="6" fill="none"
            strokeDasharray="100"
            strokeDashoffset={100 - (timeLeft / (parseInt(timeLimit) * 60)) * 100}
            strokeLinecap="round"
          />
        </svg>
        <div className="text-l tabular-nums text-gray-800 whitespace-nowrap">
          {new Date(timeLeft * 1000).toISOString().substr(11, 8)} <span className="ml-1">remaining</span>
        </div>
      </div>
    </div>
  </div>
</div>

  
      {/* Main layout */}
      <div className="flex pl-[100px] pr-[30px]">
        <div className="w-[235px]" />
        {/* Fixed Sidebar */}
        <div className="fixed top-[154px] left-[100px] w-[185px] h-[calc(100vh-134px)] overflow-y-auto border-r bg-white pr-3 hide-scrollbar">

          <div className="overflow-y-auto text-sm space-y-6">
            {Array.from({ length: parseInt(numberOfPages) }).map((_, pageIndex) => {
              const startIdx = pageIndex * parseInt(questionsPerPage);
              const endIdx = startIdx + parseInt(questionsPerPage);
              const pageQuestions = questions.slice(startIdx, endIdx);
              return (
                <div key={pageIndex}>
                  <div className="font-bold mb-2 text-[1rem]">Page {pageIndex + 1}:</div>
                  <div className="grid grid-cols-3  gap-y-[12px] mb-4">

                    {pageQuestions.map((question) => {
                      const isAnswered = answeredQuestions.has(question.id);
                      return (
                        <button
                          key={question.id}
                          onClick={() => scrollToQuestion(question.id)}
                          className="w-[40px] h-[64px] text-sm border border-gray-300 rounded-md flex flex-col justify-center items-center hover:bg-gray-100 transition"
                        >
                          <span className="text-[#006FBF] font-medium">{question.id}</span>
                          <span className="status">
                            {isAnswered ? <Check className="w-4 h-4 text-gray-500" /> : '--'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
  
        {/* Main Question Content */}
        <div
          ref={quizContentRef}
          className="flex-1 py-6 pr-[140px] relative hide-scrollbar overflow-y-auto h-[calc(100vh-184px)] scroll-auto"
        >
          {questions
            .slice(
              (currentQuizPage - 1) * parseInt(questionsPerPage),
              currentQuizPage * parseInt(questionsPerPage)
            )
            .map((question) => {
              const hasHTML = /<\/?[a-z][\s\S]*>/i.test(question.text ?? '');
              return (
                <div
                  key={question.id}
                  ref={(el) => (questionRefs.current[question.id] = el)}

                  className="mt-8 mb-12"
                  >
                  <h2 className="text-xl font-semibold mb-3">
                    <span className="mr-2">Question {question.id}</span>
                    <span className="text-gray-600 font-normal">
                      ({question.points} point{question.points > 1 ? 's' : ''})
                    </span>
                  </h2>
                  {hasHTML ? (
                    <div
                      className="text-[1.25rem] leading-7 mb-6"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(question.text, {
                          ALLOWED_TAGS: [
                            'b','i','em','strong','u','sub','sup','br',
                            'ul','ol','li','p','code','pre'
                          ],
                          ALLOWED_ATTR: []
                        })
                      }}
                    />
                  ) : (
                    <p className="text-[1.25rem] leading-7 mb-6 whitespace-pre-line">
                      {question.text}
                    </p>
                  )}

                  {renderQuestion(question)}
                </div>
              );
            })}
  
          {/* Bottom Controls */}
          <div className="mt-8 mb-8 flex items-center pl-[8px] space-x-4">
            <button
              onClick={() => setCurrentQuizPage(prev => Math.max(1, prev - 1))}
              disabled={currentQuizPage === 1}
              className="px-6 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Previous Page
            </button>
            <button
              onClick={() => setCurrentQuizPage(prev => Math.min(parseInt(numberOfPages), prev + 1))}
              disabled={currentQuizPage === parseInt(numberOfPages)}
              className="px-6 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Next Page
            </button>


            <button
              onClick={handleSubmit}
              className="ml-auto px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Submit Quiz
            </button>

            <span className="text-gray-600 ml-4">
              {answeredQuestions.size} of {questions.length} questions saved
            </span>
          </div>
        </div>
      </div>
  
      {/* ✅ CUSTOM SCROLLBAR goes OUTSIDE of content layout */}
      <div className="fixed top-[184px] right-[120px] w-[8px] h-[calc(100vh-184px)] z-50 pointer-events-none">
        {(() => {
          const clientH = quizContentRef.current?.clientHeight || 1;
          const scrollH = quizContentRef.current?.scrollHeight || 1;
          const thumbH = (clientH / scrollH) * 100;
          const maxScroll = Math.max(1, scrollH - clientH);
          const trackH = Math.max(0, 100 - thumbH);
          const topPct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * trackH));

          return (
            <div
              style={{ height: `${thumbH}%`, top: `${topPct}%`, position: 'absolute', left: 0, right: 0 }}
              className="bg-gray-400 rounded-full w-full transition-all"
            />
          );
        })()}
      </div>

  
      {/* Chat box */}
      <div
        className={`fixed bottom-4 right-4 transition-opacity duration-300 ${isChatVisible ? 'opacity-100' : 'opacity-0'}`}
        onMouseEnter={() => setIsChatVisible(true)}
        onMouseLeave={() => setIsChatVisible(false)}
      >
        <form onSubmit={handleSendMessage} className="bg-white/70 backdrop-blur-md rounded-lg shadow-lg p-4 w-64">
          <textarea
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            className="w-full h-24 p-2 border border-gray-300 rounded-md mb-2 resize-none"
            placeholder="Type your message..."
          />
          <div className="flex flex-col space-y-2">
            <button
              type="submit"
              disabled={cooldownTime > 0}
              className={`flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ${cooldownTime > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Send className="w-4 h-4 mr-2" />
              {cooldownTime > 0 ? `Wait ${cooldownTime}s` : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Results Panel */}
      {showResults && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-semibold">Results & Review</h2>
              <button
                onClick={() => setShowResults(false)}
                className="px-3 py-1 rounded-md border hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Auto-Gradable Score</div>
                <div className="text-2xl font-semibold">{results.score}%</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Correct (MC/Matching)</div>
                <div className="text-2xl font-semibold">{results.correct}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-500">Total Questions</div>
                <div className="text-2xl font-semibold">{results.total}</div>
              </div>
            </div>

            {results.wrong.length === 0 ? (
              <div className="p-4 border rounded-lg bg-green-50 text-green-800">
                Nice! No items to review.
              </div>
            ) : (
              <div className="space-y-6">
                {results.wrong.map((item, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">
                      Question {item.question.id} • {item.question.type}
                      {!item.autoGraded && ' • needs manual review'}
                    </div>
                    <div
                      className="text-[1.05rem] mb-3"
                      dangerouslySetInnerHTML={{ __html: item.question.text }}
                    />
                    {/* Your answer */}
                    <div className="mb-2">
                      <div className="text-sm font-medium text-gray-700">Your answer</div>
                      <pre className="p-2 bg-gray-50 border rounded-md whitespace-pre-wrap">
      {Array.isArray(item.yourAnswer) ? JSON.stringify(item.yourAnswer, null, 2) : String(item.yourAnswer ?? '—')}
                      </pre>
                    </div>
                    {/* Correct answer / sample */}
                    <div className="mb-2">
                      <div className="text-sm font-medium text-gray-700">
                        {item.autoGraded ? 'Correct answer' : 'Sample solution'}
                      </div>
                      <pre className="p-2 bg-gray-50 border rounded-md whitespace-pre-wrap">
      {Array.isArray(item.correctAnswer) ? JSON.stringify(item.correctAnswer, null, 2) : String(item.correctAnswer ?? '—')}
                      </pre>
                    </div>
                    {/* Explanation */}
                    {item.explanation && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Explanation</div>
                        <div className="p-2 bg-blue-50 border rounded-md">
                          {item.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {showCoach && <HelperCoach page="quiz" onClose={dismissCoach} />}
      {enableHelper && !showCoach && (
        <button
          type="button"
          onClick={() => setShowCoach(true)}
          className="fixed bottom-4 left-4 z-[80] inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow hover:bg-gray-50"
          title="Show help"
          aria-label="Show help"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      )}

      {/* Settings Modal (Instructions page) */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="rounded-md border px-2 py-1 hover:bg-gray-50"
              >
                Close
              </button>
            </div>

            {/* Helper Agent Toggle */}
            <div className="flex items-center justify-between py-3">
              <div className="mr-4">
                <div className="text-sm font-medium text-gray-900">Helper Agent</div>
                <div className="text-sm text-gray-500">Show the floating tips box on all pages.</div>
              </div>
              <Switch
                checked={enableHelper}
                onChange={setEnableHelper}
                className={`${enableHelper ? 'bg-blue-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              >
                <span className={`${enableHelper ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
              </Switch>
            </div>

            {/* Submit behavior */}
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-900 mb-2">On Submit</div>
              <label className="mb-2 flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-gray-50">
                <input
                  type="radio"
                  name="submitAction"
                  checked={submitAction === 'grade'}
                  onChange={() => setSubmitAction('grade')}
                />
                <span className="text-sm text-gray-700">Grade the quiz (show results)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-gray-50">
                <input
                  type="radio"
                  name="submitAction"
                  checked={submitAction === 'close-tab'}
                  onChange={() => setSubmitAction('close-tab')}
                />
                <span className="text-sm text-gray-700">Close tab immediately</span>
              </label>
              <p className="mt-2 text-xs text-gray-500">
                Note: most browsers only let scripts close tabs they opened. If closing is blocked, a “Quiz submitted” screen will appear.
              </p>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}

export default App;