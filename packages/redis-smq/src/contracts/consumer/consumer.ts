/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, Runnable } from 'redis-smq-common';
import {
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../queue-manager/index.js';
import { IConsumerQueuesWithStatus } from './consumer-queues.js';
import { TConsumerMessageHandler } from './message-handler.js';
import { TConsumerEvent } from '../event-bus/index.js';

/**
 * Processes messages from one or more queues.
 *
 * A Consumer owns a set of message handlers, one per queue (plus consumer
 * group for PUB/SUB queues). After `run()`, each handler is subscribed
 * and its dequeue loop is active. Handlers may be added before or after
 * `run()`; those added before are started when the consumer starts,
 * those added after start immediately if the consumer is running and the
 * queue is ACTIVE.
 *
 * The contract expresses both the promise and callback forms of every
 * asynchronous method. The concrete `Consumer` class provides both; this
 * interface declares both so that callers programming against `IConsumer`
 * are not restricted to one style.
 */
export interface IConsumer extends Runnable<TConsumerEvent> {
  /**
   * Registers a message handler for a queue.
   *
   * The handler can be:
   *   - a callback function: `(msg, cb) => void`
   *   - a promise function: `async (msg) => Promise<void>`
   *   - a module path: a string ending in `.js` or `.cjs` pointing to a
   *     file that exports a handler function
   *
   * The queue can be specified as a plain name, `{ name, ns }`, or a
   * fully-parsed `{ queueParams, groupId }`. For PUB/SUB queues, an
   * ephemeral group is generated if no `groupId` is provided.
   *
   * @example
   * // Promise
   * await consumer.consume('orders', async (msg) => {
   *   await processOrder(msg.getBody());
   * });
   *
   * // Callback
   * consumer.consume('orders', (msg, cb) => {
   *   processOrder(msg.getBody()).then(() => cb(), cb);
   * });
   */
  consume(
    queue: TQueueExtendedParams,
    handler: TConsumerMessageHandler,
  ): Promise<void>;
  consume(
    queue: TQueueExtendedParams,
    handler: TConsumerMessageHandler,
    cb: ICallback<void>,
  ): void;

  /**
   * Stops the message handler for a queue and removes its configuration.
   *
   * If the handler is using an ephemeral consumer group (PUB/SUB queues
   * without an explicit group ID), the group is deleted after the
   * consumer is unsubscribed.
   *
   * A call for a queue the consumer is not handling is a no-op.
   */
  cancel(queue: TQueueExtendedParams): Promise<void>;
  cancel(queue: TQueueExtendedParams, cb: ICallback<void>): void;

  /**
   * Returns the queues this consumer is configured to handle, with their
   * effective consumer group ID (an ephemeral ID for PUB/SUB queues
   * without an explicit group).
   */
  getQueues(): IQueueParsedParams[];

  /**
   * Returns the queues this consumer is handling, each with a status of
   * `'active'` (a running handler instance exists) or `'stopped'` (the
   * configuration is present but no instance is running — for example,
   * because the queue is PAUSED or STOPPED).
   */
  getQueuesWithStatus(): IConsumerQueuesWithStatus[];
}
