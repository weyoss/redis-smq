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

test.describe('Queue detail — mutations', () => {
  test('QMUT-1: pause active queue shows banner and swaps actions', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    // Active state: Pause + Stop present, Resume absent.
    await expect(
      page.getByRole('button', { name: 'Pause', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Stop', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Resume', exact: true }),
    ).toHaveCount(0);
    await expect(page.locator(SEL.stateBanner)).toHaveCount(0);

    await queueDetailPage.pause();

    await expect(page.locator(SEL.stateBanner)).toBeVisible();
    await expect(page.locator(SEL.stateBanner)).toContainText(
      'Queue is paused',
    );
    await expect(page.locator(SEL.stateBannerWarning)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Resume', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pause', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Stop', exact: true }),
    ).toHaveCount(0);
  });

  test('QMUT-2: resume clears banner and restores actions', async ({
    page,
    api,
    queue,
    queueDetailPage,
  }) => {
    // Pre-pause via API — pausing through the UI is QMUT-1's job.
    await api.pauseQueue(queue);

    await queueDetailPage.goto(queue);
    await expect(page.locator(SEL.stateBanner)).toBeVisible();

    await queueDetailPage.resume();

    await expect(page.locator(SEL.stateBanner)).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Pause', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Stop', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Resume', exact: true }),
    ).toHaveCount(0);
  });

  test('QMUT-3: stop active queue shows danger banner', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    await queueDetailPage.stop();

    await expect(page.locator(SEL.stateBanner)).toBeVisible();
    await expect(page.locator(SEL.stateBanner)).toContainText(
      'Queue is stopped',
    );
    await expect(page.locator(SEL.stateBannerDanger)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Resume', exact: true }),
    ).toBeVisible();
  });

  test('QMUT-4: delete queue from detail page redirects to /queues', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);
    await queueDetailPage.delete();

    await expect(page).toHaveURL(/\/queues$/);
    const row = page.locator('.queue-row').filter({ hasText: queue.name });
    await expect(row).toHaveCount(0);
  });

  test('QMUT-5: delete cancel keeps the queue', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    await page.getByRole('button', { name: 'Delete', exact: true }).click();
    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();

    await expect(page.locator(SEL.modal)).toHaveCount(0);
    await expect(page.locator('h1')).toContainText(queue.name);
  });

  test('QMUT-6: pause with reason and description persists on banner', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    await queueDetailPage.pause({
      reason: 'Emergency',
      description: 'deploying v2.1',
    });

    const banner = page.locator(SEL.stateBanner);
    await expect(banner).toContainText('Emergency');
    await expect(banner).toContainText('deploying v2.1');
  });

  test('QMUT-7: second pause shows its own reason, not a cached one', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    // First pause — Manual.
    await queueDetailPage.pause({
      reason: 'Manual',
      description: 'first pause',
    });
    await expect(page.locator(SEL.stateBanner)).toContainText('Manual');
    await expect(page.locator(SEL.stateBanner)).toContainText('first pause');

    // Resume — banner disappears.
    await queueDetailPage.resume();
    await expect(page.locator(SEL.stateBanner)).toHaveCount(0);

    // Second pause — Emergency. Banner must reflect the new transition.
    await queueDetailPage.pause({
      reason: 'Emergency',
      description: 'second pause',
    });
    const banner = page.locator(SEL.stateBanner);
    await expect(banner).toContainText('Emergency');
    await expect(banner).toContainText('second pause');
    await expect(banner).not.toContainText('first pause');
  });

  test('QMUT-8: set rate limit via UI updates the card', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);

    const rateCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', { name: 'Rate limiting', exact: true }),
    });

    await rateCard.getByRole('button', { name: 'Set', exact: true }).click();
    await rateCard.locator('input#rate-limit').fill('100');
    await rateCard.locator('input#rate-interval').fill('1000');
    await rateCard.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(rateCard).toContainText('100');
    await expect(rateCard).toContainText('1000ms');
  });

  test('QMUT-9: clear rate limit resets the card', async ({
    page,
    api,
    queue,
    queueDetailPage,
  }) => {
    // Pre-set via API — the clear UI is what this test covers.
    await api.setRateLimit(queue, { limit: 50, interval: 1000 });

    await queueDetailPage.goto(queue);
    const rateCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', { name: 'Rate limiting', exact: true }),
    });

    await rateCard.getByRole('button', { name: 'Clear', exact: true }).click();
    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Clear rate limit', exact: true })
      .click();

    await expect(rateCard).toContainText('No rate limit configured');
  });

  test('QMUT-10: create consumer group on pub/sub queue appears in card', async ({
    page,
    pubSubQueue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(pubSubQueue);

    const cgCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', {
        name: 'Consumer groups',
        exact: true,
      }),
    });

    await cgCard.getByRole('button', { name: 'Create', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('input#group-name').fill('alpha-group');
    await modal.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(cgCard).toContainText('alpha-group');
  });

  test('QMUT-11: delete consumer group removes it', async ({
    page,
    api,
    pubSubQueue,
    queueDetailPage,
  }) => {
    // Pre-create via API — the delete UI is what this test covers.
    await api.createConsumerGroup(pubSubQueue, 'to-delete');

    await queueDetailPage.goto(pubSubQueue);

    const cgCard = page.locator(SEL.card).filter({
      has: page.getByRole('heading', {
        name: 'Consumer groups',
        exact: true,
      }),
    });

    const groupRow = cgCard
      .locator('.group-list__row')
      .filter({ hasText: 'to-delete' });
    await groupRow.getByRole('button', { name: 'Delete group' }).click();

    // Both the row button and the modal confirm button have the
    // accessible name "Delete group" — .last() picks the modal's.
    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Delete group', exact: true })
      .last()
      .click();

    await expect(cgCard).not.toContainText('to-delete');
  });

  test('QMUT-12: point-to-point queue shows "not supported" and no create button', async ({
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
    await expect(
      cgCard.getByRole('button', { name: 'Create', exact: true }),
    ).toHaveCount(0);
  });

  test('QMUT-13: delete non-empty queue surfaces server error', async ({
    page,
    queueWithMessages,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queueWithMessages);

    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal
      .getByRole('button', { name: 'Delete queue', exact: true })
      .last()
      .click();

    await expectInlineError(page, /QueueNotEmptyError/);
    await expect(modal).toBeVisible();
    await expectNoObjectObjectInErrors(page);
  });

  test('QMUT-14: pause is not available while paused', async ({
    page,
    queue,
    queueDetailPage,
  }) => {
    await queueDetailPage.goto(queue);
    await queueDetailPage.pause();

    await expect(page.locator(SEL.stateBanner)).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Pause', exact: true }),
    ).toHaveCount(0);
  });
});
