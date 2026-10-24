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

function messagesUrl(q: { ns: string; name: string }, query = ''): string {
  return `/ns/${q.ns}/queues/${q.name}/messages${query}`;
}

test.describe('Messages — browse & pagination', () => {
  test('MSG-1: published tab is the default', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    await expect(
      page.getByRole('tab', { name: 'Published', exact: true }),
    ).toHaveAttribute('aria-selected', 'true');

    // URL is normalized only if a `?type=` was passed explicitly. The
    // app's `messageType` computed defaults to published without a
    // rewrite, so no query string is required on first load.
    await expect(page.locator(SEL.pageSubtitle)).toContainText(
      'Published messages',
    );
  });

  test('MSG-2: tab click changes URL and content', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    // Published first.
    await expect(
      page.getByRole('tab', { name: 'Scheduled', exact: true }),
    ).toBeEnabled();

    await page.getByRole('tab', { name: 'Scheduled', exact: true }).click();

    await expect(page).toHaveURL(/\?type=scheduled$/);
    await expect(page.locator(SEL.pageSubtitle)).toContainText(
      'Scheduled messages',
    );

    // Scheduled tab: 2 messages from the fixture.
    await expect(page.locator(SEL.msgRow)).toHaveCount(2);
  });

  test('MSG-3: switching tabs shows loading, not stale content', async ({
    page,
    queueWithMessages,
  }) => {
    await page.goto(messagesUrl(queueWithMessages));

    // The Published tab uses `status=published` = "all messages
    // regardless of state", so all 5 fixture messages (3 pending + 2
    // scheduled) are visible here. See BULK-1 for the same rationale.
    await expect(page.locator(SEL.msgRow)).toHaveCount(5);

    // Intercept the follow-up request so the loading state is visible
    // long enough to assert on (the API is fast enough locally that
    // without a delay the state flickers past).
    await page.route('**/api/namespaces/**/messages?**', async (route) => {
      try {
        if (
          new URL(route.request().url()).searchParams.get('status') ===
          'scheduled'
        ) {
          await new Promise((r) => setTimeout(r, 500));
        }
        await route.continue();
      } catch {
        // The client aborted this request (tab switch re-fired the
        // query with a fresh AbortController). Nothing left to forward.
      }
    });

    await page.getByRole('tab', { name: 'Scheduled', exact: true }).click();

    // During the delay: empty Published rows must be gone; loading state visible.
    await expect(page.locator(SEL.stateLoading).first()).toBeVisible();
    await expect(page.locator(SEL.msgRow)).toHaveCount(0);

    await page.unroute('**/api/namespaces/**/messages?**');

    // When the fetch completes, scheduled rows appear.
    await expect(page.locator(SEL.msgRow)).toHaveCount(2, { timeout: 10_000 });
  });

  test('MSG-4: tab switch resets pagination to page 1', async ({
    page,
    api,
    queue,
  }) => {
    // Seed 25 published messages — 2 pages at 20 per page (the app's
    // default page size in MessagesView.vue; useMessages' third arg is
    // unset, so it's 20). 25 is BULK-7's choice for the same reason.
    for (let i = 0; i < 25; i++) {
      await api.publishMessage({
        exchange: { queue },
        message: { body: { i } },
      });
    }

    await page.goto(messagesUrl(queue));
    await expect(page.locator(SEL.msgRow)).toHaveCount(20);

    // Move to page 2 — 5 messages remain.
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.locator(SEL.msgRow)).toHaveCount(5, { timeout: 10_000 });

    // Switch tabs and come back. Pagination is internal state in
    // useMessages, not a URL param — asserting on row count is the only
    // reliable way to prove we're on page 1 again.
    await page.getByRole('tab', { name: 'Scheduled', exact: true }).click();
    await expect(page.locator(SEL.stateEmpty).first()).toBeVisible();

    await page.getByRole('tab', { name: 'Published', exact: true }).click();

    // Back on Published — should be page 1, which has 20 rows.
    await expect(page.locator(SEL.msgRow)).toHaveCount(20, { timeout: 10_000 });
    await expect(
      page.locator(`${SEL.pagination} button[aria-current="page"]`),
    ).toHaveText('1');
  });

  test('MSG-7: empty state per tab', async ({ page, queue }) => {
    await page.goto(messagesUrl(queue));

    // No messages at all — Published empty.
    await expect(page.locator(SEL.stateEmpty).first()).toContainText(
      /No published messages/i,
    );

    await page.getByRole('tab', { name: 'Scheduled', exact: true }).click();
    await expect(page.locator(SEL.stateEmpty).first()).toContainText(
      /No scheduled messages/i,
    );
  });
});
