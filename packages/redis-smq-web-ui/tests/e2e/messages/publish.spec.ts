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
import { expectRequest, getJsonBody } from '../helpers/network.js';

function messagesUrl(q: { ns: string; name: string }): string {
  return `/ns/${q.ns}/queues/${q.name}/messages`;
}

test.describe('Messages — publish', () => {
  test('PUB-1: publish to queue — message appears in Published', async ({
    page,
    queue,
  }) => {
    await page.goto(messagesUrl(queue));
    await expect(page.locator(SEL.stateEmpty).first()).toBeVisible();

    await page.getByRole('button', { name: 'Publish', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('#pm-body').fill('{"hello":"world"}');

    await Promise.all([
      expectRequest(page, { method: 'POST', pathIncludes: '/api/messages' }),
      modal
        .getByRole('button', { name: 'Publish', exact: true })
        .last()
        .click(),
    ]);

    // Success screen inside the modal. `.last()` disambiguates the
    // footer Close from the header X icon (both have name "Close").
    await expect(modal).toContainText('Published successfully');

    // Close, then verify the message now appears in the list.
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();
    await expect(page.locator(SEL.msgRow)).toHaveCount(1);
    await expectNoInlineError(page);
  });

  test('PUB-2: publish with delay — message is Scheduled, not Pending', async ({
    page,
    queue,
  }) => {
    await page.goto(messagesUrl(queue));
    await page.getByRole('button', { name: 'Publish', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('#pm-body').fill('{"delay":true}');
    await modal.locator('#pm-scheduled-delay').fill('60000');

    await modal
      .getByRole('button', { name: 'Publish', exact: true })
      .last()
      .click();
    await expect(modal).toContainText('Published successfully');
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();

    // The Published tab uses `status=published` = "all messages
    // regardless of status", so a delayed message appears here too — with
    // a `Scheduled` status badge, not `Pending`. Assert on the status,
    // not on emptiness.
    const row = page.locator(SEL.msgRow).first();
    await expect(page.locator(SEL.msgRow)).toHaveCount(1);
    await expect(row).toContainText('Scheduled');
    await expect(row).not.toContainText('Pending');

    // And it also appears in the Scheduled tab.
    await page.getByRole('tab', { name: 'Scheduled', exact: true }).click();
    await expect(page.locator(SEL.msgRow)).toHaveCount(1);
  });

  test('PUB-5: invalid JSON in body blocks submit, shows inline error', async ({
    page,
    queue,
  }) => {
    await page.goto(messagesUrl(queue));
    await page.getByRole('button', { name: 'Publish', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('#pm-body').fill('{bad json}');

    // Track network calls — none should fire.
    let requestFired = false;
    page.on('request', (req) => {
      if (req.method() === 'POST' && req.url().endsWith('/api/messages')) {
        requestFired = true;
      }
    });

    await modal
      .getByRole('button', { name: 'Publish', exact: true })
      .last()
      .click();

    await expect(modal.locator('.field-error')).toContainText(/Invalid JSON/i);
    expect(requestFired).toBe(false);
  });

  test('PUB-6: empty body disables Publish button', async ({ page, queue }) => {
    await page.goto(messagesUrl(queue));
    await page.getByRole('button', { name: 'Publish', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await expect(
      modal.getByRole('button', { name: 'Publish', exact: true }).last(),
    ).toBeDisabled();

    await modal.locator('#pm-body').fill('{"x":1}');
    await expect(
      modal.getByRole('button', { name: 'Publish', exact: true }).last(),
    ).toBeEnabled();
  });

  test('PUB-8: publish through fanout exchange routes to bound queue', async ({
    page,
    queue,
    fanoutExchange,
  }) => {
    await page.goto(messagesUrl(queue));
    await page.getByRole('button', { name: 'Publish', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.getByRole('radio', { name: 'Through exchange' }).check();

    await modal.locator('#pm-exchange-ns').fill(fanoutExchange.ns);
    await modal.locator('#pm-exchange-name').fill(fanoutExchange.name);
    await modal.locator('#pm-exchange-type').selectOption({
      label: 'Fanout',
    });
    await modal.locator('#pm-body').fill('{"fanout":true}');

    await modal
      .getByRole('button', { name: 'Publish', exact: true })
      .last()
      .click();
    await expect(modal).toContainText('Published successfully');
    await modal
      .getByRole('button', { name: 'Close', exact: true })
      .last()
      .click();

    // `queue` is bound to `fanoutExchange` via the fixture — the message
    // arrives here even though it was published to the exchange.
    await expect(page.locator(SEL.msgRow)).toHaveCount(1);
  });

  test('PUB-9: routingKey is a sibling of direct, not nested inside it', async ({
    page,
    queue,
    directExchange,
  }) => {
    await page.goto(messagesUrl(queue));
    await page.getByRole('button', { name: 'Publish', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.getByRole('radio', { name: 'Through exchange' }).check();

    await modal.locator('#pm-exchange-ns').fill(directExchange.ns);
    await modal.locator('#pm-exchange-name').fill(directExchange.name);
    await modal.locator('#pm-exchange-type').selectOption({
      label: 'Direct',
    });
    await modal.locator('#pm-routing-key').fill('user.created');
    await modal.locator('#pm-body').fill('{"direct":true}');

    const [req] = await Promise.all([
      expectRequest(page, { method: 'POST', pathIncludes: '/api/messages' }),
      modal
        .getByRole('button', { name: 'Publish', exact: true })
        .last()
        .click(),
    ]);

    const body = getJsonBody(req) as {
      exchange: { direct?: Record<string, unknown>; routingKey?: string };
    };

    expect(body.exchange.direct).toBeDefined();
    expect(body.exchange.routingKey).toBe('user.created');
    // The nesting assertion:
    expect(body.exchange.direct!.routingKey).toBeUndefined();
  });

  test('PUB-11: Go to queue after success navigates to detail page', async ({
    page,
    queue,
  }) => {
    await page.goto(messagesUrl(queue));
    await page.getByRole('button', { name: 'Publish', exact: true }).click();

    const modal = page.locator(SEL.modal);
    await modal.locator('#pm-body').fill('{"x":1}');
    await modal
      .getByRole('button', { name: 'Publish', exact: true })
      .last()
      .click();
    await expect(modal).toContainText('Published successfully');

    await modal.getByRole('button', { name: 'Go to queue' }).click();

    await expect(page).toHaveURL(
      new RegExp(`/ns/${queue.ns}/queues/${queue.name}$`),
    );
  });
});
