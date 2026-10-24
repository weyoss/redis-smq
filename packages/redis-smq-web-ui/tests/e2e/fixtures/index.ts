/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test as base, expect, type TestInfo } from '@playwright/test';
import { apiClient, type ExchangeRef, type QueueRef } from './api.js';
import {
  seedConsumerGroup,
  seedExchange,
  seedMessages,
  seedQueue,
} from './seed.js';
import { cleanupExchange, cleanupQueue } from './cleanup.js';
import { QueueDetailPage } from './pages.js';
import { DELIVERY_MODEL, EXCHANGE_TYPE } from '../helpers/constants.js';
import { publishAndDeadLetter } from '../helpers/publish-and-dead-letter.js';
import { publishAndAcknowledge } from '../helpers/publish-and-acknowledge.js';

export interface QueueWithMessages extends QueueRef {
  messageIds: { published: string[]; scheduled: string[] };
}

export interface PubSubQueueWithGroup extends QueueRef {
  consumerGroupId: string;
}

export interface QueueWithDeadLettered extends QueueRef {
  deadLetteredIds: string[];
}

export interface QueueWithAcknowledged extends QueueRef {
  acknowledgedIds: string[];
}

type TestFixtures = {
  api: ReturnType<typeof apiClient>;
  queue: QueueRef;
  pubSubQueue: QueueRef;
  pubSubQueueWithGroup: PubSubQueueWithGroup;
  queueWithMessages: QueueWithMessages;
  queueWithDeadLettered: QueueWithDeadLettered;
  queueWithAcknowledged: QueueWithAcknowledged;
  directExchange: ExchangeRef & { routingKey: string };
  fanoutExchange: ExchangeRef;
  topicExchange: ExchangeRef & { routingPattern: string };
  queueDetailPage: QueueDetailPage;
};

type WorkerFixtures = {
  /** Origin of the API the browser is actually talking to. */
  apiBaseUrl: string;
};

function uniqueName(testInfo: TestInfo, prefix: string): string {
  const slug = testInfo.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 20)
    .replace(/^-+|-+$/g, '');
  return `${prefix}-${slug}-${Date.now().toString(36)}`;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  /**
   * Worker-scoped: opens one probe page, waits for the first `/api/…`
   * request fired by the app, and returns its origin. This is the only
   * reliable way to know which backend the browser is talking to —
   * window.configs may not be set yet, and process.env.VITE_API_URL can
   * diverge from the value Vite baked into the bundle.
   *
   * Runs once per worker, not once per test.
   */
  apiBaseUrl: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      const firstApiCall = page.waitForRequest(
        (req) => {
          try {
            return new URL(req.url()).pathname.startsWith('/api/');
          } catch {
            return false;
          }
        },
        { timeout: 15_000 },
      );

      await page.goto('/');

      const req = await firstApiCall;
      const origin = new URL(req.url()).origin;

      await context.close();
      await use(origin);
    },
    { scope: 'worker' },
  ],

  api: async ({ request, apiBaseUrl }, use) => {
    await use(apiClient(request, apiBaseUrl));
  },

  queue: async ({ api }, use, testInfo) => {
    const q = await seedQueue(api, { name: uniqueName(testInfo, 'q') });
    await use(q);
    await cleanupQueue(api, q);
  },

  pubSubQueue: async ({ api }, use, testInfo) => {
    const q = await seedQueue(api, {
      name: uniqueName(testInfo, 'ps'),
      queueDeliveryModel: DELIVERY_MODEL.PUB_SUB,
    });
    await use(q);
    await cleanupQueue(api, q);
  },

  pubSubQueueWithGroup: async ({ api }, use, testInfo) => {
    const q = await seedQueue(api, {
      name: uniqueName(testInfo, 'psg'),
      queueDeliveryModel: DELIVERY_MODEL.PUB_SUB,
    });
    const consumerGroupId = `g-${Date.now().toString(36)}`;
    await seedConsumerGroup(api, q, consumerGroupId);
    await use({ ...q, consumerGroupId });
    await cleanupQueue(api, q);
  },

  queueWithMessages: async ({ api }, use, testInfo) => {
    const q = await seedQueue(api, { name: uniqueName(testInfo, 'qm') });
    const messageIds = await seedMessages(api, q, {
      published: 3,
      scheduled: 2,
    });
    await use({ ...q, messageIds });
    await cleanupQueue(api, q);
  },

  // Seeds a queue with one message driven to DEAD_LETTERED via a
  // throwaway producer + failing consumer. See
  // helpers/publish-and-dead-letter.ts for the mechanics.
  queueWithDeadLettered: async ({ api }, use, testInfo) => {
    const q = await seedQueue(api, { name: uniqueName(testInfo, 'dl') });
    const deadLetteredIds = await publishAndDeadLetter(q);
    await use({ ...q, deadLetteredIds });
    await cleanupQueue(api, q);
  },

  // Seeds a queue with one message driven to ACKNOWLEDGED via a
  // throwaway producer + succeeding consumer. Requires the
  // messageAudit.acknowledgedMessages feature enabled — done by
  // global-setup.ts.
  queueWithAcknowledged: async ({ api }, use, testInfo) => {
    const q = await seedQueue(api, { name: uniqueName(testInfo, 'ack') });
    const acknowledgedIds = await publishAndAcknowledge(q);
    await use({ ...q, acknowledgedIds });
    await cleanupQueue(api, q);
  },

  directExchange: async ({ api, queue }, use, testInfo) => {
    const routingKey = 'test.routing.key';
    const ex = await seedExchange(api, {
      name: uniqueName(testInfo, 'ex'),
      type: EXCHANGE_TYPE.DIRECT,
      bindTo: [{ queue, routingKey }],
    });
    await use({ ...ex, routingKey });
    await cleanupExchange(api, ex);
  },

  fanoutExchange: async ({ api, queue }, use, testInfo) => {
    const ex = await seedExchange(api, {
      name: uniqueName(testInfo, 'fan'),
      type: EXCHANGE_TYPE.FANOUT,
      bindTo: [{ queue }],
    });
    await use(ex);
    await cleanupExchange(api, ex);
  },

  topicExchange: async ({ api, queue }, use, testInfo) => {
    const routingPattern = 'user.*';
    const ex = await seedExchange(api, {
      name: uniqueName(testInfo, 'top'),
      type: EXCHANGE_TYPE.TOPIC,
      bindTo: [{ queue, routingPattern }],
    });
    await use({ ...ex, routingPattern });
    await cleanupExchange(api, ex);
  },

  queueDetailPage: async ({ page }, use) => {
    await use(new QueueDetailPage(page));
  },
});

export { expect };
