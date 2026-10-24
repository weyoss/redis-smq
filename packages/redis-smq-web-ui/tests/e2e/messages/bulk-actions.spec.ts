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
  expectRequest,
  getQueryValues,
  hasQueryKey,
} from '../helpers/network.js';

function messagesUrl(q: { ns: string; name: string }): string {
  return `/ns/${q.ns}/queues/${q.name}/messages`;
}

/** Role-based checkbox locator — the checkbox is a sibling of the row
 *  article, so ancestor-scoping through `.msg-row` never matches.
 *  `aria-label` is `Select message <uuid>`; anchored regex prevents
 *  matching unrelated checkboxes if the toolbar adds more. */
function msgCheckboxes(page: import('@playwright/test').Page) {
  return page.getByRole('checkbox', { name: /^Select message/ });
}

test.describe('Messages — bulk actions', () => {
  test('BULK-1: selecting one row shows bulk toolbar with count', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    // Fixture seeds 5 messages (3 pending + 2 scheduled). The Published
    // tab uses `status=published` = "all messages regardless of state",
    // so all 5 are visible here.
    await expect(page.locator(SEL.msgRow)).toHaveCount(5);
    await expect(page.locator(SEL.bulkBar)).toHaveCount(0);

    await msgCheckboxes(page).first().check();

    await expect(page.locator(SEL.bulkBar)).toBeVisible();
    await expect(page.locator(SEL.bulkCount)).toHaveText('1 selected');
  });

  test('BULK-2: master checkbox selects all visible rows', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    // Trigger the toolbar by selecting one row.
    await msgCheckboxes(page).first().check();
    await expect(page.locator(SEL.bulkBar)).toBeVisible();

    // Dynamic count so the test doesn't hard-code the fixture size.
    const total = await page.locator(SEL.msgRow).count();
    expect(total).toBeGreaterThan(1);

    await page.locator(SEL.bulkMaster).click();
    await expect(page.locator(SEL.bulkCount)).toHaveText(`${total} selected`);
    await expect(page.locator(SEL.msgRowSelected)).toHaveCount(total);

    // Toggling off clears the selection.
    await page.locator(SEL.bulkMaster).click();
    await expect(page.locator(SEL.bulkBar)).toHaveCount(0);
  });

  test('BULK-4: clicking row body opens detail, does not toggle selection', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    await msgCheckboxes(page).first().check();
    await expect(page.locator(SEL.bulkCount)).toHaveText('1 selected');

    // Click a different row's body.
    await page.locator(SEL.msgRow).nth(1).locator(SEL.msgRowBody).click();

    await expect(page.locator(SEL.modal)).toBeVisible();

    // Close it; selection is unchanged. `.last()` disambiguates the
    // footer Close from the header X icon (both have name "Close").
    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();
    await expect(page.locator(SEL.bulkCount)).toHaveText('1 selected');
  });

  test('BULK-5: clicking row action does not toggle selection or open detail', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    await msgCheckboxes(page).first().check();
    await expect(page.locator(SEL.bulkCount)).toHaveText('1 selected');

    // Click delete on a different row — should open the delete
    // confirmation, not the detail modal; selection stays at 1.
    const secondRow = page.locator(SEL.msgRow).nth(1);
    await secondRow.hover();
    await secondRow.getByRole('button', { name: 'Delete message' }).click();

    const modal = page.locator(SEL.modal);
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Delete message');

    await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(page.locator(SEL.bulkCount)).toHaveText('1 selected');
  });

  test('BULK-6: bulk delete removes selected rows', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    // Wait for the initial list to render before counting — otherwise
    // count() returns 0 and `total - 2` is negative.
    await expect(page.locator(SEL.msgRow)).toHaveCount(5);
    const total = await page.locator(SEL.msgRow).count();

    const cbs = msgCheckboxes(page);
    await cbs.nth(0).check();
    await cbs.nth(1).check();
    await expect(page.locator(SEL.bulkCount)).toHaveText('2 selected');

    await page.getByRole('button', { name: 'Delete selected' }).click();

    await page
      .locator(SEL.modal)
      .getByRole('button', { name: 'Delete selected', exact: true })
      .click();

    await expect(page.locator(SEL.msgRow)).toHaveCount(total - 2);
    await expect(page.locator(SEL.bulkBar)).toHaveCount(0);
  });

  test('BULK-7: changing page clears selection', async ({
    page,
    api,
    queue,
  }) => {
    // Seed 25 published messages — 2 pages at 20 per page.
    for (let i = 0; i < 25; i++) {
      await api.publishMessage({
        exchange: { queue },
        message: { body: { i } },
      });
    }

    await page.goto(messagesUrl(queue));
    await msgCheckboxes(page).first().check();
    await expect(page.locator(SEL.bulkCount)).toHaveText('1 selected');

    await page.getByRole('button', { name: 'Next page' }).click();

    await expect(page.locator(SEL.bulkBar)).toHaveCount(0);
    await expect(page.locator(SEL.msgRowSelected)).toHaveCount(0);
  });

  test('BULK-8: changing tab clears selection', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    await msgCheckboxes(page).first().check();
    await expect(page.locator(SEL.bulkBar)).toBeVisible();

    await page.getByRole('tab', { name: 'Scheduled', exact: true }).click();

    await expect(page.locator(SEL.bulkBar)).toHaveCount(0);
  });

  test('BULK-9: ids array serialized as repeated ids=, not ids[]=', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    // Select 3 explicitly — the assertion is about the serialization
    // shape, not the number of messages the fixture happens to create.
    const cbs = msgCheckboxes(page);
    await cbs.nth(0).check();
    await cbs.nth(1).check();
    await cbs.nth(2).check();
    await expect(page.locator(SEL.bulkCount)).toHaveText('3 selected');

    await page.getByRole('button', { name: 'Delete selected' }).click();

    const [req] = await Promise.all([
      expectRequest(page, { method: 'DELETE', pathIncludes: '/api/messages' }),
      page
        .locator(SEL.modal)
        .getByRole('button', { name: 'Delete selected', exact: true })
        .click(),
    ]);

    expect(hasQueryKey(req, 'ids[]')).toBe(false);
    const ids = getQueryValues(req, 'ids');
    expect(ids).toHaveLength(3);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });
});
