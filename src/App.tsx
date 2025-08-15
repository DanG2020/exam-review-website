
import React, { useState, useEffect, useRef } from 'react';
import { Timer, Send, HelpCircle, Check, Lock } from 'lucide-react';
import { Switch } from '@headlessui/react';
import emailjs from '@emailjs/browser';
import type { QuizQuestion } from './types';
import { generateQuizQuestions } from './gpt';
import { buildPrompt } from './promptBuilder';


function generateQuestions(
  totalQuestions: number,
  types: { multipleChoice: boolean; written: boolean; matching: boolean },
  quizTopic: string
): QuizQuestion[] {
  const enabledTypes = [
    types.multipleChoice && 'multiple-choice',
    types.written && 'written',
    types.matching && 'matching'
  ].filter(Boolean) as QuizQuestion['type'][];

  if (enabledTypes.length === 0) {
    enabledTypes.push('multiple-choice');
  }
  
  const questions: QuizQuestion[] = [];


  const remaining = totalQuestions - questions.length;
  const questionsPerType = Math.floor(remaining / enabledTypes.length);
  const leftovers = remaining % enabledTypes.length;

  
//enabledTypes.forEach((type, index) => {
 //   const count = index < leftovers ? questionsPerType + 1 : questionsPerType;
 //   for (let i = 0; i < count; i++) {
  //    questions.push(generateQuestionByType(questions.length + 1, type, quizTopic));
   // }
  //});

  // Optional shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
    questions[i].id = i + 1;
    questions[j].id = j + 1;
  }

  return questions;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'setup' | 'instructions' | 'quiz'>('setup');
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [quizTitle, setQuizTitle] = useState('Final Exam- Requires Respondus LockDown Browser');
  const [userName, setUserName] = useState('Daniel Gonzalez');
  const [timeLimit, setTimeLimit] = useState('120');
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState('1');
  const [quizTopic, setQuizTopic] = useState('cp363');

  const [questionsPerPage, setQuestionsPerPage] = useState('33');
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
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const quizContentRef = useRef<HTMLDivElement>(null); // 👈 Add here


  const [includeMultipleChoice, setIncludeMultipleChoice] = useState(true);
  const [includeWrittenAnswers, setIncludeWrittenAnswers] = useState(true);
  const [includeMatching, setIncludeMatching] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);

  const [customPrompt, setCustomPrompt] = useState('');

  

  useEffect(() => {
    const container = quizContentRef.current;
    if (!container) return;
  
    const handleScroll = () => {
      setScrollTop(container.scrollTop);
    };
  
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [currentPage]);
  

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    
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
    let timer: ReturnType<typeof setTimeout>;

    
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

  const quizTopics = [
    { id: 'computer-science', name: 'Computer Science' },
    { id: 'arm-processing', name: 'ARM Processing' },
    { id: 'intro-perception-psychology', name: 'Intro to Perception Psychology' },
    { id: 'managerial-accounting', name: 'Managerial Accounting' },
    { id: 'cp363', name: 'CP363: Database Systems' }, // 👈 Add this
  ];

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

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQuizStarted(true);

    // 1) decide how many to generate (use your sliders)
    const totalQuestions = parseInt(questionsPerPage) * parseInt(numberOfPages);

    // 2) decide allowed types from toggles
    const allowedTypes = [
      includeMultipleChoice && 'multiple-choice',
      includeWrittenAnswers && 'written',
      includeMatching && 'matching',
    ].filter(Boolean) as Array<'multiple-choice' | 'written' | 'matching'>;

    // 3) build the prompt (topic + count + allowed types + user reference)
    const prompt = buildPrompt({
      topic: quizTopic === 'cp363'
        ? 'Database Systems (SQL, normalization, transactions, indexing)'
        : 'Java (core: OOP, collections, exceptions, generics, JVM, threads)',
      count: totalQuestions,
      allowedTypes,
      reference: customPrompt, // user-pasted notes / practice problems
    });

    // 4) call GPT with the *built* prompt
    const generated = await generateQuizQuestions(prompt, {
      count: totalQuestions,
      allowedTypes,
    });

    // 5) safety: enforce types & count, then re-index IDs 1..N
    const filtered = generated
      .filter(q => allowedTypes.includes(q.type as any))
      .slice(0, totalQuestions)
      .map((q, i) => ({ ...q, id: i + 1 }));

    setQuestions(filtered);
    setCurrentPage('instructions');
  };

  const handleBeginQuiz = async () => {
    if (requirePassword && quizPassword) {
      try {
        await emailjs.send(
          'Lockdownrecreation',
          'template_y2t9ruc',
          {
            message: quizPassword,
          },
          'BR3ar8OdLV04yWZBF'
        );
        setIsPasswordValid(true);
      } catch (error) {
        console.error('Error sending password:', error);
        return;
      }
    }
    
    setCurrentPage('quiz');
    setTimeLeft(parseInt(timeLimit) * 60);
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const handleWrittenAnswer = (questionId: number, answerIndex: number, value: string) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setWrittenAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [answerIndex]: value
      }
    }));
  };

  const handleMatchingAnswer = (questionId: number, leftIndex: number, rightIndex: number) => {
    setAnsweredQuestions(prev => new Set([...prev, questionId]));
    setMatchingAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [leftIndex]: rightIndex
      }
    }));
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

  const scrollToQuestion = (questionNumber: number) => {
    questionRefs.current[questionNumber - 1]?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

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
        // ✅ declare variables BEFORE returning JSX
        const left = (question as any).leftItems ?? [];
        const right = (question as any).rightItems ?? [];

        return (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {left.map((item: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-3 border border-gray-200 rounded-md"
                >
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={matchingAnswers[question.id]?.[index] ?? ''}
                    onChange={(e) =>
                      handleMatchingAnswer(question.id, index, Number(e.target.value))
                    }
                  >
                    <option value="">Select a match...</option>
                    {right.map((_, optIndex: number) => (
                      <option key={optIndex} value={optIndex}>
                        {optIndex + 1}
                      </option>
                    ))}
                  </select>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {right.map((item: string, index: number) => (
                <div key={index} className="p-3 border border-gray-200 rounded-md">
                  <span>
                    {index + 1}. {item}
                  </span>
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
                  onChange={(e) =>
                    setWrittenAnswers(prev => ({
                      ...prev,
                      [question.id]: {
                        ...prev[question.id],
                        0: e.target.value
                      }
                    }))
                  }
                  className="w-[160px] h-[32px] px-3 py-1 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="px-12 text-m text-gray-600 ml-[4px]">Answer</span>
              </div>
            );
    }
    
  };

  if (currentPage === 'setup') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        
        <form onSubmit={handleStartQuiz} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Quiz Setup</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="quizTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Title
              </label>
              <input
                type="text"
                id="quizTitle"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter quiz title"
              />
            </div>

            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label htmlFor="quizTopic" className="block text-sm font-medium text-gray-700 mb-1">
                Quiz Topic
              </label>
              <select
                id="quizTopic"
                value={quizTopic}
                onChange={(e) => setQuizTopic(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {quizTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="questionsPerPage" className="block text-sm font-medium text-gray-700 mb-1">
                Questions Per Page
              </label>
              <input
                type="number"
                id="questionsPerPage"
                value={questionsPerPage}
                onChange={(e) => setQuestionsPerPage(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label htmlFor="numberOfPages" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Pages
              </label>
              <input
                type="number"
                id="numberOfPages"
                value={numberOfPages}
                onChange={(e) => setNumberOfPages(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
            </div>

            <div>
              <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                id="timeLimit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter time limit in minutes"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-gray-200">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Require Password</span>
                <span className="text-sm text-gray-500">Students must enter a password to access the quiz</span>
              </div>
              <Switch
                checked={requirePassword}
                onChange={setRequirePassword}
                className={`${
                  requirePassword ? 'bg-blue-600' : 'bg-gray-200'
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

            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium text-gray-700">Question Types</h3>
              
              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Multiple Choice</span>
                  <span className="text-sm text-gray-500">Questions with predefined options</span>
                </div>
                <Switch
                  checked={includeMultipleChoice}
                  onChange={setIncludeMultipleChoice}
                  className={`${
                    includeMultipleChoice ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      includeMultipleChoice ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Written Answers</span>
                  <span className="text-sm text-gray-500">Free-form text responses</span>
                </div>
                <Switch
                  checked={includeWrittenAnswers}
                  onChange={setIncludeWrittenAnswers}
                  className={`${
                    includeWrittenAnswers ? 'bg-blue-600' : 'bg-gray-200'
                  } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                >
                  <span
                    className={`${
                      includeWrittenAnswers ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                  />
                </Switch>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">Matching</span>
                  <span className="text-sm text-gray-500">Match items from two columns</span>
                </div>
                <Switch
                  checked={includeMatching}
                  onChange={setIncludeMatching}
                  className={`${
                    includeMatching ? 'bg-blue-600' : 'bg-gray-200'
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
            
            <div>
              <label htmlFor="customPrompt" className="block text-sm font-medium text-gray-700 mb-1">
                Paste Sample Questions or Notes
              </label>
              <textarea
                id="customPrompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter sample content like notes, textbook summaries, or sample questions..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Run
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (currentPage === 'instructions') {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Sticky Brightspace Header */}
        <div className="sticky top-0 z-50 bg-white">
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
          <p className="text-[16x] font-semibold text-gray-600 mt-6 mb-4">A password is required to start your attempt.</p>
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
            .map((question, index) => {
              const absoluteIndex = (currentQuizPage - 1) * parseInt(questionsPerPage) + index;
              return (
                <div
                  key={question.id}
                  ref={(el) => (questionRefs.current[absoluteIndex] = el)}
                  className="mt-8 mb-12"
                  >
                  <h2 className="text-xl font-semibold mb-3">
                    <span className="mr-2">Question {question.id}</span>
                    <span className="text-gray-600 font-normal">
                      ({question.points} point{question.points > 1 ? 's' : ''})
                    </span>
                  </h2>
                  <p className="text-[1.25rem] leading-7 mb-6 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: question.text }} />
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
              onClick={() => {
                window.close();
              }}
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
      <div className="fixed top-[184px] right-[120px] w-[8px] h-[calc(100vh-184px)] z-50">
        <div
          style={{
            height: `${(quizContentRef.current?.clientHeight || 1) / (quizContentRef.current?.scrollHeight || 1) * 100}%`,
            top: `${(scrollTop / (quizContentRef.current?.scrollHeight || 1)) * 100}%`,
            position: 'absolute',
            left: 0,
            right: 0,
          }}
          className="bg-gray-400 rounded-full w-full transition-all"
        />
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
    </div>
  );
}

export default App;