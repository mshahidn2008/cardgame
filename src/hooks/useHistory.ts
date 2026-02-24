import { useState } from "react";
import type { SessionRecord } from "../types";

const HISTORY_KEY = "flashcards_history";
const SESSION_START_KEY = "flashcards_session_start";

function loadHistory(): SessionRecord[] {
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? (JSON.parse(stored) as SessionRecord[]) : [];
}

export function useHistory() {
  const [history, setHistory] = useState<SessionRecord[]>(() => loadHistory());

  function addRecord(cardId: string, result: "correct" | "incorrect"): void {
    const record: SessionRecord = {
      cardId,
      result,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => {
      const updated = [...prev, record];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  function markSessionStart(): void {
    localStorage.setItem(SESSION_START_KEY, new Date().toISOString());
  }

  function getLastSessionRecords(): SessionRecord[] {
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    if (!sessionStart) return [];
    const all = loadHistory();
    return all.filter((r) => r.timestamp >= sessionStart);
  }

  function clearHistory(): void {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(SESSION_START_KEY);
    setHistory([]);
  }

  return { history, addRecord, markSessionStart, getLastSessionRecords, clearHistory };
}
