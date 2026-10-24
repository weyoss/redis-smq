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
import {
  expectInlineError,
  expectNoObjectObjectInErrors,
} from '../helpers/errors.js';

test.describe('Queues list', () => {
  test('QUEUES-1: empty state renders and CTA opens create modal', async ({
    page,
  }) => {
    // No `queue` fixture — the empty state is the point.
    await page.goto('/queues');
    await expect(page.locator('h1')).toContainText('Queues');

    // The list is global (not namespace-scoped). Wait for the initial
    // fetch to settle before checking emptiness — the SPA hasn't
    // rendered anything yet at this point, so a bare count() would
    // return 0 whether or not queues exist.
    await page
      .locator(`${SEL.queueRow}, ${SEL.stateBlock}`)
      .first()
      .waitFor({ timeout: 5_000 });

    const rowCount = await page.locator(SEL.queueRow).count();
    test.skip(
      rowCount > 0,
      `Queue list is not empty — ${rowCount} leftover queue(s) from prior ` +
        `failed runs or parallel tests. The empty-state path is only ` +
        `reachable against a fresh API instance; the CTA it exercises is ` +
        `otherwise covered by QUEUES-2.`,
    );

    // Role-based: resilient to which component renders the state and to
    // any class rename. PageShell renders empty states with plain
    // .state-block; the heading is the meaningful signal.
    const emptyState = page
      .locator(SEL.stateBlock)
      .filter({ has: page.getByRole('heading', { name: 'No queues' }) });
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText(
      'Create your first queue to start producing and consuming messages.',
    );

    await emptyState.getByRole('button', { name: 'Create queue' }).click();

    await expect(page.locator(SEL.modal)).toBeVisible();
    await expect(page.locator(SEL.modalTitle)).toHaveText('Create queue');
  });

  test('QUEUES-2: create queue navigates to detail page', async ({
    page,
    api,
  }) => {
    // Unique per run — the previous hardcoded name ("demo-queue@demo-ns")
    // survives a failed run and makes the next attempt return
    // QueueAlreadyExistsError. Mirror the fixtures' uniqueness scheme.
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const queueName = `demo-queue-${suffix}`;
    const namespace = `demo-ns-${suffix}`;

    try {
      await page.goto('/queues');
      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Create queue' })
        .click();

      const modal = page.locator(SEL.modal);
      await modal.locator('input#new-queue-name').fill(queueName);
      await modal.locator('input#new-queue-ns').fill(namespace);
      await modal
        .getByRole('button', { name: 'Create queue', exact: true })
        .last()
        .click();

      await expect(page).toHaveURL(
        new RegExp(`/ns/${namespace}/queues/${queueName}$`),
      );
      await expect(page.locator('h1')).toContainText(
        `Queue: ${queueName}@${namespace}`,
      );
      await expect(page.locator(SEL.modal)).toHaveCount(0);
    } finally {
      await api.deleteQueue({ ns: namespace, name: queueName }).catch(() => {
        // Already gone (e.g. assertion threw before the click finished).
      });
    }
  });

  test('QUEUES-3: invalid name shows inline error, no request sent', async ({
    page,
  }) => {
    await page.goto('/queues');
    await page
      .locator(SEL.pageActions)
      .getByRole('button', { name: 'Create queue' })
      .click();

    const modal = page.locator(SEL.modal);
    await modal.locator('input#new-queue-name').fill('1starts-with-digit');
    await modal.locator('input#new-queue-ns').fill('test');

    // Guard: no create request should fire.
    let requestFired = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().endsWith('/api/queues')) {
        requestFired = true;
      }
    });

    await modal
      .getByRole('button', { name: 'Create queue', exact: true })
      .last()
      .click();

    await expect(
      modal.locator('.invalid-feedback, .field-error'),
    ).toBeVisible();
    await expect(modal).toBeVisible();
    expect(requestFired).toBe(false);
  });

  test('QUEUES-4: duplicate name shows server error inline', async ({
    page,
    queue,
  }) => {
    await page.goto('/queues');
    await page
      .locator(SEL.pageActions)
      .getByRole('button', { name: 'Create queue' })
      .click();

    const modal = page.locator(SEL.modal);
    await modal.locator('input#new-queue-name').fill(queue.name);
    await modal.locator('input#new-queue-ns').fill(queue.ns);
    await modal
      .getByRole('button', { name: 'Create queue', exact: true })
      .last()
      .click();

    await expectInlineError(page, /QueueAlreadyExistsError/);
    await expect(modal).toBeVisible();
    await expectNoObjectObjectInErrors(page);
  });

  test('QUEUES-5: row view icon navigates to detail', async ({
    page,
    queue,
  }) => {
    await page.goto('/queues');

    const row = page.locator('.queue-row').filter({ hasText: queue.name });
    await row.hover();
    await row.getByRole('button', { name: 'View queue' }).click();

    await expect(page).toHaveURL(
      new RegExp(`/ns/${queue.ns}/queues/${queue.name}$`),
    );
  });

  test('QUEUES-6: row delete removes the queue', async ({ page, queue }) => {
    await page.goto('/queues');

    const row = page.locator('.queue-row').filter({ hasText: queue.name });
    await expect(row).toBeVisible();

    await row.hover();
    await row.getByRole('button', { name: 'Delete queue' }).click();

    const modal = page.locator(SEL.modal);
    await modal
      .getByRole('button', { name: 'Delete queue', exact: true })
      .last()
      .click();

    await expect(row).toHaveCount(0);
  });

  test('QUEUES-7: delete cancel leaves the queue in the list', async ({
    page,
    queue,
  }) => {
    await page.goto('/queues');

    const row = page.locator('.queue-row').filter({ hasText: queue.name });
    await row.hover();
    await row.getByRole('button', { name: 'Delete queue' }).click();
    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Cancel' })
      .click();

    await expect(page.locator(SEL.modal)).toHaveCount(0);
    await expect(row).toBeVisible();
  });

  test('QUEUES-8: row actions hover on desktop, always visible on mobile', async ({
    page,
    queue,
  }) => {
    await page.goto('/queues');

    const row = page.locator(SEL.queueRow).filter({ hasText: queue.name });
    const actions = row.locator(SEL.queueRowActions);

    const opacity = () =>
      actions.evaluate((el) => getComputedStyle(el).opacity);

    // Desktop: hidden until hover. `expect.poll` tolerates the CSS
    // transition landing on intermediate values; it only requires that
    // the value eventually settles at '1'.
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect.poll(opacity, { timeout: 2000 }).toBe('0');
    await row.hover();
    await expect.poll(opacity, { timeout: 2000 }).toBe('1');

    // Mobile: always visible, no hover needed.
    await page.mouse.move(0, 0); // release hover before resizing
    await page.setViewportSize({ width: 500, height: 720 });
    await expect.poll(opacity, { timeout: 2000 }).toBe('1');
  });

  test('QUEUES-9: refresh refetches the list', async ({ page, api, queue }) => {
    await page.goto('/queues');

    const row = page.locator('.queue-row').filter({ hasText: queue.name });
    await expect(row).toBeVisible();

    // Delete the queue out from under the UI.
    await api.deleteQueue(queue);

    await page
      .locator(SEL.pageActions)
      .getByRole('button', { name: 'Refresh' })
      .click();

    await expect(row).toHaveCount(0);
  });

  test('QUEUES-10: list is sorted by namespace then name', async ({
    page,
    api,
  }) => {
    const prefix = `sort-${Date.now().toString(36)}-`;
    const queues = [
      { ns: 'test', name: `${prefix}c` },
      { ns: 'test', name: `${prefix}a` },
      { ns: 'test', name: `${prefix}b` },
    ];
    for (const q of queues) await api.createQueue(q);

    try {
      await page.goto('/queues');

      // Wait for our rows to appear. page.goto resolves before the SPA's
      // query settles; allTextContents doesn't retry.
      const ourRows = page
        .locator('.queue-row__name')
        .filter({ hasText: prefix });
      await expect(ourRows).toHaveCount(3, { timeout: 10_000 });

      const names = await ourRows.allTextContents();
      expect(names).toEqual([`${prefix}a`, `${prefix}b`, `${prefix}c`]);
    } finally {
      for (const q of queues) await api.deleteQueue(q).catch(() => {});
    }
  });
});
