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

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

test.describe('Home view', () => {
  test('HOME-1: page shell, hero, stats, and quick actions render', async ({
    page,
  }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Home');

    // Hero strip
    await expect(page.locator(SEL.hero)).toBeVisible();
    await expect(page.locator(SEL.heroTitle)).toHaveText('Welcome to RedisSMQ');
    await expect(page.locator(SEL.heroSubtitle)).toContainText(
      'Powerful Redis-based message queue management',
    );

    // Aggregate stats — three tiles, exact order per HomeView's stats
    // computed. Assert order because the UI intent is stable even as
    // the numbers change.
    await expect(page.locator(SEL.statCard)).toHaveCount(3);
    const labels = await page.locator(SEL.statCardLabel).allTextContents();
    expect(labels).toEqual(['Queues', 'Exchanges', 'Namespaces']);

    // Quick actions card — four tiles.
    await expect(page.locator(SEL.quickTile)).toHaveCount(4);
    const titles = await page.locator(SEL.quickTileTitle).allTextContents();
    expect(titles).toEqual([
      'Create queue',
      'Set up exchange',
      'View queues',
      'Documentation',
    ]);
  });

  test('HOME-2: recent queues card shows when queues exist, links work', async ({
    page,
  }) => {
    // `queue` guarantees hasQueues = true — the getting-started card
    // would otherwise render on a truly empty API. It does NOT guarantee
    // the fixture queue appears in the top-8 recent list, because
    // recentQueues = sortedQueues.slice(0, 8) and prior tests leave
    // `psg-*` queues behind in the `test` namespace that sort before
    // `q-home-2-*` alphabetically.
    await page.goto('/');

    const recentCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', { name: 'Recent queues', exact: true }),
    });
    await expect(recentCard).toBeVisible({ timeout: 10_000 });

    // Verify the card renders at least one link and clicking it
    // navigates to a valid queue-detail URL. Which queue it points at
    // is not load-bearing — the assertion is about the wiring, not
    // which specific queue happens to be in the top 8.
    const firstLink = recentCard.locator(SEL.recentLink).first();
    await expect(firstLink).toBeVisible({ timeout: 10_000 });

    await firstLink.click();
    await expect(page).toHaveURL(/\/ns\/[^/]+\/queues\/[^/]+$/);
    // PageShell renders the queue heading regardless of load/error
    // state — this confirms we landed on a queue detail route.
    await expect(page.locator('h1')).toContainText('Queue: ');
  });

  test('HOME-3: getting started card shows when no queues exist', async ({
    page,
    request,
    apiBaseUrl,
  }) => {
    // The queues list is global — this path is only reachable on a
    // fresh API. Skip with an explanatory message when queues exist,
    // rather than trying to delete them (racy with parallel tests).
    const res = await request.get(`${apiBaseUrl}/api/queues`);
    const body = (await res.json()) as { data: unknown[] };
    test.skip(
      body.data.length > 0,
      `Cannot reach empty state — ${body.data.length} queues exist in the shared API`,
    );

    await page.goto('/');

    // Getting-started card visible with the four steps and actions.
    await expect(page.locator(SEL.gettingStarted)).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator(SEL.gettingStartedItem)).toHaveCount(4);
    await expect(page.locator(SEL.gettingStartedActions)).toContainText(
      'Create your first queue',
    );
    await expect(page.locator(SEL.gettingStartedActions)).toContainText(
      'Read documentation',
    );

    // Hero CTA says "Get started" (not "Create queue") when the empty
    // state is active.
    await expect(page.locator(SEL.heroCta)).toContainText('Get started');
  });

  test('HOME-4: hero CTA opens Create queue modal', async ({ page }) => {
    await page.goto('/');

    await page.locator(SEL.heroCta).click();

    const modal = page.locator(SEL.modal);
    await expect(modal).toBeVisible();
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Create queue');
  });

  test('HOME-5: quick action "Create queue" opens the same modal', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .locator(SEL.quickTile)
      .filter({ hasText: 'Create queue' })
      .click();

    const modal = page.locator(SEL.modal);
    await expect(modal).toBeVisible();
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Create queue');
  });

  test('HOME-6: quick action "View queues" navigates to /queues', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .locator(SEL.quickTile)
      .filter({ hasText: 'View queues' })
      .click();

    await expect(page).toHaveURL(/\/queues$/);
  });

  test('HOME-7: quick action "Set up exchange" navigates to /exchanges', async ({
    page,
  }) => {
    await page.goto('/');

    await page
      .locator(SEL.quickTile)
      .filter({ hasText: 'Set up exchange' })
      .click();

    await expect(page).toHaveURL(/\/exchanges$/);
  });

  test('HOME-8: creating a queue from the hero CTA navigates to detail', async ({
    page,
    api,
  }) => {
    const suffix = uniqueSuffix();
    const ns = `home-ns-${suffix}`;
    const name = `home-q-${suffix}`;

    try {
      await page.goto('/');
      await page.locator(SEL.heroCta).click();

      const modal = page.locator(SEL.modal);
      await modal.locator('input#new-queue-name').fill(name);
      await modal.locator('input#new-queue-ns').fill(ns);
      await modal
        .getByRole('button', { name: 'Create queue', exact: true })
        .last()
        .click();

      // onCreated in HomeView refetches queues/exchanges/namespaces and
      // navigates to the new queue's detail page.
      await expect(page).toHaveURL(new RegExp(`/ns/${ns}/queues/${name}$`));
      await expect(page.locator('h1')).toContainText(`Queue: ${name}@${ns}`);
    } finally {
      await api.deleteQueue({ ns, name }).catch(() => {});
    }
  });

  test('HOME-9: Refresh refetches queues, exchanges, and namespaces', async ({
    page,
  }) => {
    await page.goto('/');

    // Wait for the initial queries to settle so the counts we compare
    // against aren't transient zeroes.
    await expect(page.locator(SEL.statCard)).toHaveCount(3);
    await page.locator(SEL.statCardValue).first().waitFor();

    // Refresh issues all three GETs in parallel. Assert on the network
    // requests rather than on count changes — the counts themselves
    // depend on what other queues/exchanges exist in the shared API and
    // would flake under parallel workers.
    await Promise.all([
      page.waitForRequest(
        (r) => r.method() === 'GET' && r.url().endsWith('/api/queues'),
        { timeout: 10_000 },
      ),
      page.waitForRequest(
        (r) => r.method() === 'GET' && r.url().endsWith('/api/exchanges'),
        { timeout: 10_000 },
      ),
      page.waitForRequest(
        (r) => r.method() === 'GET' && r.url().endsWith('/api/namespaces'),
        { timeout: 10_000 },
      ),
      page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Refresh' })
        .click(),
    ]);
  });
});
