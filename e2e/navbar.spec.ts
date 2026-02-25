import { test, expect } from "@playwright/test";
import { resetStorage } from "./helpers";

test.describe("NavBar & Routing", () => {
  test.beforeEach(async ({ page }) => {
    await resetStorage(page);
  });

  test("renders nav links on every page", async ({ page }) => {
    await page.goto("/study");
    for (const label of ["Study", "Review", "Quiz", "Manage Cards", "Stats"]) {
      await expect(page.getByRole("link", { name: label })).toBeVisible();
    }
  });

  test("root path redirects to /study", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/study/);
  });

  test("navigates to each route via NavBar links", async ({ page }) => {
    await page.goto("/study");

    await page.getByRole("link", { name: "Quiz" }).click();
    await expect(page).toHaveURL(/\/quiz/);

    await page.getByRole("link", { name: "Manage Cards" }).click();
    await expect(page).toHaveURL(/\/manage/);

    await page.getByRole("link", { name: "Stats" }).click();
    await expect(page).toHaveURL(/\/stats/);

    await page.getByRole("link", { name: "Review" }).click();
    await expect(page).toHaveURL(/\/review/);

    await page.getByRole("link", { name: "Study" }).click();
    await expect(page).toHaveURL(/\/study/);
  });

  test("active NavBar link is visually highlighted", async ({ page }) => {
    await page.goto("/manage");
    const activeLink = page.getByRole("link", { name: "Manage Cards" });
    await expect(activeLink).toHaveClass(/bg-indigo-700/);
  });

  test("direct URL navigation works without 404", async ({ page }) => {
    for (const route of ["/study", "/review", "/quiz", "/manage", "/stats"]) {
      await page.goto(route);
      await expect(page.getByRole("navigation")).toBeVisible();
    }
  });

  test("mobile hamburger menu toggles nav links", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/study");

    // Desktop links hidden on mobile
    const desktopNav = page.locator(".hidden.md\\:flex");
    await expect(desktopNav).not.toBeVisible();

    // Hamburger opens the menu
    await page.getByRole("button", { name: "Toggle menu" }).click();
    await expect(page.getByRole("link", { name: "Quiz" }).last()).toBeVisible();

    // Clicking a link closes the menu and navigates
    await page.getByRole("link", { name: "Quiz" }).last().click();
    await expect(page).toHaveURL(/\/quiz/);
  });
});
