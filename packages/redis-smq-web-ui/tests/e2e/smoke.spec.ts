/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@playwright/test';

test.describe('shell', () => {
  test('home renders with header and nav', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-header')).toBeVisible();
    await expect(page.locator('.app-footer')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Home');
  });

  test('queues renders', async ({ page }) => {
    await page.goto('/queues');
    await expect(page.locator('h1')).toContainText('Queues');
  });

  test('exchanges renders', async ({ page }) => {
    await page.goto('/exchanges');
    await expect(page.locator('h1')).toContainText('Exchanges');
  });

  test('namespaces renders', async ({ page }) => {
    await page.goto('/ns');
    await expect(page.locator('h1')).toContainText('Namespaces');
  });

  test('configuration renders', async ({ page }) => {
    await page.goto('/config');
    await expect(page.locator('h1')).toContainText('Configuration');
  });
});

test.describe('routing', () => {
  test('nav links navigate', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Queues', exact: true })
      .click();
    await expect(page).toHaveURL(/\/queues$/);
    await expect(page.locator('h1')).toContainText('Queues');
  });

  test('404 renders without chrome', async ({ page }) => {
    await page.goto('/does-not-exist');
    await expect(page.locator('h1')).toContainText('404');
    await expect(page.locator('.app-header')).toHaveCount(0);
    await expect(page.locator('.app-footer')).toHaveCount(0);
  });
});
