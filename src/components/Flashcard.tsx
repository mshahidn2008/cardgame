import { useEffect, useRef } from "react";

interface FlashcardProps {
  spanish: string;
  english: string;
  flipped: boolean;
  onFlip: () => void;
}

export default function Flashcard({ spanish, english, flipped, onFlip }: FlashcardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = flipped ? "rotateY(180deg)" : "rotateY(0deg)";
    }
  }, [flipped]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Card container with perspective */}
      <div
        className="w-full max-w-md h-56 cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={onFlip}
      >
        <div
          ref={cardRef}
          className="relative w-full h-full"
          style={{
            transformStyle: "preserve-3d",
            transition: "transform 0.5s ease",
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl shadow-lg bg-white border-2 border-indigo-200 px-6"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs uppercase tracking-widest text-indigo-400 mb-2">Spanish</p>
            <p className="text-3xl font-bold text-gray-800 text-center">{spanish}</p>
            <p className="mt-4 text-sm text-gray-400">Click to flip</p>
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl shadow-lg bg-indigo-700 border-2 border-indigo-500 px-6"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-xs uppercase tracking-widest text-indigo-200 mb-2">English</p>
            <p className="text-3xl font-bold text-white text-center">{english}</p>
          </div>
        </div>
      </div>

      {/* Flip button */}
      <button
        onClick={onFlip}
        className="px-6 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium hover:bg-indigo-200 transition-colors"
      >
        {flipped ? "Show Spanish" : "Flip Card"}
      </button>
    </div>
  );
}
