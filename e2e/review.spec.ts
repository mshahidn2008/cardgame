import { test, expect } from "@playwright/test";
import { seedIncorrectSession, seedAllCorrectSession } from "./helpers";

test.describe("Review Mode", () => {
  test("shows 'nothing to review' when no incorrect cards exist", async ({ page }) => {
    await seedAllCorrectSession(page);
    await page.goto("/review");
    await expect(page.getByText(/You got everything right/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Back to Study" })).toBeVisible();
  });

  test("'Back to Study' link on empty review navigates to /study", async ({ page }) => {
    await seedAllCorrectSession(page);
    await page.goto("/review");
    await page.getByRole("button", { name: "Back to Study" }).click();
    await expect(page).toHaveURL(/\/study/);
  });

  test("shows Review Mode badge when there are incorrect cards", async ({ page }) => {
    await seedIncorrectSession(page);
    await page.goto("/review");
    await expect(page.getByText("Review Mode")).toBeVisible();
  });

  test("shows progress indicator for review deck", async ({ page }) => {
    await seedIncorrectSession(page);
    await page.goto("/review");
    await expect(page.getByText(/Card 1 of 3/)).toBeVisible();
  });

  test("assessment buttons hidden until card is flipped", async ({ page }) => {
    await seedIncorrectSession(page);
    await page.goto("/review");
    await expect(page.getByRole("button", { name: /Got it right/ })).not.toBeVisible();
  });

  test("flipping shows assessment buttons", async ({ page }) => {
    await seedIncorrectSession(page);
    await page.goto("/review");
    await page.getByRole("button", { name: "Flip Card" }).click();
    await expect(page.getByRole("button", { name: /Got it right/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Got it wrong/ })).toBeVisible();
  });

  test("answering advances the progress indicator", async ({ page }) => {
    await seedIncorrectSession(page);
    await page.goto("/review");
    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it right/ }).click();
    await expect(page.getByText(/Card 2 of 3/)).toBeVisible();
  });

  test("completing review shows summary screen", async ({ page }) => {
    await seedIncorrectSession(page);
    await page.goto("/review");

    for (let i = 0; i < 3; i++) {
      await page.getByRole("button", { name: "Flip Card" }).click();
      await page.getByRole("button", { name: /Got it right/ }).click();
    }

    await expect(page.getByText("Review Complete!")).toBeVisible();
    await expect(page.getByRole("button", { name: "Back to Study" })).toBeVisible();
  });

  test("review records are appended to history (not overwriting)", async ({ page }) => {
    await seedIncorrectSession(page);
    await page.goto("/review");

    const historySizeBefore = await page.evaluate(() => {
      const h = localStorage.getItem("flashcards_history");
      return h ? JSON.parse(h).length : 0;
    });

    await page.getByRole("button", { name: "Flip Card" }).click();
    await page.getByRole("button", { name: /Got it right/ }).click();

    const historySizeAfter = await page.evaluate(() => {
      const h = localStorage.getItem("flashcards_history");
      return h ? JSON.parse(h).length : 0;
    });

    expect(historySizeAfter).toBe(historySizeBefore + 1);
  });

  test("shows no session history when navigating to review with no prior session", async ({ page }) => {
    // Fresh state — no session records at all
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("flashcards_history");
      localStorage.removeItem("flashcards_session_start");
    });
    await page.goto("/review");
    await expect(page.getByText(/You got everything right/)).toBeVisible();
  });
});
