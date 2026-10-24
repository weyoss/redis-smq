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
import { EXCHANGE_TYPE } from '../helpers/constants.js';

/**
 * Fetch every exchange currently on the server. The exchanges list view
 * is global (not namespace-scoped), so tests that need "only the one I
 * created" can filter down from this snapshot rather than assuming a
 * clean API.
 */
async function listExchanges(
  request: import('@playwright/test').APIRequestContext,
  apiBaseUrl: string,
): Promise<Array<{ ns: string; name: string }>> {
  const res = await request.get(`${apiBaseUrl}/api/exchanges`);
  const body = (await res.json()) as {
    data: Array<{ ns: string; name: string }>;
  };
  return body.data;
}

test.describe('Exchanges list', () => {
  test('EX-LIST-1: Create exchange button opens modal', async ({ page }) => {
    await page.goto('/exchanges');

    await page
      .locator(SEL.pageActions)
      .getByRole('button', { name: 'Create exchange' })
      .click();

    const modal = page.locator(SEL.modal);
    await expect(modal).toBeVisible();
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Create exchange');
  });

  test('EX-LIST-2: create exchange navigates to detail page', async ({
    page,
    api,
  }) => {
    // Unique name — a failed previous run must not poison this one.
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const ns = `demo-ns-${suffix}`;
    const name = `demo-ex-${suffix}`;

    try {
      await page.goto('/exchanges');
      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Create exchange' })
        .click();

      const modal = page.locator(SEL.modal);
      await modal.locator('input#ex-ns').fill(ns);
      await modal.locator('input#ex-name').fill(name);
      // The exchange modal uses short labels only ("Direct" / "Fanout" /
      // "Topic"); the "Routes on exact routing key match" hint is a
      // separate <p class="hint"> below the select, not part of the
      // option text. Unlike CreateQueueModal, whose labels DO embed the
      // description.
      await modal.locator('select#ex-type').selectOption({ label: 'Direct' });
      await modal
        .getByRole('button', { name: 'Create exchange', exact: true })
        .click();

      await expect(page).toHaveURL(new RegExp(`/ns/${ns}/exchanges/${name}$`));
      await expect(page.locator('h1')).toContainText(`Exchange: ${name}`);
      await expect(page.locator(SEL.modal)).toHaveCount(0);
    } finally {
      await api.deleteExchange({ ns, name }).catch(() => {});
    }
  });

  test('EX-LIST-3: invalid name shows inline error, no request sent', async ({
    page,
  }) => {
    await page.goto('/exchanges');
    await page
      .locator(SEL.pageActions)
      .getByRole('button', { name: 'Create exchange' })
      .click();

    const modal = page.locator(SEL.modal);
    await modal.locator('input#ex-ns').fill('test');
    await modal.locator('input#ex-name').fill('1starts-with-digit');

    let requestFired = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().endsWith('/api/exchanges')) {
        requestFired = true;
      }
    });

    await modal
      .getByRole('button', { name: 'Create exchange', exact: true })
      .click();

    await expect(
      modal.locator('.invalid-feedback, .field-error'),
    ).toBeVisible();
    await expect(modal).toBeVisible();
    expect(requestFired).toBe(false);
  });

  test('EX-LIST-4: duplicate name shows server error inline', async ({
    page,
    directExchange,
  }) => {
    await page.goto('/exchanges');
    await page
      .locator(SEL.pageActions)
      .getByRole('button', { name: 'Create exchange' })
      .click();

    const modal = page.locator(SEL.modal);
    await modal.locator('input#ex-ns').fill(directExchange.ns);
    await modal.locator('input#ex-name').fill(directExchange.name);
    await modal
      .getByRole('button', { name: 'Create exchange', exact: true })
      .click();

    await expectInlineError(page, /ExchangeAlreadyExistsError/);
    await expect(modal).toBeVisible();
    await expectNoObjectObjectInErrors(page);
  });

  test('EX-LIST-5: exchange card shows type and bound queue count', async ({
    page,
    directExchange,
    queue,
  }) => {
    await page.goto('/exchanges');

    const card = page
      .locator(SEL.exchangeCard)
      .filter({ hasText: directExchange.name });
    await expect(card).toBeVisible();

    await expect(card.locator(SEL.exchangeCardTitle)).toHaveText(
      directExchange.name,
    );
    await expect(card.locator(SEL.exchangeCardSubtitle)).toContainText(
      'Direct',
    );
    await expect(card).toContainText('1 bound queue');
    await expect(card).toContainText(queue.name);
  });

  test('EX-LIST-6: "View details" navigates to exchange detail', async ({
    page,
    directExchange,
  }) => {
    await page.goto('/exchanges');

    const card = page
      .locator(SEL.exchangeCard)
      .filter({ hasText: directExchange.name });
    await card.getByRole('button', { name: 'View details' }).click();

    await expect(page).toHaveURL(
      new RegExp(`/ns/${directExchange.ns}/exchanges/${directExchange.name}$`),
    );
  });

  test('EX-LIST-7: "Bind queue" from card opens the bind modal', async ({
    page,
    directExchange,
  }) => {
    await page.goto('/exchanges');

    const card = page
      .locator(SEL.exchangeCard)
      .filter({ hasText: directExchange.name });
    await card.getByRole('button', { name: 'Bind queue' }).click();

    const modal = page.locator(SEL.modal);
    await expect(modal).toBeVisible();
    await expect(modal.locator(SEL.modalTitle)).toContainText('Bind queue');
    await expect(modal.locator(SEL.modalSubtitle)).toContainText(
      directExchange.name,
    );
  });

  test('EX-LIST-8: refresh refetches the list', async ({
    page,
    request,
    apiBaseUrl,
    api,
  }) => {
    // Bare exchange — no queues bound. The `directExchange` fixture
    // has a bound queue, which makes DELETE return 409 and prevents
    // this test from exercising "delete + refresh".
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const ns = 'test';
    const name = `ex-refresh-${suffix}`;
    await api.createExchange({ ns, name }, { type: EXCHANGE_TYPE.DIRECT });

    try {
      await page.goto('/exchanges');

      const card = page.locator(SEL.exchangeCard).filter({ hasText: name });
      await expect(card).toBeVisible({ timeout: 10_000 });

      // Delete the exchange out from under the UI, then click Refresh.
      await api.deleteExchange({ ns, name });

      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Refresh' })
        .click();

      await expect(card).toHaveCount(0, { timeout: 10_000 });

      // Sanity: confirm the server has no record of it either — catches
      // the case where the list is hidden but the row still exists.
      const remaining = await listExchanges(request, apiBaseUrl);
      expect(remaining.some((ex) => ex.name === name)).toBe(false);
    } finally {
      await api.deleteExchange({ ns, name }).catch(() => {});
    }
  });
});
