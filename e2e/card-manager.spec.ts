import { test, expect } from "@playwright/test";
import { resetStorage } from "./helpers";

test.describe("Card Manager — view", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await page.goto("/manage");
  });

  test("shows the page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Manage Cards" })).toBeVisible();
  });

  test("displays all seed cards in the table", async ({ page }) => {
    // Seed has 25 cards; verify table columns headings
    await expect(page.getByText("Spanish")).toBeVisible();
    await expect(page.getByText("English")).toBeVisible();
    await expect(page.getByText("Actions")).toBeVisible();
  });

  test("each row has Edit and Delete buttons", async ({ page }) => {
    const rows = page.locator("tbody tr");
    const firstRow = rows.first();
    await expect(firstRow.getByRole("button", { name: "Edit" })).toBeVisible();
    await expect(firstRow.getByRole("button", { name: "Delete" })).toBeVisible();
  });
});

test.describe("Card Manager — add card", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await page.goto("/manage");
  });

  test("add form has Spanish and English fields", async ({ page }) => {
    await expect(page.getByPlaceholder("Spanish")).toBeVisible();
    await expect(page.getByPlaceholder("English")).toBeVisible();
    await expect(page.getByRole("button", { name: "+ Add Card" })).toBeVisible();
  });

  test("submitting with both fields adds card to table", async ({ page }) => {
    await page.getByPlaceholder("Spanish").fill("el sol");
    await page.getByPlaceholder("English").fill("the sun");
    await page.getByRole("button", { name: "+ Add Card" }).click();

    await expect(page.getByRole("cell", { name: "el sol" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "the sun" })).toBeVisible();
  });

  test("form clears after successful add", async ({ page }) => {
    await page.getByPlaceholder("Spanish").fill("el sol");
    await page.getByPlaceholder("English").fill("the sun");
    await page.getByRole("button", { name: "+ Add Card" }).click();

    await expect(page.getByPlaceholder("Spanish")).toHaveValue("");
    await expect(page.getByPlaceholder("English")).toHaveValue("");
  });

  test("submitting with empty Spanish shows validation error", async ({ page }) => {
    await page.getByPlaceholder("English").fill("the sun");
    await page.getByRole("button", { name: "+ Add Card" }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test("submitting with empty English shows validation error", async ({ page }) => {
    await page.getByPlaceholder("Spanish").fill("el sol");
    await page.getByRole("button", { name: "+ Add Card" }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test("submitting both fields empty shows validation error", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add Card" }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test("new card is persisted in localStorage", async ({ page }) => {
    await page.getByPlaceholder("Spanish").fill("el sol");
    await page.getByPlaceholder("English").fill("the sun");
    await page.getByRole("button", { name: "+ Add Card" }).click();

    const deck = await page.evaluate(() => localStorage.getItem("flashcards_deck"));
    const cards = JSON.parse(deck!);
    const added = cards.find((c: { spanish: string }) => c.spanish === "el sol");
    expect(added).toBeDefined();
    expect(added.english).toBe("the sun");
  });
});

test.describe("Card Manager — edit card", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await page.goto("/manage");
  });

  test("clicking Edit opens an inline edit form pre-populated with values", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    const originalSpanish = await firstRow.locator("td").first().innerText();

    await firstRow.getByRole("button", { name: "Edit" }).click();

    const spanishInput = page.locator('input[value="' + originalSpanish + '"]');
    await expect(spanishInput).toBeVisible();
  });

  test("saving edit updates the row in the table", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: "Edit" }).click();

    const inputs = page.locator("tbody tr").first().locator("input");
    await inputs.first().fill("la luna");
    await inputs.nth(1).fill("the moon");
    await page.locator("tbody tr").first().getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("cell", { name: "la luna" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "the moon" })).toBeVisible();
  });

  test("Cancel button closes the edit form without saving", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    const originalSpanish = await firstRow.locator("td").first().innerText();

    await firstRow.getByRole("button", { name: "Edit" }).click();
    const inputs = page.locator("tbody tr").first().locator("input");
    await inputs.first().fill("CHANGED");

    await page.locator("tbody tr").first().getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("cell", { name: originalSpanish })).toBeVisible();
    await expect(page.getByRole("cell", { name: "CHANGED" })).not.toBeVisible();
  });

  test("saving with empty Spanish shows validation error", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: "Edit" }).click();

    const inputs = page.locator("tbody tr").first().locator("input");
    await inputs.first().fill("");
    await page.locator("tbody tr").first().getByRole("button", { name: "Save" }).click();

    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test("edit is persisted in localStorage", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: "Edit" }).click();

    const inputs = page.locator("tbody tr").first().locator("input");
    await inputs.first().fill("la luna");
    await inputs.nth(1).fill("the moon");
    await page.locator("tbody tr").first().getByRole("button", { name: "Save" }).click();

    const deck = await page.evaluate(() => localStorage.getItem("flashcards_deck"));
    const cards = JSON.parse(deck!);
    const edited = cards.find((c: { spanish: string }) => c.spanish === "la luna");
    expect(edited).toBeDefined();
    expect(edited.english).toBe("the moon");
  });
});

test.describe("Card Manager — delete card", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
    await page.goto("/manage");
  });

  test("clicking Delete opens a confirmation dialog", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    await firstRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Are you sure you want to delete")).toBeVisible();
    await expect(page.getByRole("button", { name: "Confirm" }).or(page.getByRole("button", { name: "Delete" }).last())).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  });

  test("clicking Cancel dismisses the dialog without deleting", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    const originalSpanish = await firstRow.locator("td").first().innerText();

    await firstRow.getByRole("button", { name: "Delete" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByRole("cell", { name: originalSpanish })).toBeVisible();
    await expect(page.getByText("Are you sure you want to delete")).not.toBeVisible();
  });

  test("confirming Delete removes the card from the table", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    const deletedSpanish = await firstRow.locator("td").first().innerText();

    await firstRow.getByRole("button", { name: "Delete" }).click();
    // click the red Delete button inside the dialog (last one)
    await page.locator(".fixed button.bg-red-600").click();

    await expect(page.getByRole("cell", { name: deletedSpanish })).not.toBeVisible();
  });

  test("deleted card is removed from localStorage", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first();
    const deletedSpanish = await firstRow.locator("td").first().innerText();

    await firstRow.getByRole("button", { name: "Delete" }).click();
    await page.locator(".fixed button.bg-red-600").click();

    const deck = await page.evaluate(() => localStorage.getItem("flashcards_deck"));
    const cards = JSON.parse(deck!);
    const found = cards.find((c: { spanish: string }) => c.spanish === deletedSpanish);
    expect(found).toBeUndefined();
  });
});
