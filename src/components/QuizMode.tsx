import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Card } from "../types";
import { useDeck } from "../hooks/useDeck";
import { useHistory } from "../hooks/useHistory";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizQuestion {
  card: Card;
  options: string[];
  correctAnswer: string;
}

type QuizPhase = "settings" | "quiz" | "results";

interface QuizSettings {
  numQuestions: number;
  order: "random" | "sequential";
}

export default function QuizMode() {
  const { cards } = useDeck();
  const { addRecord } = useHistory();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<QuizPhase>("settings");
  const [settings, setSettings] = useState<QuizSettings>({
    numQuestions: cards.length,
    order: "random",
  });

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [showNext, setShowNext] = useState(false);

  if (cards.length < 4) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <p className="text-2xl font-semibold text-gray-600">Not enough cards for Quiz Mode.</p>
        <p className="text-gray-500">
          You need at least 4 cards to start a quiz. You currently have {cards.length}.
        </p>
        <button
          onClick={() => navigate("/manage")}
          className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
        >
          Add More Cards
        </button>
      </div>
    );
  }

  function buildQuestions(s: QuizSettings): QuizQuestion[] {
    let ordered = s.order === "random" ? shuffle(cards) : [...cards];
    ordered = ordered.slice(0, s.numQuestions);

    return ordered.map((card) => {
      const others = cards.filter((c) => c.id !== card.id);
      const wrongOptions = shuffle(others)
        .slice(0, 3)
        .map((c) => c.english);
      const options = shuffle([card.english, ...wrongOptions]);
      return { card, options, correctAnswer: card.english };
    });
  }

  function handleStart() {
    const qs = buildQuestions(settings);
    setQuestions(qs);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setShowNext(false);
    setPhase("quiz");
  }

  function handleAnswer(answer: string) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    setShowNext(true);
    const q = questions[currentIndex];
    const isCorrect = answer === q.correctAnswer;
    addRecord(q.card.id, isCorrect ? "correct" : "incorrect");
    if (isCorrect) setCorrectCount((c) => c + 1);
    else setIncorrectCount((c) => c + 1);
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setPhase("results");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowNext(false);
    }
  }

  function handleRetake() {
    handleStart();
  }

  if (phase === "settings") {
    return (
      <div className="max-w-md mx-auto px-4 py-10 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center">Quiz Settings</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
          <div>
            <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Questions
            </label>
            <input
              id="numQuestions"
              type="number"
              min={1}
              max={cards.length}
              value={settings.numQuestions}
              onChange={(e) => {
                const val = Math.min(cards.length, Math.max(1, parseInt(e.target.value) || 1));
                setSettings((s) => ({ ...s, numQuestions: val }));
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <p className="text-xs text-gray-400 mt-1">Max: {cards.length}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Card Order</label>
            <div className="flex gap-3">
              {(["random", "sequential"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSettings((s) => ({ ...s, order: opt }))}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    settings.order === opt
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-base"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const total = correctCount + incorrectCount;
    const pct = total > 0 ? ((correctCount / total) * 100).toFixed(1) : "0.0";
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <h2 className="text-3xl font-bold text-gray-800">Quiz Results</h2>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 flex flex-col items-center gap-4 w-full max-w-sm">
          <p className="text-5xl font-bold text-indigo-600">{pct}%</p>
          <div className="flex gap-8 mt-2">
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-green-500">{correctCount}</span>
              <span className="text-xs text-gray-500 mt-1">Correct</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-red-500">{incorrectCount}</span>
              <span className="text-xs text-gray-500 mt-1">Incorrect</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-gray-700">{total}</span>
              <span className="text-xs text-gray-500 mt-1">Total</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={handleRetake}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
          >
            Retake Quiz
          </button>
          <button
            onClick={() => navigate("/study")}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Study
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  if (!question) return null;

  function getButtonClass(option: string): string {
    if (selectedAnswer === null) {
      return "w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left min-h-[44px]";
    }
    if (option === question.correctAnswer) {
      return "w-full py-3 px-4 bg-green-100 border-2 border-green-500 rounded-xl text-sm font-medium text-green-800 text-left min-h-[44px]";
    }
    if (option === selectedAnswer) {
      return "w-full py-3 px-4 bg-red-100 border-2 border-red-500 rounded-xl text-sm font-medium text-red-800 text-left min-h-[44px]";
    }
    return "w-full py-3 px-4 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-400 text-left min-h-[44px] opacity-60";
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">
          Question {currentIndex + 1} of {questions.length}
        </p>
        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
          Quiz Mode
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${(currentIndex / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-indigo-700 rounded-2xl p-6 text-center">
        <p className="text-xs text-indigo-200 uppercase tracking-widest mb-2">What does this mean in English?</p>
        <p className="text-3xl font-bold text-white">{question.card.spanish}</p>
      </div>

      <div className="flex flex-col gap-3">
        {question.options.map((option) => (
          <button
            key={option}
            onClick={() => handleAnswer(option)}
            disabled={selectedAnswer !== null}
            className={getButtonClass(option)}
          >
            {option}
          </button>
        ))}
      </div>

      {showNext && (
        <button
          onClick={handleNext}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          {currentIndex + 1 >= questions.length ? "See Results" : "Next Question"}
        </button>
      )}
    </div>
  );
}
