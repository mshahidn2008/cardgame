# Software Specification: Spanish Flashcards Web App

**Version:** 1.0  
**Date:** 2026-02-23  
**Stack:** TypeScript, Vite, React

---

## 1. Overview

A single-page web application that helps users learn Spanish vocabulary through interactive flashcards. Users can study a deck of Spanish/English word pairs, self-assess their knowledge, track their progress, and test themselves via multiple choice quizzes. The deck is fully manageable (add, edit, delete cards) and all data persists locally.

---

## 2. Data Model

### 2.1 Card

Each flashcard is represented as a JSON object with the following shape:

```ts
interface Card {
  id: string;          // UUID, generated on creation
  spanish: string;     // The Spanish word or phrase
  english: string;     // The English translation
  createdAt: string;   // ISO 8601 timestamp
}
```

### 2.2 Study Session Record

```ts
interface SessionRecord {
  cardId: string;
  result: "correct" | "incorrect";
  timestamp: string;   // ISO 8601 timestamp
}
```

### 2.3 Storage

- **Card data** is stored in a local `cards.json` file bundled with the app. On first load, this file is read into `localStorage` as the initial deck. All subsequent reads and writes go to `localStorage` so the user's additions and edits persist across sessions.
- **Session history** (study results) is stored in `localStorage` under a separate key.
- `localStorage` keys:
  - `flashcards_deck` — serialized `Card[]`
  - `flashcards_history` — serialized `SessionRecord[]`

---

## 3. Application Structure

```
src/
├── assets/
│   └── cards.json           # Seed data: initial Spanish/English pairs
├── components/
│   ├── Flashcard.tsx         # Flip card UI
│   ├── CardManager.tsx       # CRUD interface for cards
│   ├── StudyMode.tsx         # Standard flip-and-rate study mode
│   ├── ReviewMode.tsx        # Redo only incorrect cards
│   ├── QuizMode.tsx          # Multiple choice quiz
│   ├── StatsPage.tsx         # Statistics dashboard
│   └── NavBar.tsx            # Top navigation
├── hooks/
│   ├── useDeck.ts            # Card CRUD logic + localStorage persistence
│   └── useHistory.ts         # Session history logic
├── types/
│   └── index.ts              # Shared TypeScript interfaces
├── App.tsx
└── main.tsx
```

---

## 4. Feature Specifications

### 4.1 Deck Management (CRUD)

**Location:** Card Manager page (`/manage`)

Users can view the full list of cards in a table and perform the following actions:

- **Add card:** A form with two fields — *Spanish* and *English* — and a submit button. Validation requires both fields to be non-empty. On submit, a new `Card` object is created with a generated UUID and appended to the deck in `localStorage`.
- **Edit card:** Each row in the table has an Edit button that opens an inline or modal edit form pre-populated with the card's current values. On save, the card is updated in `localStorage`.
- **Delete card:** Each row has a Delete button. A confirmation dialog ("Are you sure you want to delete this card?") must be acknowledged before deletion. On confirm, the card is removed from `localStorage`.

All changes are reflected immediately in the UI without a page reload.

---

### 4.2 Study Mode

**Location:** Study page (`/study`)

The standard study flow presents cards one at a time in a randomized order.

**Card display:**
- The front of the card shows the Spanish word/phrase.
- The card has a visible "Flip" button (or the card itself is clickable).
- Clicking flip triggers a CSS 3D flip animation, revealing the English translation on the back.

**Self-assessment (shown only after flipping):**
- Two buttons appear below the card: **Got it right ✓** and **Got it wrong ✗**.
- Clicking either button records a `SessionRecord` to `localStorage` and advances to the next card.
- A progress indicator (e.g. "Card 4 of 20") is displayed at the top.

**End of deck:**
- When all cards have been answered, a summary screen is shown with the count of correct and incorrect answers and buttons to restart the full deck or switch to Review Mode.

---

### 4.3 Review Mode (Incorrect Cards Only)

**Location:** Accessible from the end-of-deck summary screen or via navigation (`/review`)

- Loads only the cards that were marked **incorrect** in the most recent study session.
- If there are no incorrect cards, a message is shown: *"You got everything right! Nothing to review."*
- The study flow (flip, self-assess) is identical to Study Mode.
- Results recorded during Review Mode are stored as new `SessionRecord` entries (they do not overwrite the original session's records).

---

### 4.4 Quiz Mode — Multiple Choice

**Location:** Quiz page (`/quiz`)

Users are tested on the full deck (or a configurable subset, see below) in multiple choice format.

**Question format:**
- The Spanish word/phrase is displayed as the question prompt.
- Four answer options are shown as buttons, one of which is the correct English translation and three of which are randomly selected incorrect translations from other cards in the deck.
- If the deck has fewer than four cards, the quiz mode is disabled and a message is shown asking the user to add more cards.

**Interaction:**
- The user selects one of the four answer buttons.
- Immediately on selection, correct answers highlight green and the selected wrong answer highlights red (if incorrect). The correct answer is always revealed.
- A **Next** button appears to advance to the next question.
- Results are recorded as `SessionRecord` entries.

**Quiz settings (shown before starting):**
- Number of questions: user can choose how many questions to answer (default: all cards, min: 1, max: total deck size).
- Card order: randomized (default) or sequential.

**End of quiz:**
- A results screen shows: total questions, number correct, number incorrect, and a percentage score.
- A button to retake the quiz or return to the home screen is provided.

---

### 4.5 Statistics Page

**Location:** Stats page (`/stats`)

Displays aggregate data drawn from `localStorage` session history.

**Metrics displayed:**

| Metric | Description |
|---|---|
| Total cards studied | Total number of `SessionRecord` entries |
| Total correct | Count of records with `result: "correct"` |
| Total incorrect | Count of records with `result: "incorrect"` |
| Overall accuracy | `(correct / total) * 100`, displayed as a percentage |
| Cards never studied | Cards in the deck with no session records |
| Hardest cards | Top 5 cards with the highest incorrect-to-total ratio (min. 3 attempts) |

A **Clear History** button allows the user to wipe all session history from `localStorage` after a confirmation dialog.

---

## 5. Navigation

A persistent top navigation bar (`NavBar`) is present on all pages with links to:

- **Study** (`/study`)
- **Review** (`/review`)
- **Quiz** (`/quiz`)
- **Manage Cards** (`/manage`)
- **Stats** (`/stats`)

Routing is handled client-side using `react-router-dom`.

---

## 6. UI & Styling

- Styling: **Tailwind CSS** (utility-first, no additional UI library required).
- The card flip animation uses CSS `transform: rotateY(180deg)` with `perspective` on the parent container and `backface-visibility: hidden` on front/back faces.
- The app is responsive and usable on both desktop and mobile viewports.
- No external font or icon library is required, though one may be added (e.g. Heroicons for button icons).

---

## 7. Technical Constraints & Notes

- **No backend.** All data is stored client-side in `localStorage`. There is no authentication, user accounts, or network requests after the initial page load.
- **Seed data.** `cards.json` provides an initial set of at least 20 Spanish/English word pairs so the app is usable out of the box. On first load, the app checks if `flashcards_deck` exists in `localStorage`; if not, it seeds from `cards.json`.
- **UUID generation.** Use the browser-native `crypto.randomUUID()` for card ID generation.
- **No test framework** is in scope for v1, but code should be structured to make unit testing straightforward.

---

## 8. Out of Scope (v1)

- User accounts or cloud sync
- Multiple decks / deck categories
- Fill-in-the-blank quiz mode
- Spaced repetition algorithm (e.g. SM-2)
- Import/export of cards via CSV or other formats
- Audio pronunciation
- Dark mode toggle

---

## 9. Seed Data Format (`cards.json`)

```json
[
  { "id": "1", "spanish": "el gato", "english": "the cat", "createdAt": "2026-01-01T00:00:00Z" },
  { "id": "2", "spanish": "la casa", "english": "the house", "createdAt": "2026-01-01T00:00:00Z" },
  { "id": "3", "spanish": "hablar", "english": "to speak", "createdAt": "2026-01-01T00:00:00Z" }
]
```

A minimum of 20 entries should be included in the shipped seed file.

---

## 10. Open Questions / Future Considerations

- Should Quiz Mode draw from the full deck or only cards studied in the current session? (Spec assumes full deck for v1.)
- Should Review Mode persist the "incorrect cards" list between app restarts, or only use the in-session most recent results? (Spec assumes most recent session's results, persisted in `localStorage`.)
- A spaced repetition algorithm (SM-2 or similar) would be a high-value addition in v2.
