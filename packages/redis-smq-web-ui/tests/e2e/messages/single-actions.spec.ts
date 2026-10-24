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

function messagesUrl(q: { ns: string; name: string }): string {
  return `/ns/${q.ns}/queues/${q.name}/messages`;
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
