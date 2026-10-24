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
import { expectNoInlineError } from '../helpers/errors.js';
import { EXCHANGE_TYPE } from '../helpers/constants.js';

function exchangeUrl(ex: { ns: string; name: string }): string {
  return `/ns/${ex.ns}/exchanges/${ex.name}`;
}

function bindingsCard(page: import('@playwright/test').Page) {
  return page.locator(SEL.card).filter({
    has: page.getByRole('heading', { name: 'Bindings', exact: true }),
  });
}

test.describe('Exchange detail — mutations', () => {
  test('EX-MUT-1: bind queue via modal adds it to the bindings card', async ({
    page,
    api,
  }) => {
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const ns = 'test';
    const exName = `ex-bind-${suffix}`;
    const qName = `q-bind-${suffix}`;
    await api.createExchange(
      { ns, name: exName },
      { type: EXCHANGE_TYPE.DIRECT },
    );
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto(`/ns/${ns}/exchanges/${exName}`);
      await expect(
        page.getByRole('button', { name: 'Bind queue', exact: true }),
      ).toBeEnabled();

      await page
        .getByRole('button', { name: 'Bind queue', exact: true })
        .click();

      const modal = page.locator(SEL.modal);
      await modal.locator('#bind-queue-name').fill(qName);
      await modal.locator('#bind-routing-key').fill('test.routing.key');
      await modal
        .getByRole('button', { name: 'Bind queue', exact: true })
        .click();

      await expect(modal).toHaveCount(0);

      const card = bindingsCard(page);
      await expect(
        card.locator(SEL.bindingQueue).filter({ hasText: qName }),
      ).toHaveCount(1);
      await expect(card).toContainText('test.routing.key');
      await expectNoInlineError(page);
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
      await api.deleteExchange({ ns, name: exName }).catch(() => {});
    }
  });

  test('EX-MUT-2: bind modal disables submit until routing key is provided (direct)', async ({
    page,
    directExchange,
  }) => {
    await page.goto(exchangeUrl(directExchange));
    await page.getByRole('button', { name: 'Bind queue', exact: true }).click();

    const modal = page.locator(SEL.modal);
    const submit = modal.getByRole('button', {
      name: 'Bind queue',
      exact: true,
    });

    // Empty queue name and empty routing key → disabled.
    await expect(submit).toBeDisabled();

    // Queue name alone is not enough — direct exchanges require a key.
    await modal.locator('#bind-queue-name').fill('some-queue');
    await expect(submit).toBeDisabled();

    // Routing key completes the form.
    await modal.locator('#bind-routing-key').fill('some.routing.key');
    await expect(submit).toBeEnabled();
  });

  test('EX-MUT-3: unbind removes the queue from the bindings card', async ({
    page,
    directExchange,
    queue,
  }) => {
    await page.goto(exchangeUrl(directExchange));

    const card = bindingsCard(page);
    const bindingRow = card
      .locator(SEL.bindingQueue)
      .filter({ hasText: queue.name });
    await expect(bindingRow).toHaveCount(1);

    await bindingRow.locator(SEL.bindingQueueUnbind).click();

    const modal = page.locator(SEL.modal);
    await expect(modal.locator(SEL.modalTitle)).toHaveText('Unbind queue');
    await modal.getByRole('button', { name: 'Unbind', exact: true }).click();

    await expect(modal).toHaveCount(0);
    await expect(card).toContainText('No bindings');
  });

  test('EX-MUT-4: delete exchange with no bindings redirects to /exchanges', async ({
    page,
    api,
  }) => {
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const ns = 'test';
    const name = `ex-del-${suffix}`;
    await api.createExchange({ ns, name }, { type: EXCHANGE_TYPE.DIRECT });

    try {
      await page.goto(`/ns/${ns}/exchanges/${name}`);

      // The bindings card must reach its empty state before the delete
      // action becomes enabled (canDelete depends on both queries).
      await expect(bindingsCard(page)).toContainText('No bindings');
      await expect(
        page.getByRole('button', { name: 'Delete', exact: true }),
      ).toBeEnabled();

      await page.getByRole('button', { name: 'Delete', exact: true }).click();

      const modal = page.locator(SEL.modal);
      await modal
        .getByRole('button', { name: 'Delete exchange', exact: true })
        .click();

      await expect(page).toHaveURL(/\/exchanges$/);
    } finally {
      await api.deleteExchange({ ns, name }).catch(() => {});
    }
  });

  test('EX-MUT-5: delete cancel keeps the exchange', async ({ page, api }) => {
    const suffix = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const ns = 'test';
    const name = `ex-del-${suffix}`;
    await api.createExchange({ ns, name }, { type: EXCHANGE_TYPE.DIRECT });

    try {
      await page.goto(`/ns/${ns}/exchanges/${name}`);
      await expect(bindingsCard(page)).toContainText('No bindings');
      await expect(
        page.getByRole('button', { name: 'Delete', exact: true }),
      ).toBeEnabled();

      await page.getByRole('button', { name: 'Delete', exact: true }).click();

      const modal = page.locator(SEL.modal);
      await modal.getByRole('button', { name: 'Cancel' }).click();

      await expect(modal).toHaveCount(0);
      await expect(page.locator('h1')).toContainText(`Exchange: ${name}`);
    } finally {
      await api.deleteExchange({ ns, name }).catch(() => {});
    }
  });

  test('EX-MUT-6: delete disabled when exchange still has bindings', async ({
    page,
    directExchange,
    queue,
  }) => {
    await page.goto(exchangeUrl(directExchange));

    // Wait for the actual binding row to render — proves both queries
    // (exchange + bindings) have settled, so "disabled" reflects real
    // state and not just the initial loading phase.
    await expect(
      bindingsCard(page)
        .locator(SEL.bindingQueue)
        .filter({ hasText: queue.name }),
    ).toHaveCount(1, { timeout: 10_000 });

    await expect(
      page.getByRole('button', { name: 'Delete', exact: true }),
    ).toBeDisabled();
  });
});
