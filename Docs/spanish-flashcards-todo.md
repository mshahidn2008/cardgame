# To-Do List: Spanish Flashcards Web App

---

## Phase 1 — Project Setup & Infrastructure

---

### TODO-01 · Scaffold the project

Set up a new Vite + React + TypeScript project with Tailwind CSS and `react-router-dom` installed and configured.

**Acceptance Criteria:**
- Running `npm run dev` starts the dev server without errors.
- A placeholder `App.tsx` renders in the browser.
- Tailwind utility classes (e.g. `bg-blue-500`) apply correctly to elements.
- TypeScript strict mode is enabled in `tsconfig.json`.
- `react-router-dom` is installed and a `<BrowserRouter>` wraps the app in `main.tsx`.

---

### TODO-02 · Define shared TypeScript types

Create `src/types/index.ts` containing the `Card` and `SessionRecord` interfaces as defined in the spec.

**Acceptance Criteria:**
- `Card` interface has fields: `id: string`, `spanish: string`, `english: string`, `createdAt: string`.
- `SessionRecord` interface has fields: `cardId: string`, `result: "correct" | "incorrect"`, `timestamp: string`.
- Both interfaces are exported and importable from other files without TypeScript errors.

---

### TODO-03 · Create seed data file

Create `src/assets/cards.json` with a minimum of 20 Spanish/English word pair entries matching the `Card` schema.

**Acceptance Criteria:**
- The file contains at least 20 entries.
- Every entry has a unique `id`, a non-empty `spanish` field, a non-empty `english` field, and a valid ISO 8601 `createdAt` timestamp.
- The file is valid JSON (passes a JSON linter).
- The file can be imported into a TypeScript file and typed as `Card[]` without errors.

---

### TODO-04 · Implement `useDeck` hook

Create `src/hooks/useDeck.ts` to manage all card CRUD operations with `localStorage` persistence, including first-load seeding from `cards.json`.

**Acceptance Criteria:**
- On first load (when `flashcards_deck` is absent from `localStorage`), the hook seeds the deck from `cards.json` and writes it to `localStorage`.
- On subsequent loads, the hook reads from `localStorage` instead of the seed file.
- The hook exposes: the current `Card[]` array, and `addCard`, `editCard`, `deleteCard` functions.
- `addCard` generates a UUID via `crypto.randomUUID()` and sets `createdAt` to the current ISO timestamp before saving.
- `editCard` updates only the `spanish` and `english` fields of the target card.
- `deleteCard` removes the card with the matching `id`.
- All mutations immediately update both React state and `localStorage`.

---

### TODO-05 · Implement `useHistory` hook

Create `src/hooks/useHistory.ts` to manage reading, writing, and clearing session history in `localStorage`.

**Acceptance Criteria:**
- The hook reads from `localStorage` key `flashcards_history` on mount.
- It exposes: the full `SessionRecord[]` array, an `addRecord(cardId, result)` function, and a `clearHistory()` function.
- `addRecord` appends a new `SessionRecord` with the current ISO timestamp and persists it immediately to `localStorage`.
- `clearHistory` removes all records from state and deletes the `flashcards_history` key from `localStorage`.
- State updates are reflected immediately in any component consuming the hook.

---

### TODO-06 · Set up client-side routing and NavBar

Create `src/components/NavBar.tsx` and configure all five routes in `App.tsx`.

**Acceptance Criteria:**
- The NavBar renders on every page with links to: Study (`/study`), Review (`/review`), Quiz (`/quiz`), Manage Cards (`/manage`), and Stats (`/stats`).
- Navigating to each route renders the correct page component (stub components are acceptable at this stage).
- The currently active route link is visually distinguished (e.g. underline or bold).
- The NavBar is responsive and usable on mobile viewports.
- Navigating directly to a route URL (e.g. `/stats`) loads the correct page without a 404.

---

## Phase 2 — Core Study Features

---

### TODO-07 · Build the `Flashcard` component

Create `src/components/Flashcard.tsx` — a reusable card UI that supports a 3D flip animation.

**Acceptance Criteria:**
- The front face displays the Spanish word/phrase passed as a prop.
- The back face displays the English translation passed as a prop.
- Clicking the card (or a dedicated Flip button) triggers a CSS 3D flip animation using `rotateY(180deg)`.
- `backface-visibility: hidden` is applied to both faces so only one is visible at a time.
- The back face and its content are not visible or readable before flipping (e.g. no bleed-through).
- The component accepts an `onFlip` callback prop that is called when the card is flipped.
- The component is fully controlled — it can be reset to the front face by a parent.

---

### TODO-08 · Build Study Mode

Create `src/components/StudyMode.tsx` at route `/study`.

**Acceptance Criteria:**
- Cards are presented in a randomized order each time a new session starts.
- A progress indicator shows the current card index and total (e.g. "Card 3 of 20").
- The self-assessment buttons ("Got it right ✓" and "Got it wrong ✗") are hidden until the card has been flipped.
- Clicking an assessment button records a `SessionRecord` via `useHistory` and advances to the next card.
- After the last card is answered, a summary screen is shown displaying the total correct and incorrect counts.
- The summary screen provides a "Restart" button (reloads the full deck in a new random order) and a "Review Incorrect" button (navigates to `/review`).
- If the deck is empty, a message prompts the user to add cards via the Manage Cards page.

---

### TODO-09 · Build Review Mode

Create `src/components/ReviewMode.tsx` at route `/review`.

**Acceptance Criteria:**
- Only cards with a `result: "incorrect"` entry in the most recent study session are loaded.
- "Most recent session" is defined as all `SessionRecord` entries recorded after the most recent session start (i.e. grouped by contiguous timestamp sequence — implementation may use a session start timestamp stored separately in `localStorage`).
- If no incorrect cards exist, the message "You got everything right! Nothing to review." is displayed with a link back to Study Mode.
- The flip and self-assessment flow is identical to Study Mode.
- Results recorded during Review Mode are appended as new `SessionRecord` entries and do not overwrite the original session records.
- A progress indicator is shown (e.g. "Card 1 of 5").

---

## Phase 3 — Deck Management

---

### TODO-10 · Build Card Manager — view and add

Create `src/components/CardManager.tsx` at route `/manage` with a table listing all cards and an "Add Card" form.

**Acceptance Criteria:**
- All cards in the deck are displayed in a table with columns for Spanish, English, and Actions.
- The Add Card form has two text input fields: Spanish and English.
- Submitting the form with both fields filled adds the card to the deck immediately (table updates without a page reload).
- Submitting with one or both fields empty shows a validation error message and does not add the card.
- After a successful add, the form fields are cleared and the new card appears in the table.

---

### TODO-11 · Build Card Manager — edit

Add inline or modal edit functionality to the Card Manager table.

**Acceptance Criteria:**
- Each table row has an "Edit" button.
- Clicking "Edit" opens an edit form (inline in the row or in a modal) pre-populated with the card's current Spanish and English values.
- Saving the edit updates the card in `localStorage` and reflects the change in the table immediately.
- Both fields remain required — saving with an empty field shows a validation error.
- A "Cancel" button or action dismisses the edit form without making any changes.

---

### TODO-12 · Build Card Manager — delete

Add delete functionality to the Card Manager table.

**Acceptance Criteria:**
- Each table row has a "Delete" button.
- Clicking "Delete" shows a confirmation dialog with the message "Are you sure you want to delete this card?" and Confirm / Cancel options.
- Clicking Confirm removes the card from `localStorage` and from the table immediately.
- Clicking Cancel dismisses the dialog without making any changes.
- The deleted card no longer appears in Study Mode, Review Mode, or Quiz Mode.

---

## Phase 4 — Quiz Mode

---

### TODO-13 · Build Quiz Mode — pre-quiz settings screen

Create `src/components/QuizMode.tsx` at route `/quiz` with a settings screen shown before the quiz begins.

**Acceptance Criteria:**
- If the deck has fewer than 4 cards, the page displays a message asking the user to add more cards, and no settings or Start button are shown.
- The settings screen allows the user to set the number of questions (numeric input, default: total deck size, min: 1, max: total deck size).
- The settings screen allows the user to choose card order: Randomized (default) or Sequential.
- A "Start Quiz" button begins the quiz with the selected settings.

---

### TODO-14 · Build Quiz Mode — question and answer flow

Implement the question display and answer selection interaction within Quiz Mode.

**Acceptance Criteria:**
- Each question shows the Spanish word/phrase as the prompt.
- Four answer options are displayed as buttons: one correct English translation and three randomly selected incorrect translations from other cards in the deck.
- The four options are presented in a randomized order (the correct answer is not always in the same position).
- Clicking an answer immediately highlights the correct answer in green. If the user selected incorrectly, their selected answer is also highlighted in red.
- After answering, a "Next" button appears to advance to the next question. The answer buttons are disabled after selection.
- Each answered question records a `SessionRecord` via `useHistory`.

---

### TODO-15 · Build Quiz Mode — results screen

Implement the end-of-quiz results screen.

**Acceptance Criteria:**
- After the last question is answered and "Next" is clicked, the results screen is displayed.
- The results screen shows: total questions answered, number correct, number incorrect, and percentage score (rounded to one decimal place).
- A "Retake Quiz" button restarts the quiz with the same settings.
- A "Back to Home" (or "Back to Study") button navigates away from the quiz.

---

## Phase 5 — Statistics Page

---

### TODO-16 · Build Statistics page

Create `src/components/StatsPage.tsx` at route `/stats`.

**Acceptance Criteria:**
- The page displays all six metrics defined in the spec: Total cards studied, Total correct, Total incorrect, Overall accuracy (as a percentage), Cards never studied, and Hardest cards (top 5 with ≥3 attempts, ranked by incorrect-to-total ratio).
- Metrics are calculated from the full `flashcards_history` array in `localStorage` at render time.
- If no session history exists, a message such as "No study history yet. Start studying to see your stats!" is shown in place of metrics.
- Overall accuracy displays "N/A" or 0% when total studied is zero (no division-by-zero error).
- The "Hardest Cards" section shows "Not enough data yet" if no card has at least 3 attempts.
- A "Clear History" button is present on the page.
- Clicking "Clear History" shows a confirmation dialog. On confirm, all history is wiped via `useHistory.clearHistory()` and the stats reset to their empty state immediately.

---

## Phase 6 — Polish & Responsiveness

---

### TODO-17 · Responsive layout and mobile usability

Audit and fix the layout on small viewports across all pages.

**Acceptance Criteria:**
- All pages are usable on a 375px wide viewport (iPhone SE baseline) without horizontal scrolling.
- The NavBar collapses gracefully on small screens (e.g. a hamburger menu or a condensed horizontal scroll).
- The Flashcard component is fully visible and tappable on mobile without zooming.
- Quiz answer buttons are large enough to tap comfortably on touch screens (min. 44×44px touch target).
- Tables on the Card Manager page scroll horizontally on small viewports rather than overflowing.

---

### TODO-18 · Empty state and edge case handling

Add graceful handling for edge cases across all pages.

**Acceptance Criteria:**
- Study Mode with an empty deck shows a prompt to add cards, not a broken UI.
- Review Mode with no incorrect cards shows the "You got everything right!" message.
- Quiz Mode with fewer than 4 cards shows the appropriate disabled state message.
- Stats page with no history shows an appropriate empty state message.
- Deleting all cards from the deck does not cause errors in Study, Review, or Quiz Mode (they handle the empty deck gracefully).
- No unhandled JavaScript errors appear in the browser console during normal use of any feature.

---

## Summary

| Phase | TODOs | Description |
|---|---|---|
| 1 — Setup | TODO-01 to TODO-06 | Project scaffold, types, seed data, hooks, routing |
| 2 — Study | TODO-07 to TODO-09 | Flashcard component, Study Mode, Review Mode |
| 3 — CRUD | TODO-10 to TODO-12 | Card Manager (view, add, edit, delete) |
| 4 — Quiz | TODO-13 to TODO-15 | Quiz settings, question flow, results |
| 5 — Stats | TODO-16 | Statistics page and Clear History |
| 6 — Polish | TODO-17 to TODO-18 | Responsive layout, edge cases |

**Total items: 18**
