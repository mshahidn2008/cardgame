import { test, expect } from "@playwright/test";
import { resetStorage, seedIncorrectSession } from "./helpers";

// Mirror of src/assets/cards.json (first few entries used for seeding history)
const seedCards = [
  { id: "1", spanish: "el gato",  english: "the cat",   createdAt: "2026-01-01T00:00:00Z" },
  { id: "2", spanish: "la casa",  english: "the house",  createdAt: "2026-01-01T00:00:00Z" },
  { id: "3", spanish: "hablar",   english: "to speak",   createdAt: "2026-01-01T00:00:00Z" },
  { id: "4", spanish: "el perro", english: "the dog",    createdAt: "2026-01-01T00:00:00Z" },
  { id: "5", spanish: "comer",    english: "to eat",     createdAt: "2026-01-01T00:00:00Z" },
];

test.describe("Statistics Page — empty state", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await page.goto("/stats");
  });

  test("shows empty state message when no history exists", async ({ page }) => {
    await expect(page.getByText(/No study history yet/)).toBeVisible();
  });

  test("shows Clear History button even with no history", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Clear History" })).toBeVisible();
  });
});

test.describe("Statistics Page — with history", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);

    // Seed a history with known correct/incorrect for the first 5 cards
    const now = new Date().toISOString();
    const history = [
      { cardId: seedCards[0].id, result: "correct",   timestamp: now },
      { cardId: seedCards[1].id, result: "correct",   timestamp: now },
      { cardId: seedCards[2].id, result: "incorrect", timestamp: now },
      { cardId: seedCards[3].id, result: "incorrect", timestamp: now },
      { cardId: seedCards[4].id, result: "correct",   timestamp: now },
    ];
    await page.evaluate(
      ({ key, history }) => localStorage.setItem(key, JSON.stringify(history)),
      { key: "flashcards_history", history }
    );

    await page.goto("/stats");
  });

  test("displays the Statistics heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible();
  });

  test("shows total studied count", async ({ page }) => {
    await expect(page.getByText("Total Studied")).toBeVisible();
    await expect(page.getByText("5", { exact: true })).toBeVisible();
  });

  test("shows correct count", async ({ page }) => {
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await expect(page.getByText("3", { exact: true })).toBeVisible();
  });

  test("shows incorrect count", async ({ page }) => {
    await expect(page.getByText("Incorrect", { exact: true })).toBeVisible();
    await expect(page.getByText("2", { exact: true })).toBeVisible();
  });

  test("shows overall accuracy as a percentage", async ({ page }) => {
    await expect(page.getByText("Accuracy")).toBeVisible();
    // 3/5 = 60.0%
    await expect(page.getByText("60.0%")).toBeVisible();
  });

  test("shows cards never studied section", async ({ page }) => {
    await expect(page.getByText("Cards Never Studied")).toBeVisible();
    // 25 seed cards - 5 studied = 20 never studied
    await expect(page.getByText("(20)")).toBeVisible();
  });

  test("shows 'Hardest Cards' section", async ({ page }) => {
    await expect(page.getByText("Hardest Cards")).toBeVisible();
  });

  test("shows 'Not enough data yet' when no card has 3+ attempts", async ({ page }) => {
    await expect(page.getByText(/Not enough data yet/)).toBeVisible();
  });

  test("hardest cards appear when a card has 3+ attempts", async ({ page }) => {
    // Build a history where one card has 4 attempts, 3 wrong
    const now = new Date().toISOString();
    const cardId = seedCards[0].id;
    const history = [
      { cardId, result: "incorrect", timestamp: now },
      { cardId, result: "incorrect", timestamp: now },
      { cardId, result: "incorrect", timestamp: now },
      { cardId, result: "correct",   timestamp: now },
    ];
    await page.evaluate(
      ({ key, history }) => localStorage.setItem(key, JSON.stringify(history)),
      { key: "flashcards_history", history }
    );
    await page.reload();

    await expect(page.getByText(/75% incorrect/)).toBeVisible();
  });
});

test.describe("Statistics Page — Clear History", () => {
  test.beforeEach(async ({ page }) => {
    await seedIncorrectSession(page);
    await page.goto("/stats");
  });

  test("Clear History button opens a confirmation dialog", async ({ page }) => {
    await page.getByRole("button", { name: "Clear History" }).click();
    await expect(page.getByText("Clear All History?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("cancelling Clear History dialog keeps history intact", async ({ page }) => {
    await page.getByRole("button", { name: "Clear History" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Clear All History?")).not.toBeVisible();
    // Stats are still shown (not empty state)
    await expect(page.getByText(/No study history yet/)).not.toBeVisible();
  });

  test("confirming Clear History wipes stats and shows empty state", async ({ page }) => {
    await page.getByRole("button", { name: "Clear History" }).click();
    await page.locator(".fixed button.bg-red-600").click();

    await expect(page.getByText(/No study history yet/)).toBeVisible();
  });

  test("localStorage history is empty after confirm", async ({ page }) => {
    await page.getByRole("button", { name: "Clear History" }).click();
    await page.locator(".fixed button.bg-red-600").click();

    const history = await page.evaluate(() => localStorage.getItem("flashcards_history"));
    expect(history).toBeNull();
  });
});
