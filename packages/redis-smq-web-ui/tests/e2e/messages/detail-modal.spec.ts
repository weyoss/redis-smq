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

test.describe('Messages — detail modal', () => {
  test('DETAIL-1: clicking a row opens the modal with the message ID', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    // Grab the ID displayed on the first row for later comparison.
    const idText = await page
      .locator(SEL.msgRow)
      .first()
      .locator('.msg-row__id')
      .textContent();

    await page.locator(SEL.msgRow).first().click();

    const modal = page.locator(SEL.modal);
    await expect(modal).toBeVisible();
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Message details');
    await expect(modal.locator(SEL.modalSubtitle)).toContainText(idText ?? '');
  });

  test('DETAIL-2: six tabs, Overview active by default', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.locator(SEL.msgRow).first().click();

    const tabs = page.locator(SEL.modal).getByRole('tab');
    await expect(tabs).toHaveCount(6);

    const names = await tabs.allTextContents();
    expect(names.map((n) => n.trim())).toEqual([
      'Overview',
      'Body',
      'State',
      'Scheduling',
      'Timeline',
      'Unack history',
    ]);

    await expect(
      page.locator(SEL.modal).getByRole('tab', { name: 'Overview' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('DETAIL-3: overview shows key fields', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.locator(SEL.msgRow).first().click();

    const modal = page.locator(SEL.modal);
    // The Overview grid is a <dl>; assert on label/value pairs.
    await expect(modal).toContainText('ID');
    await expect(modal).toContainText('Status');
    await expect(modal).toContainText('Priority');
    await expect(modal).toContainText('TTL');
    await expect(modal).toContainText('Retry threshold');

    // The destination queue rendered in the status bar.
    await expect(modal).toContainText(queueWithMessages.name);
    await expect(modal).toContainText(queueWithMessages.ns);
  });

  test('DETAIL-8: unack history tab handles disabled state', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.locator(SEL.msgRow).first().click();

    await page
      .locator(SEL.modal)
      .getByRole('tab', { name: 'Unack history' })
      .click();

    // Two valid outcomes: either the feature is disabled server-side
    // (default config: disabled) and we see the info state, or it's
    // enabled and we see history or an empty state. Assert on the
    // *absence* of an error surface and the *presence* of one of the
    // expected messages.
    const modal = page.locator(SEL.modal);
    await expect(modal.locator('.center-state--error')).toHaveCount(0);
    await expect(modal).toContainText(
      /No unacknowledgement|disabled in the server configuration/i,
    );
  });

  test('DETAIL-10: modal closes via ESC', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.locator(SEL.msgRow).first().click();
    await expect(page.locator(SEL.modal)).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator(SEL.modal)).toHaveCount(0);
  });

  test('DETAIL-10b: modal closes via scrim click', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));
    await page.locator(SEL.msgRow).first().click();
    await expect(page.locator(SEL.modal)).toBeVisible();

    await page.locator(SEL.modalScrim).click({ position: { x: 5, y: 5 } });
    await expect(page.locator(SEL.modal)).toHaveCount(0);
  });

  test('DETAIL-12: mobile — tabs scroll horizontally', async ({
    page,
    queueWithMessages,
  }) => {
    await page.setViewportSize({ width: 480, height: 720 });
    await page.goto(messagesUrl(queueWithMessages));
    await page.locator(SEL.msgRow).first().click();

    // The tab strip overflows horizontally on narrow viewports.
    const tabs = page.locator(SEL.modal).locator(SEL.vmTabs);
    const overflow = await tabs.evaluate(
      (el) => el.scrollWidth > el.clientWidth,
    );
    expect(overflow).toBe(true);
  });
});
