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
import { expectRequest } from '../helpers/network.js';
import { MESSAGE_STATUS } from '../helpers/constants.js';

function messagesUrl(q: { ns: string; name: string }): string {
  return `/ns/${q.ns}/queues/${q.name}/messages`;
}

test.describe('Messages — purge', () => {
  test('PURGE-1: modal opens from Published tab with "All messages" default', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.getByRole('button', { name: 'Purge', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Purge messages');
    await expect(modal.locator('#purge-scope')).toHaveValue(
      MESSAGE_STATUS.PUBLISHED,
    );
    // "All messages" implies the confirm checkbox must appear.
    await expect(modal.locator('#purge-confirm-all')).toBeVisible();
  });

  test('PURGE-2: "All messages" requires the acknowledgement checkbox', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.getByRole('button', { name: 'Purge', exact: true }).click();

    const modal = page.locator(SEL.modal);

    // The confirm button's name tracks the scope, so re-query after
    // changing scope instead of caching a locator from the initial state.
    await expect(
      modal.getByRole('button', {
        name: 'Purge all messages',
        exact: true,
      }),
    ).toBeDisabled();

    await modal.locator('#purge-confirm-all').check();
    await expect(
      modal.getByRole('button', {
        name: 'Purge all messages',
        exact: true,
      }),
    ).toBeEnabled();

    // Changing to a narrowed scope drops the checkbox requirement.
    await modal.locator('#purge-scope').selectOption({
      label: 'Scheduled messages',
    });
    await expect(modal.locator('#purge-confirm-all')).toHaveCount(0);
    await expect(
      modal.getByRole('button', {
        name: 'Purge scheduled',
        exact: true,
      }),
    ).toBeEnabled();
  });

  test('PURGE-3: trigger fires DELETE …/purge/published, returns jobId', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.getByRole('button', { name: 'Purge', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('#purge-confirm-all').check();

    const [req] = await Promise.all([
      expectRequest(page, { method: 'DELETE', pathIncludes: '/purge/' }),
      modal
        .getByRole('button', { name: 'Purge all messages', exact: true })
        .click(),
    ]);

    const url = new URL(req.url());
    expect(url.pathname).toMatch(/\/purge\/published$/);
    expect(url.pathname).not.toContain('/messages');
    expect(url.searchParams.has('status')).toBe(false);
  });

  test('PURGE-4: poll URL uses …/purge/published/{jobId}', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.getByRole('button', { name: 'Purge', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('#purge-confirm-all').check();

    const [pollReq] = await Promise.all([
      expectRequest(page, {
        method: 'GET',
        pathRegex: /\/purge\/published\/[A-Za-z0-9-]+$/,
      }),
      modal
        .getByRole('button', { name: 'Purge all messages', exact: true })
        .click(),
    ]);

    expect(new URL(pollReq.url()).pathname).not.toContain('/messages/purge');
  });

  test('PURGE-6: phase transitions to "Purge complete"', async ({
    page,
    api,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.getByRole('button', { name: 'Purge', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('#purge-confirm-all').check();
    await modal
      .getByRole('button', { name: 'Purge all messages', exact: true })
      .click();

    // Wait for the modal to reach the done phase — allow up to 10s for
    // the polling cycle.
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Purge complete', {
      timeout: 10_000,
    });

    // Messages are gone.
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();
    await expect(page.locator(SEL.stateEmpty).first()).toBeVisible();

    // The API agrees.
    const props = await api.getQueueProperties(queueWithMessages);
    expect((props as { messagesCount?: number }).messagesCount).toBe(0);
  });

  test('PURGE-8: narrowed scope only affects that status', async ({
    page,
    queueWithMessages,
  }) => {
    // Seed state: 3 published, 2 scheduled.
    await page.goto(messagesUrl(queueWithMessages));
    await page.getByRole('button', { name: 'Purge', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('#purge-scope').selectOption({
      label: 'Scheduled messages',
    });
    await modal
      .getByRole('button', { name: 'Purge scheduled', exact: true })
      .click();
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Purge complete', {
      timeout: 10_000,
    });
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();

    // Scheduled tab is empty.
    await page.getByRole('tab', { name: 'Scheduled', exact: true }).click();
    await expect(page.locator(SEL.stateEmpty).first()).toBeVisible();

    // Published tab still has its 3 rows.
    await page.getByRole('tab', { name: 'Published', exact: true }).click();
    await expect(page.locator(SEL.msgRow)).toHaveCount(3);
  });

  test('PURGE-9: group-scoped purge is sync (204) — no job tracking', async ({
    page,
    pubSubQueueWithGroup,
  }) => {
    // Navigate to pending-with-group.
    await page.goto(
      `/ns/${pubSubQueueWithGroup.ns}/queues/${pubSubQueueWithGroup.name}/messages` +
        `?type=pending&consumerGroupId=${pubSubQueueWithGroup.consumerGroupId}`,
    );

    await page.getByRole('button', { name: 'Purge', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await expect(modal.locator('#purge-scope')).toHaveCount(0);

    const [req] = await Promise.all([
      expectRequest(page, {
        method: 'DELETE',
        pathIncludes: '/consumer-groups/',
      }),
      modal
        .getByRole('button', { name: 'Purge group messages', exact: true })
        .click(),
    ]);

    // No `purge/{status}/{jobId}` follow-up — the response is 204 and
    // the modal jumps straight to the done phase.
    expect(new URL(req.url()).pathname).not.toContain('/purge/');
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Purge complete');
  });
});
