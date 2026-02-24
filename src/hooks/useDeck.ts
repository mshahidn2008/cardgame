import { useState } from "react";
import type { Card } from "../types";
import seedData from "../assets/cards.json";

const STORAGE_KEY = "flashcards_deck";

function loadDeck(): Card[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored) as Card[];
  }
  const seed = seedData as Card[];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

function saveDeck(deck: Card[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
}

export function useDeck() {
  const [cards, setCards] = useState<Card[]>(() => loadDeck());

  function addCard(spanish: string, english: string): void {
    const newCard: Card = {
      id: crypto.randomUUID(),
      spanish: spanish.trim(),
      english: english.trim(),
      createdAt: new Date().toISOString(),
    };
    setCards((prev) => {
      const updated = [...prev, newCard];
      saveDeck(updated);
      return updated;
    });
  }

  function editCard(id: string, spanish: string, english: string): void {
    setCards((prev) => {
      const updated = prev.map((card) =>
        card.id === id
          ? { ...card, spanish: spanish.trim(), english: english.trim() }
          : card
      );
      saveDeck(updated);
      return updated;
    });
  }

  function deleteCard(id: string): void {
    setCards((prev) => {
      const updated = prev.filter((card) => card.id !== id);
      saveDeck(updated);
      return updated;
    });
  }

  return { cards, addCard, editCard, deleteCard };
}
