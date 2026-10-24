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

function navLink(page: import('@playwright/test').Page, label: string) {
  return page.locator(SEL.navLink).filter({ hasText: label });
}

const ACTIVE_CLASS = /app-header__link--active/;

test.describe('Shell — header and footer', () => {
  test('SHELL-1: brand link navigates to home', async ({ page }) => {
    await page.goto('/queues');
    await page.locator(SEL.brand).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1')).toContainText('Home');
  });

  test('SHELL-2: nav renders all links in order', async ({ page }) => {
    await page.goto('/');

    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(nav).toBeVisible();

    const labels = await nav.locator(SEL.navLink).allTextContents();
    // `.trim()` because each link has an icon `<i>` plus the text — the
    // icon renders as nothing but the whitespace around it is captured.
    expect(labels.map((t) => t.trim())).toEqual([
      'Home',
      'Namespaces',
      'Queues',
      'Exchanges',
      'Configuration',
    ]);
  });

  test('SHELL-3: nav highlights the correct section per top-level route', async ({
    page,
  }) => {
    const cases: Array<{ path: string; active: string }> = [
      { path: '/', active: 'Home' },
      { path: '/ns', active: 'Namespaces' },
      { path: '/queues', active: 'Queues' },
      { path: '/exchanges', active: 'Exchanges' },
      { path: '/config', active: 'Configuration' },
    ];

    for (const { path, active } of cases) {
      await page.goto(path);
      await expect(navLink(page, active)).toHaveClass(ACTIVE_CLASS);
      for (const other of cases) {
        if (other.active !== active) {
          await expect(navLink(page, other.active)).not.toHaveClass(
            ACTIVE_CLASS,
          );
        }
      }
    }
  });

  test('SHELL-3b: detail routes highlight their parent section (M11)', async ({
    page,
    queue,
  }) => {
    // Queue detail → Queues highlighted.
    await page.goto(`/ns/${queue.ns}/queues/${queue.name}`);
    await expect(navLink(page, 'Queues')).toHaveClass(ACTIVE_CLASS);
    await expect(navLink(page, 'Home')).not.toHaveClass(ACTIVE_CLASS);

    // Messages view → Queues highlighted.
    await page.goto(`/ns/${queue.ns}/queues/${queue.name}/messages`);
    await expect(navLink(page, 'Queues')).toHaveClass(ACTIVE_CLASS);
  });

  test('SHELL-3c: exchange detail highlights Exchanges (M11)', async ({
    page,
    directExchange,
  }) => {
    await page.goto(
      `/ns/${directExchange.ns}/exchanges/${directExchange.name}`,
    );
    await expect(navLink(page, 'Exchanges')).toHaveClass(ACTIVE_CLASS);
    await expect(navLink(page, 'Queues')).not.toHaveClass(ACTIVE_CLASS);
  });

  test('SHELL-3d: namespace-scoped lists highlight their parent section (M11)', async ({
    page,
    queue,
  }) => {
    // /ns/:ns/queues → Queues highlighted (not Namespaces).
    await page.goto(`/ns/${queue.ns}/queues`);
    await expect(navLink(page, 'Queues')).toHaveClass(ACTIVE_CLASS);
    await expect(navLink(page, 'Namespaces')).not.toHaveClass(ACTIVE_CLASS);
  });

  test('SHELL-4: footer renders brand, license, and health indicator', async ({
    page,
  }) => {
    await page.goto('/');

    const footer = page.locator(SEL.footer);
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('RedisSMQ Web UI');
    await expect(footer).toContainText('MIT License');
    // The health indicator is a button with an aria-label starting
    // "API status:".
    await expect(
      footer.getByRole('button', { name: /^API status:/ }),
    ).toBeVisible();
  });

  test('SHELL-5: mobile viewport shrinks the logo and keeps nav usable', async ({
    page,
  }) => {
    // Desktop: logo is 160px per the base .app-header__logo rule.
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/');
    const wideLogo = await page
      .locator('.app-header__logo')
      .evaluate((el) => getComputedStyle(el).width);
    expect(wideLogo).toBe('160px');

    // Below 576px, the @media query resizes it to 120px. `getComputedStyle`
    // reflects the CSS width, not the natural image size.
    await page.setViewportSize({ width: 500, height: 720 });
    const narrowLogo = await page
      .locator('.app-header__logo')
      .evaluate((el) => getComputedStyle(el).width);
    expect(narrowLogo).toBe('120px');

    // All nav links visible at the narrow breakpoint — the header
    // switches to flex-direction: column but everything stays usable.
    await expect(page.locator(SEL.navLink)).toHaveCount(5);

    // And clicking still navigates.
    await navLink(page, 'Queues').click();
    await expect(page).toHaveURL(/\/queues$/);
  });
});
