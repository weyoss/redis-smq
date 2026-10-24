/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '../fixtures/index.js';
import type { Locator } from '@playwright/test';
import { SEL } from '../helpers/selectors.js';

function messagesUrl(q: { ns: string; name: string }, query = ''): string {
  return `/ns/${q.ns}/queues/${q.name}/messages${query}`;
}

/**
 * Locate the `<dd>` value next to a labelled `<dt>` inside `.vm-grid`.
 * CSS adjacent-sibling combinator — `dt:text-is("Label") + dd` — rather
 * than `getByRole('term', …)` + XPath. Playwright's computed-role pass
 * does not assign the `term` role to `<dt>` elements wrapped in a `<div>`
 * inside the `<dl>` (exactly how `.vm-grid` is structured).
 */
function metricValue(scope: Locator, label: string): Locator {
  return scope.locator(`dt:text-is("${label}") + dd`);
}

/**
 * Read the full ID from a message row's `.msg-row__id` element via its
 * `title` attribute. The visible text is CSS-truncated with `ellipsis`
 * when the viewport is narrow; `title` always carries the full value.
 */
async function readRowId(row: Locator): Promise<string> {
  const title = await row.locator('.msg-row__id').getAttribute('title');
  if (!title) throw new Error('msg-row__id has no title attribute');
  return title.trim();
}

test.describe('Messages — single-item actions', () => {
  test('MSGACT-1: delete message from row icon', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    // Published tab = all 5 fixture messages (3 pending + 2 scheduled).
    await expect(page.locator(SEL.msgRow)).toHaveCount(5);

    const firstRow = page.locator(SEL.msgRow).first();
    await firstRow.hover();
    await firstRow.getByRole('button', { name: 'Delete message' }).click();

    const modal = page.locator(SEL.modal);
    await expect(modal).toContainText('Delete message');
    await modal.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(page.locator(SEL.msgRow)).toHaveCount(4);
  });

  test('MSGACT-2: delete from detail modal closes modal and refreshes list', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await expect(page.locator(SEL.msgRow)).toHaveCount(5);

    // Open detail modal by clicking the row.
    await page.locator(SEL.msgRow).first().click();
    await expect(page.locator(SEL.modal)).toBeVisible();

    // Confirm delete from within the detail modal.
    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Delete', exact: true })
      .click();

    // Nested confirmation modal — confirm.
    await page
      .locator(SEL.modal)
      .last()
      .getByRole('button', { name: 'Delete', exact: true })
      .click();

    // Detail modal closes, list refreshes to 4 rows.
    await expect(page.locator(SEL.msgRow)).toHaveCount(4);
    await expect(page.locator(SEL.modal)).toHaveCount(0);
  });

  test('MSGACT-3: requeue dead-lettered message from the row', async ({
    page,
    queueWithDeadLettered,
  }) => {
    const [id] = queueWithDeadLettered.deadLetteredIds;

    await page.goto(messagesUrl(queueWithDeadLettered, '?type=dead-lettered'));

    const originalRow = page.locator(SEL.msgRow).filter({ hasText: id });
    await expect(originalRow).toBeVisible({ timeout: 10_000 });
    await expect(originalRow).toContainText('Dead-lettered');

    // Baseline requeue count on the original is 0.
    await originalRow.click();
    const modal = page.locator(SEL.modal);
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Message details');
    await expect(metricValue(modal, 'Requeue count')).toHaveText('0');
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();

    // Row-level requeue.
    await originalRow.hover();
    await originalRow.getByRole('button', { name: 'Requeue message' }).click();
    const confirmModal = page.locator(SEL.modal);
    await expect(confirmModal.locator(SEL.modalTitle)).toHaveText(
      'Requeue message',
    );

    const [req] = await Promise.all([
      page.waitForRequest(
        (r) =>
          r.method() === 'POST' &&
          new RegExp(`/api/messages/${id}$`).test(new URL(r.url()).pathname),
      ),
      confirmModal
        .getByRole('button', { name: 'Requeue', exact: true })
        .click(),
    ]);
    expect(req.method()).toBe('POST');
    await expect(page.locator(SEL.modal)).toHaveCount(0);

    // The original STAYS in the Dead-lettered tab. redis-smq's requeue
    // creates a NEW message; it does not move the original out of DLQ.
    await expect(originalRow).toBeVisible({ timeout: 10_000 });

    // Counter incremented — proves the server persisted the requeue.
    await originalRow.click();
    await expect(
      metricValue(page.locator(SEL.modal), 'Requeue count'),
    ).toHaveText('1', { timeout: 10_000 });
    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();

    // A NEW message is now Pending (first visit to this tab on this
    // queue, so the fetch is fresh — no stale-cache interference).
    await page.getByRole('tab', { name: 'Pending', exact: true }).click();
    await expect(page.locator(SEL.msgRow)).toHaveCount(1, { timeout: 10_000 });

    const newRow = page.locator(SEL.msgRow).first();
    const newId = await readRowId(newRow);
    expect(newId).not.toBe(id);

    // The new message's `requeuedMessageParentId` links back to the
    // original — verifies the correlation field was set (documented
    // behavior; visible in the Scheduling tab).
    await newRow.click();
    const newModal = page.locator(SEL.modal);
    await expect(newModal.locator(SEL.modalTitle)).toHaveText(
      'Message details',
    );
    await newModal
      .getByRole('tab', { name: 'Scheduling', exact: true })
      .click();
    await expect(metricValue(newModal, 'Requeued parent')).toHaveText(id);
  });

  test('MSGACT-3b: requeue dead-lettered message from the detail modal', async ({
    page,
    queueWithDeadLettered,
  }) => {
    const [id] = queueWithDeadLettered.deadLetteredIds;

    await page.goto(messagesUrl(queueWithDeadLettered, '?type=dead-lettered'));

    const originalRow = page.locator(SEL.msgRow).filter({ hasText: id });
    await expect(originalRow).toBeVisible({ timeout: 10_000 });
    await originalRow.click();

    const modal = page.locator(SEL.modal);
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Message details');
    await expect(metricValue(modal, 'Requeue count')).toHaveText('0');

    // Open the requeue confirmation and confirm.
    await modal.getByRole('button', { name: 'Requeue', exact: true }).click();
    const confirmModal = page.locator(SEL.modal).last();

    const [req] = await Promise.all([
      page.waitForRequest(
        (r) =>
          r.method() === 'POST' &&
          new RegExp(`/api/messages/${id}$`).test(new URL(r.url()).pathname),
      ),
      confirmModal
        .getByRole('button', { name: 'Requeue', exact: true })
        .click(),
    ]);
    expect(req.method()).toBe('POST');

    // Flash + counter increment prove the mutation persisted.
    await expect(modal.locator(SEL.vmFooterFlash)).toContainText(
      'Message requeued',
      { timeout: 10_000 },
    );
    await expect(metricValue(modal, 'Requeue count')).toHaveText('1', {
      timeout: 10_000,
    });

    // The Requeue button stays visible — the original is still
    // DEAD_LETTERED (redis-smq creates a new message; the original
    // stays and can be requeued again).
    await expect(
      modal.getByRole('button', { name: 'Requeue', exact: true }),
    ).toBeVisible();

    // Close — original row still in the Dead-lettered tab.
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();
    await expect(originalRow).toBeVisible();

    // A NEW message is Pending (fresh fetch — Pending tab was not
    // visited on this queue before this test).
    await page.getByRole('tab', { name: 'Pending', exact: true }).click();
    await expect(page.locator(SEL.msgRow)).toHaveCount(1, { timeout: 10_000 });

    const newRow = page.locator(SEL.msgRow).first();
    const newId = await readRowId(newRow);
    expect(newId).not.toBe(id);

    // Back-reference to the original.
    await newRow.click();
    const newModal = page.locator(SEL.modal);
    await newModal
      .getByRole('tab', { name: 'Scheduling', exact: true })
      .click();
    await expect(metricValue(newModal, 'Requeued parent')).toHaveText(id);
  });

  test('MSGACT-4: requeue acknowledged message from the row', async ({
    page,
    queueWithAcknowledged,
  }) => {
    // redis-smq allows requeue from ACKNOWLEDGED as well as
    // DEAD_LETTERED — same semantics: a NEW message is produced; the
    // original stays put with its requeue counter incremented. This
    // test covers the ACKNOWLEDGED variant, exercising the
    // `canRequeue` extension in MessageListItem / ViewMessageModal.
    const [id] = queueWithAcknowledged.acknowledgedIds;

    await page.goto(messagesUrl(queueWithAcknowledged, '?type=acknowledged'));

    const originalRow = page.locator(SEL.msgRow).filter({ hasText: id });
    await expect(originalRow).toBeVisible({ timeout: 10_000 });
    await expect(originalRow).toContainText('Acknowledged');

    // The row exposes Requeue for ACKNOWLEDGED — this is the per-
    // message check, not per-tab, so it should work here exactly as on
    // the Dead-lettered tab.
    await originalRow.hover();
    await expect(
      originalRow.getByRole('button', { name: 'Requeue message' }),
    ).toBeVisible();

    // Baseline requeue count.
    await originalRow.click();
    const modal = page.locator(SEL.modal);
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Message details');
    await expect(metricValue(modal, 'Requeue count')).toHaveText('0');
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();

    // Row-level requeue.
    await originalRow.hover();
    await originalRow.getByRole('button', { name: 'Requeue message' }).click();
    const confirmModal = page.locator(SEL.modal);
    await expect(confirmModal.locator(SEL.modalTitle)).toHaveText(
      'Requeue message',
    );

    const [req] = await Promise.all([
      page.waitForRequest(
        (r) =>
          r.method() === 'POST' &&
          new RegExp(`/api/messages/${id}$`).test(new URL(r.url()).pathname),
      ),
      confirmModal
        .getByRole('button', { name: 'Requeue', exact: true })
        .click(),
    ]);
    expect(req.method()).toBe('POST');
    await expect(page.locator(SEL.modal)).toHaveCount(0);

    // Original stays in the Acknowledged tab.
    await expect(originalRow).toBeVisible({ timeout: 10_000 });

    // Counter incremented.
    await originalRow.click();
    await expect(
      metricValue(page.locator(SEL.modal), 'Requeue count'),
    ).toHaveText('1', { timeout: 10_000 });
    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();

    // New message appears in Pending.
    await page.getByRole('tab', { name: 'Pending', exact: true }).click();
    await expect(page.locator(SEL.msgRow)).toHaveCount(1, { timeout: 10_000 });

    const newRow = page.locator(SEL.msgRow).first();
    const newId = await readRowId(newRow);
    expect(newId).not.toBe(id);

    // Back-reference to the original.
    await newRow.click();
    const newModal = page.locator(SEL.modal);
    await expect(newModal.locator(SEL.modalTitle)).toHaveText(
      'Message details',
    );
    await newModal
      .getByRole('tab', { name: 'Scheduling', exact: true })
      .click();
    await expect(metricValue(newModal, 'Requeued parent')).toHaveText(id);
  });

  test('MSGACT-4b: requeue acknowledged message from the detail modal', async ({
    page,
    queueWithAcknowledged,
  }) => {
    const [id] = queueWithAcknowledged.acknowledgedIds;

    await page.goto(messagesUrl(queueWithAcknowledged, '?type=acknowledged'));

    const originalRow = page.locator(SEL.msgRow).filter({ hasText: id });
    await expect(originalRow).toBeVisible({ timeout: 10_000 });
    await originalRow.click();

    const modal = page.locator(SEL.modal);
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Message details');
    await expect(metricValue(modal, 'Requeue count')).toHaveText('0');

    // The Requeue button is visible for ACKNOWLEDGED messages.
    await modal.getByRole('button', { name: 'Requeue', exact: true }).click();
    const confirmModal = page.locator(SEL.modal).last();

    const [req] = await Promise.all([
      page.waitForRequest(
        (r) =>
          r.method() === 'POST' &&
          new RegExp(`/api/messages/${id}$`).test(new URL(r.url()).pathname),
      ),
      confirmModal
        .getByRole('button', { name: 'Requeue', exact: true })
        .click(),
    ]);
    expect(req.method()).toBe('POST');

    // Flash + counter increment prove the mutation persisted.
    await expect(modal.locator(SEL.vmFooterFlash)).toContainText(
      'Message requeued',
      { timeout: 10_000 },
    );
    await expect(metricValue(modal, 'Requeue count')).toHaveText('1', {
      timeout: 10_000,
    });

    // The Requeue button stays visible — the original is still
    // ACKNOWLEDGED (redis-smq creates a new message; the original
    // stays and can be requeued again).
    await expect(
      modal.getByRole('button', { name: 'Requeue', exact: true }),
    ).toBeVisible();

    // Close — original row still in the Acknowledged tab.
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();
    await expect(originalRow).toBeVisible();

    // A NEW message is Pending (fresh fetch — Pending tab was not
    // visited on this queue before this test).
    await page.getByRole('tab', { name: 'Pending', exact: true }).click();
    await expect(page.locator(SEL.msgRow)).toHaveCount(1, { timeout: 10_000 });

    const newRow = page.locator(SEL.msgRow).first();
    const newId = await readRowId(newRow);
    expect(newId).not.toBe(id);

    // Back-reference to the original.
    await newRow.click();
    const newModal = page.locator(SEL.modal);
    await newModal
      .getByRole('tab', { name: 'Scheduling', exact: true })
      .click();
    await expect(metricValue(newModal, 'Requeued parent')).toHaveText(id);
  });

  test('MSGACT-6: delete cancel leaves the row intact', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await expect(page.locator(SEL.msgRow)).toHaveCount(5);

    const firstRow = page.locator(SEL.msgRow).first();
    await firstRow.hover();
    await firstRow.getByRole('button', { name: 'Delete message' }).click();

    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();

    await expect(page.locator(SEL.modal)).toHaveCount(0);
    await expect(page.locator(SEL.msgRow)).toHaveCount(5);
  });
});
