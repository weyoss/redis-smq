/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '../fixtures/index.js';
import { SEL } from '../helpers/selectors.js';

test.describe('Shell — API health indicator', () => {
  test('HEALTH-1: shows "API connected" when the ping endpoint responds', async ({
    page,
  }) => {
    // The Playwright webServer fixture starts `scripts/dev.js` (Redis +
    // REST API + Vite), so the API is guaranteed to be up. On mount,
    // usePing fires once and settles to `isUp: true`.
    await page.goto('/');

    await expect(page.locator(SEL.healthUp)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(SEL.healthUp)).toContainText('API connected');
  });

  test('HEALTH-2: clicking the indicator refetches ping', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(SEL.healthUp)).toBeVisible({
      timeout: 10_000,
    });

    const [req] = await Promise.all([
      page.waitForRequest(
        (r) =>
          r.method() === 'GET' && new URL(r.url()).pathname === '/api/ping',
        { timeout: 10_000 },
      ),
      page.locator(SEL.health).click(),
    ]);

    expect(req.method()).toBe('GET');
  });

  test('HEALTH-3: shows "API unreachable" when ping fails', async ({
    page,
  }) => {
    // Block the ping. usePing has `retry: false`, so the first failed
    // fetch settles the query into error state — isUp flips to false,
    // state becomes 'down'.
    await page.route('**/api/ping', (route) => route.abort());

    await page.goto('/');

    await expect(page.locator(SEL.healthDown)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(SEL.healthDown)).toContainText('API unreachable');
  });
});
