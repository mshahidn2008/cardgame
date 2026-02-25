import type { Page } from "@playwright/test";

interface SeedCard { id: string; spanish: string; english: string; createdAt: string }

// Inline copy of src/assets/cards.json so tests have no file-path dependencies
const seedCards: SeedCard[] = [
  { id: "1",  spanish: "el gato",     english: "the cat",          createdAt: "2026-01-01T00:00:00Z" },
  { id: "2",  spanish: "la casa",     english: "the house",        createdAt: "2026-01-01T00:00:00Z" },
  { id: "3",  spanish: "hablar",      english: "to speak",         createdAt: "2026-01-01T00:00:00Z" },
  { id: "4",  spanish: "el perro",    english: "the dog",          createdAt: "2026-01-01T00:00:00Z" },
  { id: "5",  spanish: "comer",       english: "to eat",           createdAt: "2026-01-01T00:00:00Z" },
  { id: "6",  spanish: "beber",       english: "to drink",         createdAt: "2026-01-01T00:00:00Z" },
  { id: "7",  spanish: "el libro",    english: "the book",         createdAt: "2026-01-01T00:00:00Z" },
  { id: "8",  spanish: "la mesa",     english: "the table",        createdAt: "2026-01-01T00:00:00Z" },
  { id: "9",  spanish: "la silla",    english: "the chair",        createdAt: "2026-01-01T00:00:00Z" },
  { id: "10", spanish: "el agua",     english: "the water",        createdAt: "2026-01-01T00:00:00Z" },
  { id: "11", spanish: "caminar",     english: "to walk",          createdAt: "2026-01-01T00:00:00Z" },
  { id: "12", spanish: "correr",      english: "to run",           createdAt: "2026-01-01T00:00:00Z" },
  { id: "13", spanish: "dormir",      english: "to sleep",         createdAt: "2026-01-01T00:00:00Z" },
  { id: "14", spanish: "el amigo",    english: "the friend",       createdAt: "2026-01-01T00:00:00Z" },
  { id: "15", spanish: "la ciudad",   english: "the city",         createdAt: "2026-01-01T00:00:00Z" },
  { id: "16", spanish: "el trabajo",  english: "the work / job",   createdAt: "2026-01-01T00:00:00Z" },
  { id: "17", spanish: "la escuela",  english: "the school",       createdAt: "2026-01-01T00:00:00Z" },
  { id: "18", spanish: "grande",      english: "big / large",      createdAt: "2026-01-01T00:00:00Z" },
  { id: "19", spanish: "pequeño",     english: "small / little",   createdAt: "2026-01-01T00:00:00Z" },
  { id: "20", spanish: "rápido",      english: "fast / quick",     createdAt: "2026-01-01T00:00:00Z" },
  { id: "21", spanish: "lento",       english: "slow",             createdAt: "2026-01-01T00:00:00Z" },
  { id: "22", spanish: "el tiempo",   english: "the time / weather", createdAt: "2026-01-01T00:00:00Z" },
  { id: "23", spanish: "la familia",  english: "the family",       createdAt: "2026-01-01T00:00:00Z" },
  { id: "24", spanish: "el dinero",   english: "the money",        createdAt: "2026-01-01T00:00:00Z" },
  { id: "25", spanish: "aprender",    english: "to learn",         createdAt: "2026-01-01T00:00:00Z" },
];

export const DECK_KEY = "flashcards_deck";
export const HISTORY_KEY = "flashcards_history";
export const SESSION_KEY = "flashcards_session_start";

/** Reset localStorage to clean seed state before each test. */
export async function resetStorage(page: Page) {
  // Navigate to /manage (neutral page: no markSessionStart side-effects from StudyMode)
  await page.goto("/manage");
  await page.evaluate(
    ({ deckKey, historyKey, sessionKey, cards }) => {
      localStorage.setItem(deckKey, JSON.stringify(cards));
      localStorage.removeItem(historyKey);
      localStorage.removeItem(sessionKey);
    },
    {
      deckKey: DECK_KEY,
      historyKey: HISTORY_KEY,
      sessionKey: SESSION_KEY,
      cards: seedCards,
    }
  );
}

/** Seed only a small deck (useful for quiz / edge-case tests). */
export async function seedSmallDeck(page: Page, count: number) {
  await page.goto("/manage");
  const small = seedCards.slice(0, count);
  await page.evaluate(
    ({ deckKey, historyKey, sessionKey, cards }) => {
      localStorage.setItem(deckKey, JSON.stringify(cards));
      localStorage.removeItem(historyKey);
      localStorage.removeItem(sessionKey);
    },
    {
      deckKey: DECK_KEY,
      historyKey: HISTORY_KEY,
      sessionKey: SESSION_KEY,
      cards: small,
    }
  );
}

/** Seed an incorrect-cards session so Review Mode has something to show. */
export async function seedIncorrectSession(page: Page) {
  await resetStorage(page);
  const now = new Date().toISOString();
  const sessionStart = new Date(Date.now() - 1000).toISOString();

  const deck = seedCards.slice(0, 3);
  const history = deck.map((c) => ({
    cardId: c.id,
    result: "incorrect",
    timestamp: now,
  }));

  await page.evaluate(
    ({ historyKey, sessionKey, history, sessionStart }) => {
      localStorage.setItem(historyKey, JSON.stringify(history));
      localStorage.setItem(sessionKey, sessionStart);
    },
    { historyKey: HISTORY_KEY, sessionKey: SESSION_KEY, history, sessionStart }
  );
}

/** Seed a session where everything was correct (nothing to review). */
export async function seedAllCorrectSession(page: Page) {
  await resetStorage(page);
  const now = new Date().toISOString();
  const sessionStart = new Date(Date.now() - 1000).toISOString();

  const deck = seedCards.slice(0, 3);
  const history = deck.map((c) => ({
    cardId: c.id,
    result: "correct",
    timestamp: now,
  }));

  await page.evaluate(
    ({ historyKey, sessionKey, history, sessionStart }) => {
      localStorage.setItem(historyKey, JSON.stringify(history));
      localStorage.setItem(sessionKey, sessionStart);
    },
    { historyKey: HISTORY_KEY, sessionKey: SESSION_KEY, history, sessionStart }
  );
}
