/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type {
  DeliveryModel,
  ExchangeQueuePolicy,
  ExchangeType,
  QueueType,
} from '../helpers/constants.js';
import type { ExchangeRef, QueueRef, apiClient } from './api.js';

let counter = 0;

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}-${(counter++).toString(36)}`;
}

/**
 * Create a queue with a unique name (unless one is provided) so tests
 * never collide, even when a cleanup step fails.
 */
export async function seedQueue(
  api: ReturnType<typeof apiClient>,
  opts: {
    name?: string;
    ns?: string;
    queueType?: QueueType;
    queueDeliveryModel?: DeliveryModel;
  } = {},
): Promise<QueueRef> {
  const queue: QueueRef = {
    ns: opts.ns ?? 'test',
    name: opts.name ?? `q-${uniqueSuffix()}`,
  };
  await api.createQueue(queue, {
    queueType: opts.queueType ?? 1, // FIFO
    queueDeliveryModel: opts.queueDeliveryModel ?? 0, // Point-to-point
  });
  return queue;
}

/**
 * Publish N messages to a queue.
 *
 * - `published`:  N immediate publishes.
 * - `scheduled`:  N publishes with `scheduledDelay` (default 60s — long
 *                 enough that they stay scheduled for the test duration).
 *
 * Dead-lettered and acknowledged messages can't be seeded this way —
 * they require a running consumer to fail or ack. Tests that need those
 * either run a consumer or skip the scenario (out of scope for fixtures).
 */
export async function seedMessages(
  api: ReturnType<typeof apiClient>,
  queue: QueueRef,
  counts: { published?: number; scheduled?: number; scheduledDelay?: number },
): Promise<{ published: string[]; scheduled: string[] }> {
  const published: string[] = [];
  const scheduled: string[] = [];

  for (let i = 0; i < (counts.published ?? 0); i++) {
    const { ids } = await api.publishMessage({
      exchange: { queue },
      message: { body: { seq: i, kind: 'published' } },
    });
    published.push(...ids);
  }

  for (let i = 0; i < (counts.scheduled ?? 0); i++) {
    const { ids } = await api.publishMessage({
      exchange: { queue },
      message: {
        body: { seq: i, kind: 'scheduled' },
        scheduledDelay: counts.scheduledDelay ?? 60_000,
      },
    });
    scheduled.push(...ids);
  }

  return { published, scheduled };
}

/**
 * Create an exchange and optionally bind one or more queues to it.
 * Routing key / pattern are supplied per binding; both are optional and
 * ignored by the server for the exchange types that don't use them.
 */
export async function seedExchange(
  api: ReturnType<typeof apiClient>,
  opts: {
    name?: string;
    ns?: string;
    type: ExchangeType;
    queuePolicy?: ExchangeQueuePolicy;
    bindTo?: Array<{
      queue: QueueRef;
      routingKey?: string;
      routingPattern?: string;
    }>;
  },
): Promise<ExchangeRef> {
  const exchange: QueueRef = {
    ns: opts.ns ?? 'test',
    name: opts.name ?? `ex-${uniqueSuffix()}`,
  };
  await api.createExchange(exchange, {
    type: opts.type,
    queuePolicy: opts.queuePolicy,
  });
  for (const binding of opts.bindTo ?? []) {
    await api.bindQueue(exchange.ns, exchange.name, binding.queue.name, {
      ...(binding.routingKey !== undefined && {
        routingKey: binding.routingKey,
      }),
      ...(binding.routingPattern !== undefined && {
        routingPattern: binding.routingPattern,
      }),
    });
  }
  return { ...exchange, type: opts.type };
}

/** Create a consumer group on a pub/sub queue. */
export async function seedConsumerGroup(
  api: ReturnType<typeof apiClient>,
  queue: QueueRef,
  consumerGroupId: string = `g-${uniqueSuffix()}`,
): Promise<string> {
  await api.createConsumerGroup(queue, consumerGroupId);
  return consumerGroupId;
}
