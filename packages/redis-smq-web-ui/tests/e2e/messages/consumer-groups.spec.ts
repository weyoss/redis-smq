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

test.describe('Messages — consumer group pending view', () => {
  test('CG-1: pub/sub pending shows group selector', async ({
    page,
    pubSubQueueWithGroup,
  }) => {
    await page.goto(
      `/ns/${pubSubQueueWithGroup.ns}/queues/${pubSubQueueWithGroup.name}/messages?type=pending`,
    );

    // Selector card visible, group listed.
    await expect(page.locator(SEL.cgRow)).toHaveCount(1);
    await expect(page.locator(SEL.cgName).first()).toHaveText(
      pubSubQueueWithGroup.consumerGroupId,
    );

    // No message rows yet — user must pick a group.
    await expect(page.locator(SEL.msgRow)).toHaveCount(0);
  });

  test('CG-2: selecting a group appends consumerGroupId to URL', async ({
    page,
    pubSubQueueWithGroup,
  }) => {
    await page.goto(
      `/ns/${pubSubQueueWithGroup.ns}/queues/${pubSubQueueWithGroup.name}/messages?type=pending`,
    );

    await page.locator(SEL.cgRow).first().click();

    await expect(page).toHaveURL(
      new RegExp(`consumerGroupId=${pubSubQueueWithGroup.consumerGroupId}`),
    );
  });

  test('CG-4: group selected banner visible', async ({
    page,
    pubSubQueueWithGroup,
  }) => {
    await page.goto(
      `/ns/${pubSubQueueWithGroup.ns}/queues/${pubSubQueueWithGroup.name}/messages` +
        `?type=pending&consumerGroupId=${pubSubQueueWithGroup.consumerGroupId}`,
    );

    const banner = page.locator(SEL.groupBanner);
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(pubSubQueueWithGroup.consumerGroupId);
  });

  test('CG-5: Change group clears consumerGroupId from URL', async ({
    page,
    pubSubQueueWithGroup,
  }) => {
    await page.goto(
      `/ns/${pubSubQueueWithGroup.ns}/queues/${pubSubQueueWithGroup.name}/messages` +
        `?type=pending&consumerGroupId=${pubSubQueueWithGroup.consumerGroupId}`,
    );

    await page.locator(SEL.groupBannerChange).click();

    await expect(page).not.toHaveURL(/consumerGroupId=/);
    // Back to the selector.
    await expect(page.locator(SEL.cgRow)).toHaveCount(1);
  });

  test('CG-8: point-to-point pending bypasses selector', async ({
    page,
    queue,
  }) => {
    await page.goto(
      `/ns/${queue.ns}/queues/${queue.name}/messages?type=pending`,
    );

    // No group selector shown.
    await expect(page.locator(SEL.cgRow)).toHaveCount(0);
    // Empty state renders directly.
    await expect(page.locator(SEL.stateEmpty).first()).toBeVisible();
  });
});
