/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/// <reference lib="dom" />

import { test, expect } from '../fixtures/index.js';
import { SEL } from '../helpers/selectors.js';

test.describe('Shell — accessibility', () => {
  test('A11Y-1: skip link exists and points at main content', async ({
    page,
  }) => {
    await page.goto('/');

    const skipLink = page.locator(SEL.skipLink);
    await expect(skipLink).toHaveText('Skip to main content');
    await expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('A11Y-2: skip link is off-screen until focused, then moves focus to main (M8)', async ({
    page,
  }) => {
    await page.goto('/');

    const skipLink = page.locator(SEL.skipLink);

    // Wait for the app to finish mounting before pressing Tab. The
    // skip link is rendered by DefaultLayout, which only mounts after
    // Vue Router resolves its initial navigation — which happens well
    // after `page.goto`'s load event. If we press Tab against the
    // pre-mount DOM, there's no focusable element and focus stays on
    // `<body>`; the subsequent toBeFocused() then fails after 5s even
    // though the skip link eventually appears.
    //
    // `toBeVisible()` is the right wait: Playwright's visibility check
    // is about non-zero size and `visibility: visible`, not viewport
    // position — so an element at `left: -9999px` still passes. That's
    // exactly the situation we want here (mounted, still hidden).
    await expect(skipLink).toBeVisible();

    // Hidden via `left: -9999px` until focused. Playwright's
    // `toBeInViewport` is the right assertion — `toBeVisible` returns
    // true for off-screen elements.
    await expect(skipLink).not.toBeInViewport();

    // The skip link is the first focusable element in the DOM (it's a
    // sibling of `<div class="app">`, before the header). A single Tab
    // from `<body>` lands on it.
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();

    // Enter navigates to #main-content. Because `<main>` has
    // tabindex="-1", focus moves there rather than staying on the
    // skip link. This is the behavior M8 introduced.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main-content$/);

    const activeId = await page.evaluate(
      () => document.activeElement?.id ?? null,
    );
    expect(activeId).toBe('main-content');
  });

  test('A11Y-3: shell exposes the standard landmarks', async ({ page }) => {
    await page.goto('/');

    // banner → <header> at the top of the document
    await expect(page.getByRole('banner')).toBeVisible();
    // main → <main id="main-content">
    await expect(page.getByRole('main')).toBeVisible();
    // contentinfo → <footer> at the bottom
    await expect(page.getByRole('contentinfo')).toBeVisible();
    // navigation → <nav aria-label="Main navigation">
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeVisible();
  });

  test('A11Y-4: 404 page has no shell landmarks', async ({ page }) => {
    await page.goto('/does-not-exist');

    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator(SEL.header)).toHaveCount(0);
    await expect(page.locator(SEL.footer)).toHaveCount(0);

    // Skip link lives inside the layout, which the 404 route bypasses.
    await expect(page.locator(SEL.skipLink)).toHaveCount(0);
  });

  test('A11Y-5: 404 "Go home" button navigates to home', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page.locator('h1')).toContainText('404');

    await page.getByRole('button', { name: 'Go home' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('Home');
    // The shell is back.
    await expect(page.locator(SEL.header)).toBeVisible();
  });
});
