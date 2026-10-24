/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { expect, type Page } from '@playwright/test';
import { SEL } from './selectors.js';

/**
 * Assert a specific error message is visible in the first inline
 * `.alert-danger` on the page. `text` may be a substring or regex —
 * exact-match is rarely what you want since server messages include
 * context.
 */
export async function expectInlineError(
  page: Page,
  text: string | RegExp,
): Promise<void> {
  await expect(page.locator(SEL.alertDanger).first()).toContainText(text);
}

/** Assert no `.alert-danger` is visible anywhere on the page. */
export async function expectNoInlineError(page: Page): Promise<void> {
  await expect(page.locator(SEL.alertDanger)).toHaveCount(0);
}

/**
 * Assert a per-field validation error is visible. `text` should be a
 * distinctive fragment of the message ("must be at least 2 characters")
 * rather than the label.
 */
export async function expectFieldError(
  page: Page,
  text: string | RegExp,
): Promise<void> {
  await expect(page.locator(SEL.fieldError).first()).toContainText(text);
}

/**
 * Regression guard for the "[object Object]" bug — any code path that
 * renders an IAPIError through direct interpolation instead of
 * `getErrorMessage()` produces this. Only checks error surfaces (not
 * the whole page) so legitimate data containing that string doesn't
 * trip the assertion.
 */
export async function expectNoObjectObjectInErrors(page: Page): Promise<void> {
  const surfaces = [SEL.alertDanger, SEL.stateError, SEL.fieldError];
  for (const sel of surfaces) {
    const els = page.locator(sel);
    const count = await els.count();
    for (let i = 0; i < count; i++) {
      await expect(els.nth(i)).not.toContainText('[object Object]');
    }
  }
}

/**
 * Wait for every loading spinner to disappear. Pass `timeout` for slow
 * operations (bulk delete, purge) — default 10s covers most fetch
 * completions.
 */
export async function waitForLoadingToFinish(
  page: Page,
  timeout = 10_000,
): Promise<void> {
  await expect(page.locator(SEL.stateLoading)).toHaveCount(0, { timeout });
}

/** Wait for the empty state block to appear. */
export async function waitForEmptyState(
  page: Page,
  timeout = 10_000,
): Promise<void> {
  await expect(page.locator(SEL.stateEmpty)).toBeVisible({ timeout });
}

/** Wait for the error state block to appear (page-level errors, not inline). */
export async function waitForErrorState(
  page: Page,
  timeout = 10_000,
): Promise<void> {
  await expect(page.locator(SEL.stateError)).toBeVisible({ timeout });
}
