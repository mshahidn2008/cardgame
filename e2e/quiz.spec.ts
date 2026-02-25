import { test, expect } from "@playwright/test";
import { resetStorage, seedSmallDeck } from "./helpers";

test.describe("Quiz Mode — settings screen", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await page.goto("/quiz");
  });

  test("shows settings screen with question count input and order selector", async ({ page }) => {
    await expect(page.getByText("Quiz Settings")).toBeVisible();
    await expect(page.getByLabel("Number of Questions")).toBeVisible();
    await expect(page.getByRole("button", { name: "Random" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sequential" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Quiz" })).toBeVisible();
  });

  test("question count defaults to total deck size", async ({ page }) => {
    const input = page.getByLabel("Number of Questions");
    const val = await input.inputValue();
    expect(parseInt(val)).toBe(25); // seed has 25 cards
  });

  test("question count is clamped to deck size", async ({ page }) => {
    const input = page.getByLabel("Number of Questions");
    await input.fill("9999");
    await input.blur();
    const val = await input.inputValue();
    expect(parseInt(val)).toBeLessThanOrEqual(25);
  });

  test("Sequential order button toggles active state", async ({ page }) => {
    await page.getByRole("button", { name: "Sequential" }).click();
    await expect(page.getByRole("button", { name: "Sequential" })).toHaveClass(/bg-indigo-600/);
    await expect(page.getByRole("button", { name: "Random" })).not.toHaveClass(/bg-indigo-600/);
  });

  test("shows disabled message when fewer than 4 cards exist", async ({ page }) => {
    await seedSmallDeck(page, 3);
    await page.goto("/quiz");
    await expect(page.getByText(/Not enough cards for Quiz Mode/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Start Quiz" })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Add More Cards" })).toBeVisible();
  });

  test("'Add More Cards' button navigates to /manage", async ({ page }) => {
    await seedSmallDeck(page, 3);
    await page.goto("/quiz");
    await page.getByRole("button", { name: "Add More Cards" }).click();
    await expect(page).toHaveURL(/\/manage/);
  });
});

test.describe("Quiz Mode — question and answer flow", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await page.goto("/quiz");
    await page.getByRole("button", { name: "Start Quiz" }).click();
  });

  test("shows question prompt with Spanish word", async ({ page }) => {
    await expect(page.getByText(/What does this mean in English/)).toBeVisible();
  });

  test("renders exactly 4 answer option buttons", async ({ page }) => {
    const options = page.locator("button").filter({ hasNotText: /Next|Quiz|Results|Start/ });
    // We wait for the 4 answer buttons
    await expect(page.getByText(/What does this mean in English/)).toBeVisible();
    const answerButtons = page.locator(".flex.flex-col.gap-3 button");
    await expect(answerButtons).toHaveCount(4);
  });

  test("shows quiz mode badge and progress counter", async ({ page }) => {
    await expect(page.getByText("Quiz Mode")).toBeVisible();
    await expect(page.getByText(/Question 1 of/)).toBeVisible();
  });

  test("clicking an answer highlights correct answer green", async ({ page }) => {
    await expect(page.getByText(/What does this mean in English/)).toBeVisible();
    const answerButtons = page.locator(".flex.flex-col.gap-3 button");
    await answerButtons.first().click();
    // At least one button should have a green highlight
    const greenButton = page.locator(".flex.flex-col.gap-3 button.bg-green-100");
    await expect(greenButton).toBeVisible();
  });

  test("answer buttons are disabled after selection", async ({ page }) => {
    await expect(page.getByText(/What does this mean in English/)).toBeVisible();
    const answerButtons = page.locator(".flex.flex-col.gap-3 button");
    await answerButtons.first().click();
    // All answer buttons should be disabled
    const count = await answerButtons.count();
    for (let i = 0; i < count; i++) {
      await expect(answerButtons.nth(i)).toBeDisabled();
    }
  });

  test("Next button appears after answering", async ({ page }) => {
    await expect(page.getByText(/What does this mean in English/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Next Question|See Results/ })).not.toBeVisible();
    const answerButtons = page.locator(".flex.flex-col.gap-3 button");
    await answerButtons.first().click();
    await expect(page.getByRole("button", { name: /Next Question|See Results/ })).toBeVisible();
  });

  test("Next advances to the next question", async ({ page }) => {
    await expect(page.getByText("Question 1 of")).toBeVisible();
    const answerButtons = page.locator(".flex.flex-col.gap-3 button");
    await answerButtons.first().click();
    await page.getByRole("button", { name: /Next Question/ }).click();
    await expect(page.getByText("Question 2 of")).toBeVisible();
  });

  test("session records are saved to localStorage after each answer", async ({ page }) => {
    const answerButtons = page.locator(".flex.flex-col.gap-3 button");
    await answerButtons.first().click();

    const history = await page.evaluate(() => localStorage.getItem("flashcards_history"));
    expect(history).not.toBeNull();
    const records = JSON.parse(history!);
    expect(records.length).toBe(1);
  });
});

test.describe("Quiz Mode — results screen", () => {
  test("shows results after completing all questions", async ({ page }) => {
    await resetStorage(page);
    await page.goto("/quiz");

    // Set quiz to just 2 questions for speed
    const input = page.getByLabel("Number of Questions");
    await input.fill("2");
    await page.getByRole("button", { name: "Start Quiz" }).click();

    for (let i = 0; i < 2; i++) {
      await expect(page.getByText(/What does this mean in English/)).toBeVisible();
      const answerButtons = page.locator(".flex.flex-col.gap-3 button");
      await answerButtons.first().click();
      await page.getByRole("button", { name: /Next Question|See Results/ }).click();
    }

    await expect(page.getByText("Quiz Results")).toBeVisible();
  });

  test("results screen shows total, correct, incorrect, and percentage", async ({ page }) => {
    await resetStorage(page);
    await page.goto("/quiz");

    const input = page.getByLabel("Number of Questions");
    await input.fill("2");
    await page.getByRole("button", { name: "Start Quiz" }).click();

    for (let i = 0; i < 2; i++) {
      await expect(page.getByText(/What does this mean in English/)).toBeVisible();
      const answerButtons = page.locator(".flex.flex-col.gap-3 button");
      await answerButtons.first().click();
      await page.getByRole("button", { name: /Next Question|See Results/ }).click();
    }

    await expect(page.getByText("Quiz Results")).toBeVisible();
    await expect(page.getByText("Total", { exact: true })).toBeVisible();
    await expect(page.getByText("Correct", { exact: true })).toBeVisible();
    await expect(page.getByText("Incorrect", { exact: true })).toBeVisible();
    await expect(page.getByText(/%/)).toBeVisible();
  });

  test("Retake Quiz button restarts with same settings", async ({ page }) => {
    await resetStorage(page);
    await page.goto("/quiz");

    const input = page.getByLabel("Number of Questions");
    await input.fill("2");
    await page.getByRole("button", { name: "Start Quiz" }).click();

    for (let i = 0; i < 2; i++) {
      await expect(page.getByText(/What does this mean in English/)).toBeVisible();
      const answerButtons = page.locator(".flex.flex-col.gap-3 button");
      await answerButtons.first().click();
      await page.getByRole("button", { name: /Next Question|See Results/ }).click();
    }

    await page.getByRole("button", { name: "Retake Quiz" }).click();
    await expect(page.getByText("Question 1 of")).toBeVisible();
  });

  test("Back to Study button navigates to /study", async ({ page }) => {
    await resetStorage(page);
    await page.goto("/quiz");

    const input = page.getByLabel("Number of Questions");
    await input.fill("2");
    await page.getByRole("button", { name: "Start Quiz" }).click();

    for (let i = 0; i < 2; i++) {
      await expect(page.getByText(/What does this mean in English/)).toBeVisible();
      const answerButtons = page.locator(".flex.flex-col.gap-3 button");
      await answerButtons.first().click();
      await page.getByRole("button", { name: /Next Question|See Results/ }).click();
    }

    await page.getByRole("button", { name: "Back to Study" }).click();
    await expect(page).toHaveURL(/\/study/);
  });
});
