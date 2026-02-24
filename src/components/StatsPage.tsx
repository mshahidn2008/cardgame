import { useMemo, useState } from "react";
import { useDeck } from "../hooks/useDeck";
import { useHistory } from "../hooks/useHistory";

export default function StatsPage() {
  const { cards } = useDeck();
  const { history, clearHistory } = useHistory();
  const [confirmClear, setConfirmClear] = useState(false);

  const stats = useMemo(() => {
    const total = history.length;
    const totalCorrect = history.filter((r) => r.result === "correct").length;
    const totalIncorrect = history.filter((r) => r.result === "incorrect").length;
    const accuracy = total > 0 ? ((totalCorrect / total) * 100).toFixed(1) : null;

    const studiedIds = new Set(history.map((r) => r.cardId));
    const neverStudied = cards.filter((c) => !studiedIds.has(c.id));

    // Per-card stats
    const cardStats = new Map<string, { correct: number; incorrect: number }>();
    for (const record of history) {
      const existing = cardStats.get(record.cardId) ?? { correct: 0, incorrect: 0 };
      if (record.result === "correct") existing.correct++;
      else existing.incorrect++;
      cardStats.set(record.cardId, existing);
    }

    const hardestCards = Array.from(cardStats.entries())
      .map(([id, s]) => {
        const total = s.correct + s.incorrect;
        return { id, total, incorrectRatio: total > 0 ? s.incorrect / total : 0 };
      })
      .filter((c) => c.total >= 3)
      .sort((a, b) => b.incorrectRatio - a.incorrectRatio)
      .slice(0, 5)
      .map((c) => {
        const card = cards.find((card) => card.id === c.id);
        return { ...c, card };
      });

    return { total, totalCorrect, totalIncorrect, accuracy, neverStudied, hardestCards };
  }, [history, cards]);

  function handleClear() {
    clearHistory();
    setConfirmClear(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Statistics</h1>
        <button
          onClick={() => setConfirmClear(true)}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
        >
          Clear History
        </button>
      </div>

      {stats.total === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-2xl font-semibold text-gray-500">No study history yet.</p>
          <p className="text-gray-400">Start studying to see your stats!</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Studied" value={stats.total} color="indigo" />
            <StatCard label="Correct" value={stats.totalCorrect} color="green" />
            <StatCard label="Incorrect" value={stats.totalIncorrect} color="red" />
            <StatCard
              label="Accuracy"
              value={stats.accuracy !== null ? `${stats.accuracy}%` : "N/A"}
              color="amber"
            />
          </div>

          {/* Cards Never Studied */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              Cards Never Studied
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({stats.neverStudied.length})
              </span>
            </h2>
            {stats.neverStudied.length === 0 ? (
              <p className="text-sm text-green-600 font-medium">You've studied every card! 🎉</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.neverStudied.map((c) => (
                  <li key={c.id} className="py-2 flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{c.spanish}</span>
                    <span className="text-gray-400">{c.english}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Hardest Cards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              Hardest Cards
              <span className="ml-2 text-xs font-normal text-gray-400">
                (top 5 with ≥ 3 attempts)
              </span>
            </h2>
            {stats.hardestCards.length === 0 ? (
              <p className="text-sm text-gray-400">Not enough data yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {stats.hardestCards.map((item) => (
                  <li key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.card?.spanish ?? item.id}</p>
                      <p className="text-xs text-gray-400">{item.card?.english}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-500">
                        {(item.incorrectRatio * 100).toFixed(0)}% incorrect
                      </p>
                      <p className="text-xs text-gray-400">{item.total} attempts</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {/* Clear History Confirmation Dialog */}
      {confirmClear && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Clear All History?</h3>
            <p className="text-gray-600 text-sm mb-5">
              This will permanently delete all study records. Your cards will remain.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmClear(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: "indigo" | "green" | "red" | "amber";
}) {
  const colorMap = {
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100",
    green: "text-green-600 bg-green-50 border-green-100",
    red: "text-red-600 bg-red-50 border-red-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
  };
  return (
    <div className={`rounded-xl border p-4 flex flex-col items-center ${colorMap[color]}`}>
      <span className={`text-3xl font-bold ${colorMap[color].split(" ")[0]}`}>{value}</span>
      <span className="text-xs text-gray-500 mt-1 text-center">{label}</span>
    </div>
  );
}
