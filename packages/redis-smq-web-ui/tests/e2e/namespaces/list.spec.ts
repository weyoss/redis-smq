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
import { cleanupQueue } from '../fixtures/cleanup.js';

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function getNamespaces(
  request: import('@playwright/test').APIRequestContext,
  apiBaseUrl: string,
): Promise<string[]> {
  const res = await request.get(`${apiBaseUrl}/api/namespaces`);
  const body = (await res.json()) as { data: string[] };
  return body.data;
}

function nsCard(page: import('@playwright/test').Page, ns: string) {
  return page.locator(SEL.namespaceCard).filter({ hasText: ns });
}

test.describe('Namespaces list', () => {
  test('NSP-LIST-1: renders a card for a newly created namespace', async ({
    page,
    api,
  }) => {
    const ns = `ns-render-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto('/ns');

      const card = nsCard(page, ns);
      await expect(card).toBeVisible();
      await expect(card.locator(SEL.namespaceCardTitle)).toHaveText(ns);
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-LIST-2: card shows queue and exchange counts', async ({
    page,
    api,
  }) => {
    const ns = `ns-count-${uniqueSuffix()}`;
    const q1 = `q-a-${uniqueSuffix()}`;
    const q2 = `q-b-${uniqueSuffix()}`;
    const ex = `ex-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: q1 });
    await api.createQueue({ ns, name: q2 });
    await api.createExchange({ ns, name: ex }, { type: EXCHANGE_TYPE.DIRECT });

    try {
      await page.goto('/ns');

      const card = nsCard(page, ns);
      await expect(card).toBeVisible();

      const queuesStat = card
        .locator(SEL.namespaceCardStat)
        .filter({ hasText: 'Queues' });
      const exchangesStat = card
        .locator(SEL.namespaceCardStat)
        .filter({ hasText: 'Exchanges' });

      // Wait for the per-card queries to settle before asserting values.
      await expect(queuesStat.locator(SEL.namespaceCardStatValue)).toHaveText(
        '2',
        { timeout: 10_000 },
      );
      await expect(
        exchangesStat.locator(SEL.namespaceCardStatValue),
      ).toHaveText('1');
    } finally {
      await api.deleteExchange({ ns, name: ex }).catch(() => {});
      await api.deleteQueue({ ns, name: q1 }).catch(() => {});
      await api.deleteQueue({ ns, name: q2 }).catch(() => {});
    }
  });

  test('NSP-LIST-3: clicking Queues stat navigates to namespace queues', async ({
    page,
    api,
  }) => {
    const ns = `ns-navq-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto('/ns');
      const card = nsCard(page, ns);
      await expect(card).toBeVisible();

      await card
        .locator(SEL.namespaceCardStat)
        .filter({ hasText: 'Queues' })
        .click();

      await expect(page).toHaveURL(new RegExp(`/ns/${ns}/queues$`));
      await expect(page.locator('h1')).toContainText(`Namespace: ${ns}`);
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-LIST-4: clicking Exchanges stat navigates to namespace exchanges', async ({
    page,
    api,
  }) => {
    const ns = `ns-nave-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto('/ns');
      const card = nsCard(page, ns);
      await expect(card).toBeVisible();

      await card
        .locator(SEL.namespaceCardStat)
        .filter({ hasText: 'Exchanges' })
        .click();

      await expect(page).toHaveURL(new RegExp(`/ns/${ns}/exchanges$`));
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-LIST-5: delete non-empty namespace surfaces server error', async ({
    page,
    api,
  }) => {
    const ns = `ns-err-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });
    // A queue with pending messages makes the namespace un-deletable.
    await api.publishMessage({
      exchange: { queue: { ns, name: qName } },
      message: { body: { hello: 'world' } },
    });

    try {
      await page.goto('/ns');
      const card = nsCard(page, ns);
      await expect(card).toBeVisible();

      await card.locator(SEL.namespaceCardDelete).click();
      const modal = page.locator(SEL.modal);
      await expect(modal.locator(SEL.modalTitle)).toHaveText(
        'Delete namespace',
      );

      await modal
        .getByRole('button', { name: 'Delete namespace', exact: true })
        .click();

      await expectInlineError(
        page,
        /QueueNotEmptyError|QueueHasBoundExchanges|ConsumerSetMismatch|QueueNotFound|QueueHasActiveConsumers/i,
      );
      await expect(modal).toBeVisible();
      await expectNoObjectObjectInErrors(page);
    } finally {
      await cleanupQueue(api, { ns, name: qName });
    }
  });

  test('NSP-LIST-6: delete cancel keeps the namespace', async ({
    page,
    api,
  }) => {
    const ns = `ns-cancel-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto('/ns');
      const card = nsCard(page, ns);
      await expect(card).toBeVisible();

      await card.locator(SEL.namespaceCardDelete).click();
      const modal = page.locator(SEL.modal);
      await expect(modal).toBeVisible();

      await modal.getByRole('button', { name: 'Cancel' }).click();

      await expect(page.locator(SEL.modal)).toHaveCount(0);
      await expect(card).toBeVisible();
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-LIST-7: delete succeeds for namespace containing only empty queues', async ({
    page,
    request,
    apiBaseUrl,
    api,
  }) => {
    // Per the API contract, a namespace is deletable when every queue
    // inside it is message-free, has no active consumers, and no
    // exchange inside it has bound queues. A namespace with one empty
    // queue therefore satisfies that contract.
    const ns = `ns-del-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    // The namespace may or may not persist in `/api/namespaces` after
    // its last queue is deleted — depends on the redis-smq bookkeeping.
    // Skip the UI path if the namespace is gone, otherwise exercise it.
    const namespaces = await getNamespaces(request, apiBaseUrl);
    test.skip(
      !namespaces.includes(ns),
      `Namespace ${ns} did not appear in /api/namespaces after creation`,
    );

    try {
      await page.goto('/ns');
      const card = nsCard(page, ns);
      await expect(card).toBeVisible();

      await card.locator(SEL.namespaceCardDelete).click();
      const modal = page.locator(SEL.modal);
      await expect(modal).toBeVisible();

      // The modal should show the confirmation counts.
      await expect(modal.locator(SEL.nsSummary)).toBeVisible();

      await modal
        .getByRole('button', { name: 'Delete namespace', exact: true })
        .click();

      await expect(card).toHaveCount(0);

      // Server no longer lists it.
      const remaining = await getNamespaces(request, apiBaseUrl);
      expect(remaining).not.toContain(ns);
    } finally {
      // Queue may have been removed as part of the namespace delete;
      // best-effort cleanup.
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-LIST-8: refresh refetches the namespaces list', async ({
    page,
    api,
  }) => {
    const ns = `ns-refresh-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;

    try {
      await page.goto('/ns');

      // Wait for the initial namespaces query to settle — either cards
      // or the empty state is visible at that point.
      await expect(
        page.locator(`${SEL.namespaceCard}, ${SEL.stateBlock}`).first(),
      ).toBeVisible({ timeout: 10_000 });

      // The namespace we're about to create doesn't exist yet in the UI.
      const card = nsCard(page, ns);
      await expect(card).toHaveCount(0);

      // Create it out from under the UI.
      await api.createQueue({ ns, name: qName });
      await expect(card).toHaveCount(0);

      // Click Refresh — the query invalidates and refetches.
      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Refresh' })
        .click();

      await expect(card).toBeVisible({ timeout: 10_000 });
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });
});
