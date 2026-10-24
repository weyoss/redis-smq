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
import { expectNoObjectObjectInErrors } from '../helpers/errors.js';

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

test.describe('Namespace queues view', () => {
  test('NSP-Q-1: shows only queues belonging to the namespace', async ({
    page,
    api,
  }) => {
    const nsA = `ns-scope-a-${uniqueSuffix()}`;
    const nsB = `ns-scope-b-${uniqueSuffix()}`;
    const qA = `q-a-${uniqueSuffix()}`;
    const qB = `q-b-${uniqueSuffix()}`;
    await api.createQueue({ ns: nsA, name: qA });
    await api.createQueue({ ns: nsB, name: qB });

    try {
      await page.goto(`/ns/${nsA}/queues`);

      await expect(page.locator('h1')).toContainText(`Namespace: ${nsA}`);
      await expect(page.locator(SEL.queueRow)).toHaveCount(1);
      await expect(page.locator(SEL.queueRowName)).toContainText(qA);
      await expect(page.locator(SEL.queueRowName)).not.toContainText(qB);
    } finally {
      await api.deleteQueue({ ns: nsA, name: qA }).catch(() => {});
      await api.deleteQueue({ ns: nsB, name: qB }).catch(() => {});
    }
  });

  test('NSP-Q-2: exchange-only namespace surfaces NamespaceNotFoundError', async ({
    page,
    api,
  }) => {
    // RedisSMQ's "namespaces" concept is queue-scoped. An exchange-only
    // namespace is not registered in /api/namespaces, and
    // GET /api/namespaces/:ns/queues returns 400 NamespaceNotFoundError.
    // The view correctly surfaces this as a page error rather than an
    // empty state — reaching /ns/<exchange-only>/queues is a navigation
    // to a resource that doesn't exist. (The empty state is exercised by
    // NSP-Q-4, which navigates via a real queue namespace then removes
    // the last queue from within the UI.)
    const ns = `ns-emptyq-${uniqueSuffix()}`;
    const ex = `ex-${uniqueSuffix()}`;
    await api.createExchange({ ns, name: ex }, { type: EXCHANGE_TYPE.DIRECT });

    try {
      await page.goto(`/ns/${ns}/queues`);

      await expect(page.locator(SEL.stateError)).toBeVisible({
        timeout: 10_000,
      });
      await expect(page.locator(SEL.stateError)).toContainText(
        /NamespaceNotFound/i,
      );
      await expectNoObjectObjectInErrors(page);
    } finally {
      await api.deleteExchange({ ns, name: ex }).catch(() => {});
    }
  });

  test('NSP-Q-3: clicking a queue row navigates to queue detail', async ({
    page,
    api,
  }) => {
    const ns = `ns-qnav-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto(`/ns/${ns}/queues`);

      const row = page.locator(SEL.queueRow).filter({ hasText: qName });
      await expect(row).toBeVisible();

      await row.getByRole('button', { name: `Open queue ${qName}` }).click();

      await expect(page).toHaveURL(new RegExp(`/ns/${ns}/queues/${qName}$`));
      await expect(page.locator('h1')).toContainText(`Queue: ${qName}@${ns}`);
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-Q-4: deleting the last queue shows the empty state', async ({
    page,
    api,
  }) => {
    // This is the reachable path to the empty state: navigate via a
    // real queue namespace, delete the only queue through the UI, and
    // confirm the view transitions to "No queues". Depends on the
    // @deleted handler being wired on the QueueListItem (C3 in the
    // code review).
    const ns = `ns-qdel-${uniqueSuffix()}`;
    const qName = `q-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: qName });

    try {
      await page.goto(`/ns/${ns}/queues`);

      const row = page.locator(SEL.queueRow).filter({ hasText: qName });
      await expect(row).toBeVisible();

      await row.hover();
      await row.getByRole('button', { name: 'Delete queue' }).click();

      const modal = page.locator(SEL.modal);
      await expect(modal).toBeVisible();
      await modal
        .getByRole('button', { name: 'Delete queue', exact: true })
        .last()
        .click();

      await expect(row).toHaveCount(0, { timeout: 10_000 });

      const emptyState = page
        .locator(SEL.stateBlock)
        .filter({ has: page.getByRole('heading', { name: 'No queues' }) });
      await expect(emptyState).toBeVisible();
    } finally {
      await api.deleteQueue({ ns, name: qName }).catch(() => {});
    }
  });

  test('NSP-Q-5: refresh refetches the namespace queue list', async ({
    page,
    api,
  }) => {
    const ns = `ns-qrefresh-${uniqueSuffix()}`;
    const q1 = `q-1-${uniqueSuffix()}`;
    const q2 = `q-2-${uniqueSuffix()}`;
    await api.createQueue({ ns, name: q1 });

    try {
      await page.goto(`/ns/${ns}/queues`);
      await expect(page.locator(SEL.queueRow)).toHaveCount(1);

      await api.createQueue({ ns, name: q2 });

      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Refresh' })
        .click();

      await expect(page.locator(SEL.queueRow)).toHaveCount(2, {
        timeout: 10_000,
      });
    } finally {
      await api.deleteQueue({ ns, name: q1 }).catch(() => {});
      await api.deleteQueue({ ns, name: q2 }).catch(() => {});
    }
  });
});
