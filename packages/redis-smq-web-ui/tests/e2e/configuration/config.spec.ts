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

function loggerCard(page: import('@playwright/test').Page) {
  return page.locator(SEL.card).filter({
    has: page.getByRole('heading', { name: 'Logger', exact: true }),
  });
}

function namespaceCard(page: import('@playwright/test').Page) {
  return page.locator(SEL.card).filter({
    has: page.getByRole('heading', { name: 'Namespace', exact: true }),
  });
}

function messageAuditCard(page: import('@playwright/test').Page) {
  return page.locator(SEL.card).filter({
    has: page.getByRole('heading', { name: 'Message audit', exact: true }),
  });
}

test.describe('Configuration view', () => {
  test('CONFIG-1: all three cards render with their sections', async ({
    page,
  }) => {
    await page.goto('/config');

    await expect(page.locator('h1')).toContainText('Configuration');

    // Namespace card.
    const ns = namespaceCard(page);
    await expect(ns).toBeVisible();
    await expect(ns.locator(SEL.configNamespaceValue)).not.toBeEmpty();

    // Logger card.
    const logger = loggerCard(page);
    await expect(logger).toBeVisible();
    // Either the enabled grid or the "Logger is disabled" note must be
    // present — never both, never neither.
    const loggerDetailsVisible = await logger
      .locator(SEL.configKvGrid)
      .isVisible()
      .catch(() => false);
    const loggerDisabledVisible = await logger
      .locator(SEL.configMuted)
      .isVisible()
      .catch(() => false);
    expect(loggerDetailsVisible || loggerDisabledVisible).toBe(true);

    // Message audit card.
    const audit = messageAuditCard(page);
    await expect(audit).toBeVisible();
    await expect(
      audit
        .locator(SEL.configAuditSection)
        .filter({ hasText: 'Acknowledged messages' }),
    ).toBeVisible();
    await expect(
      audit
        .locator(SEL.configAuditSection)
        .filter({ hasText: 'Dead-lettered messages' }),
    ).toBeVisible();
    await expect(
      audit
        .locator(SEL.configAuditSection)
        .filter({ hasText: 'Unacknowledgement history' }),
    ).toBeVisible();

    await expectNoObjectObjectInErrors(page);
  });

  test('CONFIG-2: Edit configuration opens the modal with hydrated values', async ({
    page,
  }) => {
    await page.goto('/config');

    await page
      .locator(SEL.pageActions)
      .getByRole('button', { name: 'Edit configuration' })
      .click();

    const modal = page.locator(SEL.modal);
    await expect(modal).toBeVisible();
    await expect(modal.locator(SEL.modalTitle)).toHaveText(
      'Edit configuration',
    );

    // Namespace field is populated (or empty string if the config has
    // no explicit namespace — which is the default).
    await expect(modal.locator('input#cfg-ns')).toBeVisible();
    // Logger and message-audit sections are present.
    await expect(
      modal.getByRole('heading', { name: 'Namespace', exact: true }),
    ).toBeVisible();
    await expect(
      modal.getByRole('heading', { name: 'Logger', exact: true }),
    ).toBeVisible();
    await expect(
      modal.getByRole('heading', { name: 'Message audit', exact: true }),
    ).toBeVisible();
    // Save button enabled (no pending mutation at open time).
    await expect(
      modal.getByRole('button', { name: 'Save configuration', exact: true }),
    ).toBeEnabled();
  });

  test('CONFIG-3: cancel closes the modal without saving', async ({
    page,
    api,
  }) => {
    // The logger card only renders the log-level dd when logger.enabled
    // is true. Force that state first so this test doesn't depend on
    // whatever state a prior run left behind — an un-restored config
    // (e.g. from a timed-out test whose finally never ran) leaves
    // logger disabled and this test would fail to find `.kv-grid`.
    const before = await api.getConfiguration();

    try {
      await api.updateConfiguration({ logger: { enabled: true } });

      await page.goto('/config');

      const logger = loggerCard(page);
      const logLevelLabel = logger
        .locator(SEL.configKvGrid)
        .locator('dd')
        .first();
      // Wait for the config query to settle and render the value.
      const initial = ((await logLevelLabel.textContent()) ?? '').trim();

      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Edit configuration' })
        .click();
      const modal = page.locator(SEL.modal);
      await expect(modal).toBeVisible();

      let patchFired = false;
      page.on('request', (req) => {
        if (req.method() === 'PATCH' && req.url().endsWith('/api/config')) {
          patchFired = true;
        }
      });

      await modal.locator('select#cfg-log-level').selectOption({ index: 1 });

      await modal.getByRole('button', { name: 'Cancel' }).click();
      await expect(modal).toHaveCount(0);
      expect(patchFired).toBe(false);

      // The view still shows the value it had before the modal opened.
      await expect(logLevelLabel).toHaveText(initial);
    } finally {
      await api.updateConfiguration(before).catch((e) => {
        console.error('[config] restore failed', e);
      });
    }
  });

  test('CONFIG-4: changing the log level updates the view', async ({
    page,
    api,
  }) => {
    const before = await api.getConfiguration();

    try {
      // Force a known baseline: logger enabled with a specific level.
      // Without this, the test either finds no `.kv-grid` (logger
      // disabled) or picks a "target != current" that happens to be a
      // no-op relative to whatever state the previous run left.
      await api.updateConfiguration({
        logger: { enabled: true, options: { logLevel: 'INFO' } },
      });

      await page.goto('/config');

      const logger = loggerCard(page);
      const logLevelLabel = logger
        .locator(SEL.configKvGrid)
        .locator('dd')
        .first();
      const current = ((await logLevelLabel.textContent()) ?? '').trim();

      const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
      const target = levels.find((l) => l !== current) ?? 'DEBUG';

      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Edit configuration' })
        .click();

      const modal = page.locator(SEL.modal);
      await expect(modal).toBeVisible();
      await modal
        .locator('select#cfg-log-level')
        .selectOption({ label: target });
      await modal
        .getByRole('button', { name: 'Save configuration', exact: true })
        .click();

      await expect(modal).toHaveCount(0, { timeout: 10_000 });
      await expect(logLevelLabel).toHaveText(target, { timeout: 10_000 });

      await expectNoObjectObjectInErrors(page);
    } finally {
      await api.updateConfiguration(before).catch((e) => {
        console.error('[config] restore failed', e);
      });
    }
  });

  test('CONFIG-5: disabling the logger shows the disabled note', async ({
    page,
    api,
  }) => {
    const before = await api.getConfiguration();

    try {
      // Force a known starting state: logger enabled. This makes the
      // "changed" assertion meaningful even if a prior test-run left
      // the logger disabled.
      await api.updateConfiguration({ logger: { enabled: true } });

      await page.goto('/config');

      const logger = loggerCard(page);
      // Once enabled, the details grid is visible and the disabled note
      // is not.
      await expect(logger.locator(SEL.configKvGrid)).toBeVisible({
        timeout: 10_000,
      });
      await expect(logger.locator(SEL.configMuted)).toHaveCount(0);

      // Open the modal, toggle logger off, save.
      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Edit configuration' })
        .click();

      const modal = page.locator(SEL.modal);
      await expect(modal).toBeVisible();
      // The switch reflects the currently-enabled state.
      await expect(modal.locator('#cfg-logger-enabled')).toBeChecked();
      await modal.locator('#cfg-logger-enabled').uncheck();
      await modal
        .getByRole('button', { name: 'Save configuration', exact: true })
        .click();

      await expect(modal).toHaveCount(0, { timeout: 10_000 });
      // The logger card now shows the disabled note and drops the grid.
      await expect(logger.locator(SEL.configMuted)).toBeVisible({
        timeout: 10_000,
      });
      await expect(logger.locator(SEL.configMuted)).toContainText(
        'Logger is disabled',
      );
      await expect(logger.locator(SEL.configKvGrid)).toHaveCount(0);

      await expectNoObjectObjectInErrors(page);
    } finally {
      await api.updateConfiguration(before).catch((e) => {
        console.error('[config] restore failed', e);
      });
    }
  });

  test('CONFIG-6: Refresh refetches config after an out-of-band change', async ({
    page,
    api,
  }) => {
    const before = await api.getConfiguration();

    try {
      await page.goto('/config');

      // Force a known baseline: logger enabled with INFO level. This
      // ensures our "changed" assertion lands on a specific value.
      await api.updateConfiguration({
        logger: {
          enabled: true,
          options: { logLevel: 'INFO' },
        },
      });

      const logger = loggerCard(page);
      const logLevelLabel = logger
        .locator(SEL.configKvGrid)
        .locator('dd')
        .first();

      // The page fetched before we mutated — Refresh is what applies
      // the change.
      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Refresh' })
        .click();

      await expect(logLevelLabel).toHaveText('INFO', { timeout: 10_000 });

      // Change out-of-band again, then Refresh again.
      await api.updateConfiguration({
        logger: { enabled: true, options: { logLevel: 'ERROR' } },
      });
      await page
        .locator(SEL.pageActions)
        .getByRole('button', { name: 'Refresh' })
        .click();

      await expect(logLevelLabel).toHaveText('ERROR', { timeout: 10_000 });
    } finally {
      await api.updateConfiguration(before).catch((e) => {
        console.error('[config] restore failed', e);
      });
    }
  });

  test('CONFIG-7: message audit summaries reflect enabled/disabled state', async ({
    page,
    api,
  }) => {
    const before = await api.getConfiguration();

    try {
      await api.updateConfiguration({
        messageAudit: {
          acknowledgedMessages: false,
          deadLetteredMessages: false,
          unacknowledgementHistory: false,
        },
      });

      await page.goto('/config');

      const audit = messageAuditCard(page);

      // Wait for the config query to settle and render the badges.
      // A bare count() runs immediately after goto and sees 0, because
      // page.goto resolves before the SPA's fetch completes.
      const badges = audit.locator('.badge');
      await expect(badges.first()).toBeVisible({ timeout: 10_000 });
      await expect(badges).toHaveCount(3);
      for (let i = 0; i < 3; i++) {
        await expect(badges.nth(i)).toHaveText('Disabled');
      }

      // Summary lines: acknowledged and dead-lettered always render a
      // summary; unacknowledgement history's summary is v-if-gated on
      // `enabled`, so with all three off only 2 summaries appear.
      const summaries = audit.locator(SEL.configAuditSummary);
      await expect(summaries).toHaveCount(2, { timeout: 10_000 });
      for (let i = 0; i < 2; i++) {
        await expect(summaries.nth(i)).toHaveText('Disabled');
      }
    } finally {
      await api.updateConfiguration(before).catch((e) => {
        console.error('[config] restore failed', e);
      });
    }
  });
});
