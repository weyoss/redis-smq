/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  EExchangeQueuePolicy,
  RedisSMQ,
  type IExchangeDirect,
  type IExchangeFanout,
  type IExchangeParams,
  type IExchangeTopic,
  type IQueueParams,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from './queue.js';

/**
 * Shared fixtures for the exchange test files.
 *
 * Every exchange test needs the same three things:
 *
 *   - A queue and an exchange in the same namespace, with the exchange
 *     already created (binding requires an existing exchange — lazy
 *     creation is not part of the contract).
 *   - A way to create N additional queues in the fixture's namespace
 *     for the tests that exercise multi-queue routing.
 *   - A deterministic order for comparing lists of queue params, since
 *     the framework does not document the order its accessors return.
 */

// ---------------------------------------------------------------------------
// Fixture types
// ---------------------------------------------------------------------------

/**
 * A direct-exchange fixture: a queue, the exchange params, and the
 * created exchange handle.
 */
export interface IDirectFixture {
  queue: IQueueParams;
  exchange: IExchangeParams;
  exchangeInstance: IExchangeDirect;
}

/**
 * A topic-exchange fixture. Same shape as `IDirectFixture`; the
 * handle's method signatures take patterns instead of routing keys.
 */
export interface ITopicFixture {
  queue: IQueueParams;
  exchange: IExchangeParams;
  exchangeInstance: IExchangeTopic;
}

/**
 * A fanout-exchange fixture. The handle's methods take only the queue
 * and the exchange — no routing key, no pattern.
 */
export interface IFanoutFixture {
  queue: IQueueParams;
  exchange: IExchangeParams;
  exchangeInstance: IExchangeFanout;
}

// ---------------------------------------------------------------------------
// Fixture factories
// ---------------------------------------------------------------------------

/**
 * Create a queue and a direct exchange in the same namespace, and
 * create the exchange.
 *
 * The queue is registered via `createQueue`; the exchange is created
 * via its own `create` call. Both are ready for the caller to bind
 * against immediately.
 *
 * The exchange name is derived from the queue name as `ex-<queue>`,
 * the convention every exchange test file used before extraction. It
 * makes the pairing legible in failure output.
 */
export async function makeDirectFixture(
  prefix: string,
): Promise<IDirectFixture> {
  const queue = uniqueQueue(prefix);
  await createQueue(queue);

  const exchange: IExchangeParams = {
    ns: queue.ns,
    name: `ex-${queue.name}`,
  };
  const exchangeInstance = RedisSMQ.createDirectExchange();
  await exchangeInstance.create(exchange, EExchangeQueuePolicy.STANDARD);

  return { queue, exchange, exchangeInstance };
}

/**
 * Create a queue and a topic exchange in the same namespace, and
 * create the exchange.
 */
export async function makeTopicFixture(prefix: string): Promise<ITopicFixture> {
  const queue = uniqueQueue(prefix);
  await createQueue(queue);

  const exchange: IExchangeParams = {
    ns: queue.ns,
    name: `ex-${queue.name}`,
  };
  const exchangeInstance = RedisSMQ.createTopicExchange();
  await exchangeInstance.create(exchange, EExchangeQueuePolicy.STANDARD);

  return { queue, exchange, exchangeInstance };
}

/**
 * Create a queue and a fanout exchange in the same namespace, and
 * create the exchange.
 */
export async function makeFanoutFixture(
  prefix: string,
): Promise<IFanoutFixture> {
  const queue = uniqueQueue(prefix);
  await createQueue(queue);

  const exchange: IExchangeParams = {
    ns: queue.ns,
    name: `ex-${queue.name}`,
  };
  const exchangeInstance = RedisSMQ.createFanoutExchange();
  await exchangeInstance.create(exchange, EExchangeQueuePolicy.STANDARD);

  return { queue, exchange, exchangeInstance };
}

// ---------------------------------------------------------------------------
// Queue-set helpers
// ---------------------------------------------------------------------------

/**
 * Create `count` distinct queues in the same namespace and return them
 * in the order they were created.
 *
 * Used by the tests that exercise multi-queue routing — a direct
 * exchange with two queues bound under one key, a topic exchange with
 * queues across several patterns, and so on.
 */
export async function makeQueues(
  prefix: string,
  count: number,
): Promise<IQueueParams[]> {
  const queues: IQueueParams[] = [];
  for (let i = 0; i < count; i += 1) {
    const q = uniqueQueue(`${prefix}-${i}`);
    await createQueue(q);
    queues.push(q);
  }
  return queues;
}

/**
 * Sort queue params by `(ns, name)` so comparisons ignore iteration
 * order.
 *
 * The framework's accessors do not document a return order, so any
 * assertion that compares two `IQueueParams[]` values uses this to
 * make the comparison order-independent.
 */
export function sortQueues(queues: IQueueParams[]): IQueueParams[] {
  return [...queues].sort((a, b) =>
    a.ns === b.ns ? a.name.localeCompare(b.name) : a.ns.localeCompare(b.ns),
  );
}
