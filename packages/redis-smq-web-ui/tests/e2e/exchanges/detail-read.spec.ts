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
import { expectNoObjectObjectInErrors } from '../helpers/errors.js';
import { EXCHANGE_TYPE } from '../helpers/constants.js';

function exchangeUrl(ex: { ns: string; name: string }): string {
  return `/ns/${ex.ns}/exchanges/${ex.name}`;
}

/** Find the "Bindings" card by its heading. */
function bindingsCard(page: import('@playwright/test').Page) {
  return page.locator(SEL.card).filter({
    has: page.getByRole('heading', { name: 'Bindings', exact: true }),
  });
}

/** Find the "Match preview" card by its heading. */
function matchCard(page: import('@playwright/test').Page) {
  return page.locator(SEL.card).filter({
    has: page.getByRole('heading', { name: 'Match preview', exact: true }),
  });
}

test.describe('Exchange detail — read-only cards', () => {
  test('EX-DET-1: bindings card shows bound queue with routing key (direct)', async ({
    page,
    directExchange,
    queue,
  }) => {
    await page.goto(exchangeUrl(directExchange));
    await expect(page.locator('h1')).toContainText(
      `Exchange: ${directExchange.name}`,
    );

    const card = bindingsCard(page);
    await expect(card).toBeVisible();

    const bindingRow = card
      .locator(SEL.bindingQueue)
      .filter({ hasText: queue.name });
    await expect(bindingRow).toHaveCount(1);

    // Direct exchanges render one binding group per routing key; the
    // group title is the key itself.
    await expect(card.locator(SEL.bindingGroupTitle)).toHaveText(
      directExchange.routingKey,
    );
  });

  test('EX-DET-2: bindings card for fanout has no routing-key heading', async ({
    page,
    fanoutExchange,
    queue,
  }) => {
    await page.goto(exchangeUrl(fanoutExchange));

    const card = bindingsCard(page);
    await expect(card.locator(SEL.bindingQueue)).toHaveCount(1);
    await expect(card).toContainText(queue.name);

    // Fanout groups carry no routing key; the template renders the
    // group title only when kind === 'routed'.
    await expect(card.locator(SEL.bindingGroupTitle)).toHaveCount(0);
  });

  test('EX-DET-3: no bindings shows empty state', async ({ page, api }) => {
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const ns = 'test';
    const name = `ex-empty-${suffix}`;
    await api.createExchange({ ns, name }, { type: EXCHANGE_TYPE.DIRECT });

    try {
      await page.goto(`/ns/${ns}/exchanges/${name}`);

      const card = bindingsCard(page);
      await expect(card).toContainText('No bindings');
      await expect(card).toContainText('Bind a queue to route messages.');
    } finally {
      await api.deleteExchange({ ns, name }).catch(() => {});
    }
  });

  test('EX-DET-4: match preview for fanout lists bound queues', async ({
    page,
    fanoutExchange,
    queue,
  }) => {
    await page.goto(exchangeUrl(fanoutExchange));

    const card = matchCard(page);
    await expect(card).toBeVisible();

    // Fanout: input disabled, query fires on mount. Wait for the
    // single bound queue to appear.
    await expect(card.locator(SEL.matchResultsItem)).toHaveCount(1, {
      timeout: 10_000,
    });
    await expect(card).toContainText(queue.name);
    await expect(card).toContainText('queue would receive');
  });

  test('EX-DET-5: match preview for direct with matching key finds the queue', async ({
    page,
    directExchange,
    queue,
  }) => {
    await page.goto(exchangeUrl(directExchange));

    const card = matchCard(page);
    await card.locator(SEL.matchInput).fill(directExchange.routingKey);
    await card.getByRole('button', { name: 'Preview' }).click();

    await expect(card.locator(SEL.matchResultsItem)).toHaveCount(1);
    await expect(card).toContainText(queue.name);
  });

  test('EX-DET-6: match preview for direct with non-matching key shows no matches', async ({
    page,
    directExchange,
  }) => {
    await page.goto(exchangeUrl(directExchange));

    const card = matchCard(page);
    await card.locator(SEL.matchInput).fill('does.not.match.anything');
    await card.getByRole('button', { name: 'Preview' }).click();

    await expect(card).toContainText('No matches');
    await expect(card).toContainText('No queues would receive a message');
  });

  test('EX-DET-7: unknown exchange shows page error', async ({ page }) => {
    const name = `does-not-exist-${Date.now().toString(36)}`;
    await page.goto(`/ns/test/exchanges/${name}`);

    await expect(page.locator(SEL.stateError)).toBeVisible();
    await expect(page.locator(SEL.stateError)).toContainText(
      /ExchangeNotFound|InvalidExchange/i,
    );
    await expectNoObjectObjectInErrors(page);
  });
});
