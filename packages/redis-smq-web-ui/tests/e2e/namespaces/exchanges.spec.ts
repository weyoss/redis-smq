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
import { EXCHANGE_TYPE } from '../helpers/constants.js';

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

test.describe('Namespace exchanges view', () => {
  test('NSP-EX-1: shows only exchanges belonging to the namespace', async ({
    page,
    api,
  }) => {
    const nsA = `ns-exa-${uniqueSuffix()}`;
    const nsB = `ns-exb-${uniqueSuffix()}`;
    const exA = `ex-a-${uniqueSuffix()}`;
    const exB = `ex-b-${uniqueSuffix()}`;
    await api.createExchange(
      { ns: nsA, name: exA },
      { type: EXCHANGE_TYPE.DIRECT },
    );
    await api.createExchange(
      { ns: nsB, name: exB },
      { type: EXCHANGE_TYPE.DIRECT },
    );

    try {
      await page.goto(`/ns/${nsA}/exchanges`);

      await expect(page.locator('h1')).toContainText(`Namespace: ${nsA}`);
      await expect(page.locator(SEL.exchangeCard)).toHaveCount(1);
      await expect(page.locator(SEL.exchangeCardTitle)).toContainText(exA);
      await expect(page.locator(SEL.exchangeCardTitle)).not.toContainText(exB);
    } finally {
      await api.deleteExchange({ ns: nsA, name: exA }).catch(() => {});
      await api.deleteExchange({ ns: nsB, name: exB }).catch(() => {});
    }
  });

  test('NSP-EX-2: empty state when namespace has queues but no exchanges', async ({
    page,
    api,
  }) => {
    const ns = `ns-emptyex-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto(`/ns/${ns}/exchanges`);

      const emptyState = page
        .locator(SEL.stateBlock)
        .filter({ has: page.getByRole('heading', { name: 'No exchanges' }) });
      await expect(emptyState).toBeVisible();
      await expect(emptyState).toContainText(
        'Create an exchange to start routing messages.',
      );
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-EX-3: Create exchange button opens modal with namespace prefilled', async ({
    page,
    api,
  }) => {
    const ns = `ns-createex-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto(`/ns/${ns}/exchanges`);

      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Create exchange' })
        .click();

      const modal = page.locator(SEL.modal);
      await expect(modal).toBeVisible();
      await expect(modal.locator(SEL.modalTitle)).toHaveText('Create exchange');

      // Namespace is prefilled from the route — the input is still
      // editable, but it arrives populated.
      await expect(modal.locator('input#ex-ns')).toHaveValue(ns);
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-EX-4: created exchange appears in the namespace list', async ({
    page,
    api,
  }) => {
    const ns = `ns-newex-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    const exName = `ex-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto(`/ns/${ns}/exchanges`);

      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Create exchange' })
        .click();

      const modal = page.locator(SEL.modal);
      await modal.locator('input#ex-name').fill(exName);
      // Short labels — the "Routes on exact routing key match" hint
      // is a separate element below the select.
      await modal.locator('select#ex-type').selectOption({ label: 'Direct' });
      await modal
        .getByRole('button', { name: 'Create exchange', exact: true })
        .click();

      await expect(modal).toHaveCount(0);

      const card = page.locator(SEL.exchangeCard).filter({ hasText: exName });
      await expect(card).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.deleteExchange({ ns, name: exName }).catch(() => {});
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-EX-5: refresh refetches the namespace exchange list', async ({
    page,
    api,
  }) => {
    const ns = `ns-exrefresh-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    const ex1 = `ex-1-${uniqueSuffix()}`;
    const ex2 = `ex-2-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });
    await api.createExchange({ ns, name: ex1 }, { type: EXCHANGE_TYPE.DIRECT });

    try {
      await page.goto(`/ns/${ns}/exchanges`);
      await expect(page.locator(SEL.exchangeCard)).toHaveCount(1);

      // Create a second exchange out from under the UI.
      await api.createExchange(
        { ns, name: ex2 },
        { type: EXCHANGE_TYPE.FANOUT },
      );

      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Refresh' })
        .click();

      await expect(page.locator(SEL.exchangeCard)).toHaveCount(2, {
        timeout: 10_000,
      });
    } finally {
      await api.deleteExchange({ ns, name: ex1 }).catch(() => {});
      await api.deleteExchange({ ns, name: ex2 }).catch(() => {});
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });
});
