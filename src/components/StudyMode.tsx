import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Card } from "../types";
import { useDeck } from "../hooks/useDeck";
import { useHistory } from "../hooks/useHistory";
import Flashcard from "./Flashcard";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function StudyMode() {
  const { cards } = useDeck();
  const { addRecord, markSessionStart } = useHistory();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [done, setDone] = useState(false);

  const startSession = useCallback(() => {
    markSessionStart();
    setDeck(shuffle(cards));
    setIndex(0);
    setFlipped(false);
    setCorrect(0);
    setIncorrect(0);
    setDone(false);
  }, [cards, markSessionStart]);

  useEffect(() => {
    startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <p className="text-2xl font-semibold text-gray-600">No cards in your deck yet.</p>
        <p className="text-gray-500">Add some cards to get started!</p>
        <button
          onClick={() => navigate("/manage")}
          className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
        >
          Manage Cards
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <h2 className="text-3xl font-bold text-gray-800">Session Complete!</h2>
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-green-500">{correct}</span>
            <span className="text-sm text-gray-500 mt-1">Correct</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-4xl font-bold text-red-500">{incorrect}</span>
            <span className="text-sm text-gray-500 mt-1">Incorrect</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={startSession}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors"
          >
            Restart
          </button>
          <button
            onClick={() => navigate("/review")}
            className="px-6 py-2 bg-amber-500 text-white rounded-full font-medium hover:bg-amber-600 transition-colors"
          >
            Review Incorrect
          </button>
        </div>
      </div>
    );
  }

  const currentCard = deck[index];
  if (!currentCard) return null;

  function handleAssess(result: "correct" | "incorrect") {
    addRecord(currentCard.id, result);
    if (result === "correct") setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);

    if (index + 1 >= deck.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 max-w-lg mx-auto">
      <p className="text-sm text-gray-500 font-medium">
        Card {index + 1} of {deck.length}
      </p>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-500 h-2 rounded-full transition-all"
          style={{ width: `${((index) / deck.length) * 100}%` }}
        />
      </div>

      <Flashcard
        spanish={currentCard.spanish}
        english={currentCard.english}
        flipped={flipped}
        onFlip={() => setFlipped((f) => !f)}
      />

      {flipped && (
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => handleAssess("correct")}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-semibold hover:bg-green-600 transition-colors shadow"
          >
            Got it right ✓
          </button>
          <button
            onClick={() => handleAssess("incorrect")}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-colors shadow"
          >
            Got it wrong ✗
          </button>
        </div>
      )}
    </div>
  );
}
