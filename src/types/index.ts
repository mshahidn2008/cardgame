export interface Card {
  id: string;
  spanish: string;
  english: string;
  createdAt: string;
}

export interface SessionRecord {
  cardId: string;
  result: "correct" | "incorrect";
  timestamp: string;
}
