import { test, expect } from "@playwright/test";
import { resetStorage, seedSmallDeck, DECK_KEY } from "./helpers";

test.describe("Study Mode", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await page.goto("/study");
  });

  test("shows progress indicator on first card", async ({ page }) => {
    await expect(page.getByText(/Card 1 of/)).toBeVisible();
  });

  test("front of card shows Spanish text", async ({ page }) => {
    const spanishLabel = page.getByText("Spanish");
    await expect(spanishLabel).toBeVisible();
  });

  test("assessment buttons hidden before flip", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Got it right/ })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Got it wrong/ })).not.toBeVisible();
  });

  test("clicking Flip Card reveals English and shows assessment buttons", async ({ page }) => {
    await page.getByRole("button", { name: "Flip Card" }).click();
    await expect(page.getByText("English")).toBeVisible();
    await expect(page.getByRole("button", { name: /Got it right/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Got it wrong/ })).toBeVisible();
  });

  test("clicking the card itself triggers the flip", async ({ page }) => {
    // Click the card area (perspective wrapper)
    const cardContainer = page.locator('[style*="perspective"]');
    await cardContainer.click();
    await expect(page.getByRole("button", { name: /Got it right/ })).toBeVisible();
  });

  test("'Got it right' advances to the next card and updates progress", async ({ page }) => {
    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it right/ }).click();
    await expect(page.getByText(/Card 2 of/)).toBeVisible();
  });

  test("'Got it wrong' advances to the next card", async ({ page }) => {
    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it wrong/ }).click();
    await expect(page.getByText(/Card 2 of/)).toBeVisible();
  });

  test("after flip card resets to front on next card", async ({ page }) => {
    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it right/ }).click();
    // Next card should show Flip Card button (back to front face)
    await expect(page.getByRole("button", { name: "Flip Card" })).toBeVisible();
  });

  test("completes all cards and shows summary screen", async ({ page }) => {
    await seedSmallDeck(page, 2);
    await page.goto("/study");

    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Flip Card" }).click();
      await page.getByRole("button", { name: /Got it right/ }).click();
    }

    await expect(page.getByText("Session Complete!")).toBeVisible();
    await expect(page.getByText("2").first()).toBeVisible(); // correct count
  });

  test("summary screen shows correct and incorrect counts", async ({ page }) => {
    await seedSmallDeck(page, 3);
    await page.goto("/study");

    // Card 1: correct
    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it right/ }).click();
    // Card 2: incorrect
    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it wrong/ }).click();
    // Card 3: correct
    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it right/ }).click();

    await expect(page.getByText("Session Complete!")).toBeVisible();
    // correct = 2, incorrect = 1
    await expect(page.getByText("2").first()).toBeVisible();
    await expect(page.getByText("1").first()).toBeVisible();
  });

  test("Restart button resets the session", async ({ page }) => {
    await seedSmallDeck(page, 2);
    await page.goto("/study");

    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Flip Card" }).click();
      await page.getByRole("button", { name: /Got it right/ }).click();
    }

    await expect(page.getByText("Session Complete!")).toBeVisible();
    await page.getByRole("button", { name: "Restart" }).click();
    await expect(page.getByText(/Card 1 of/)).toBeVisible();
  });

  test("Review Incorrect button navigates to /review", async ({ page }) => {
    await seedSmallDeck(page, 2);
    await page.goto("/study");

    for (let i = 0; i < 2; i++) {
      await page.getByRole("button", { name: "Flip Card" }).click();
      await page.getByRole("button", { name: /Got it right/ }).click();
    }

    await page.getByRole("button", { name: "Review Incorrect" }).click();
    await expect(page).toHaveURL(/\/review/);
  });

  test("empty deck shows prompt to add cards", async ({ page }) => {
    await page.evaluate((key) => localStorage.setItem(key, "[]"), DECK_KEY);
    await page.goto("/study");
    await expect(page.getByText(/No cards in your deck/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Manage Cards" })).toBeVisible();
  });

  test("session history is saved to localStorage after answering", async ({ page }) => {
    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it right/ }).click();

    const history = await page.evaluate((key) => localStorage.getItem(key), "flashcards_history");
    expect(history).not.toBeNull();
    const records = JSON.parse(history!);
    expect(records.length).toBe(1);
    expect(records[0].result).toBe("correct");
  });
});
