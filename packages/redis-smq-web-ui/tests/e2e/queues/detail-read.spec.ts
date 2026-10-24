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

test.describe('Queue detail — read-only cards', () => {
  test('QDETAIL-1: configuration card shows correct values', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    // Filter the card by its heading — resilient to other cards being
    // added or reordered. All cards use .ui-card with an h2 inside.
    const configCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', { name: 'Configuration', exact: true }),
    });

    await expect(configCard).toContainText(queue.name);
    await expect(configCard).toContainText(queue.ns);
    await expect(configCard).toContainText('FIFO');
    await expect(configCard).toContainText('Point-to-Point');
    await expect(configCard).toContainText('Active');
  });

  test('QDETAIL-2: stats tiles show correct counts', async ({
    page,
    queueWithMessages,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queueWithMessages);

    const statsCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', {
        name: 'Message statistics',
        exact: true,
      }),
    });

    const tiles = statsCard.locator(SEL.statCard);
    await expect(tiles).toHaveCount(4);

    const labels = await tiles.locator(SEL.statCardLabel).allTextContents();
    expect(labels).toEqual([
      'Pending',
      'Acknowledged',
      'Dead-lettered',
      'Scheduled',
    ]);

    // Scheduled count is deterministic: seedMessages uses
    // scheduledDelay: 60_000 so those 2 messages stay in the scheduled
    // bucket for the whole test. Published counts are environment-
    // dependent (they land in "pending" until a consumer processes them),
    // so only the scheduled count is asserted here.
    const scheduledTile = tiles.filter({ hasText: 'Scheduled' });
    await expect(scheduledTile.locator(SEL.statCardValue)).toHaveText('2');
  });

  test('QDETAIL-3: rate-limit card shows empty state when none set', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    const rateCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', { name: 'Rate limiting', exact: true }),
    });

    await expect(rateCard).toContainText('No rate limit configured');
  });

  test('QDETAIL-4: rate-limit card shows the value when set', async ({
    page,
    api,
    queue,
    queueDetailPage,
  }) => {
    // Pre-set via API — the set UI is what QMUT-8 exercises.
    await api.setRateLimit(queue, { limit: 42, interval: 1500 });

    await queueDetailPage.goto(queue);

    const rateCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', { name: 'Rate limiting', exact: true }),
    });

    await expect(rateCard).toContainText('42');
    await expect(rateCard).toContainText('1500ms');
  });

  test('QDETAIL-5: consumer groups card shows "not supported" for point-to-point', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    const cgCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', {
        name: 'Consumer groups',
        exact: true,
      }),
    });

    await expect(cgCard).toContainText(
      "Point-to-point queues don't use consumer groups",
    );
  });

  test('QDETAIL-6: consumer groups card lists groups on pub/sub queue', async ({
    page,
    pubSubQueueWithGroup,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(pubSubQueueWithGroup);

    const cgCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', {
        name: 'Consumer groups',
        exact: true,
      }),
    });

    await expect(cgCard).toContainText(pubSubQueueWithGroup.consumerGroupId);
  });

  test('QDETAIL-7: active consumers card shows zero chip when none connected', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    const consumerChip = page.locator(SEL.consumerCount).first();
    await expect(consumerChip).toContainText('0');
    await expect(consumerChip).toContainText('consumers');
  });

  test('QDETAIL-8: operational state history card renders without error', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    const historyCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', {
        name: 'Operational state history',
        exact: true,
      }),
    });

    await expect(historyCard).toBeVisible();
    // A fresh queue has zero or one transition (SYSTEM_INIT); both are
    // valid. Assert no error surfaced inside this specific card —
    // StateBlock uses .state-block--error, so this is precise.
    await expect(historyCard.locator(SEL.stateError)).toHaveCount(0);
  });

  test('QDETAIL-9: bound exchanges card is empty for an unbound queue', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    const exCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', {
        name: 'Bound exchanges',
        exact: true,
      }),
    });

    await expect(exCard).toContainText('Not bound to any exchange');
  });

  test('QDETAIL-10: unknown queue URL shows page error, no cards', async ({
    page,
  }) => {
    await page.goto(`/ns/test/queues/does-not-exist-${Date.now()}`);

    // PageShell does apply the --error modifier (unlike --empty /
    // --loading), so this selector is load-bearing here.
    await expect(page.locator(SEL.stateError)).toBeVisible();
    await expect(page.locator(SEL.stateError)).toContainText(
      /QueueNotFound|InvalidQueue/i,
    );
    await expect(page.locator(SEL.statCard)).toHaveCount(0);
  });
});
