/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EMessagePropertyStatus,
  EMessageUnacknowledgementCause,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for async handlers that throw.
 *
 * A promise-style handler is invoked with the message only:
 *
 *     (msg: IMessageTransferable) => Promise<void>
 *
 * When the handler is declared `async` and its body throws, the language
 * runtime converts the throw into a rejected Promise. RedisSMQ sees
 * a thenable whose rejection handler fires, exactly as it would for a
 * handler that returned `Promise.reject(err)` directly:
 *
 *     result.then(
 *       () => once(),                             // ← resolved
 *       (err) => once(normalize(err)),            // ← rejected (this branch)
 *     );
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * An async handler that throws the given value.
 *
 * The handler is declared with arity 1 so `MessageConsumer.validateHandler`
 * accepts it. `async` functions have the same `Function.length` as their
 * non-async siblings; only the returned value differs.
 *
 * The throw is inside the function body, not a `return Promise.reject(...)`.
 * That is the syntactic form this file exists to cover — RedisSMQ
 * must handle the language-level throw (converted to a rejection by the
 * runtime) without any special handling of the `async` keyword.
 */
function throwingHandler(
  thrown: unknown,
): (msg: IMessageTransferable) => Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return async (_msg: IMessageTransferable) => {
    throw thrown;
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Async handler that throws', () => {
  // -------------------------------------------------------------------------
  // Basic throw
  // -------------------------------------------------------------------------

  describe('basic throw', () => {
    it('dead-letters the message when retryThreshold is 0', async () => {
      const queue = uniqueQueue('promise-throw-dl');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: throwingHandler(new Error('simulated failure')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('throw')
          .setRetryThreshold(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered after async throw`,
      });

      // Dead-letter, not acknowledged, not pending. The list membership
      // is the stronger claim — a status transition without the
      // corresponding list entry would be an inconsistent state.
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const page = await deadLettered.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(1);
      expect(page.items[0].id).toBe(id);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      expect(await acknowledged.countMessages(queue)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Non-Error thrown values
  // -------------------------------------------------------------------------

  describe('non-Error thrown values', () => {
    it.each<[string, unknown]>([
      ['undefined', undefined],
      ['null', null],
      ['a string', 'a bare string throw'],
      ['a number', 42],
      ['a plain object', { code: 'E_FAIL', message: 'not an Error' }],
    ])(
      'treats a throw of %s as a failure and dead-letters',
      async (_label, thrown) => {
        const queue = uniqueQueue('promise-throw-nonerror');
        await createQueue(queue, EQueueType.FIFO_QUEUE);

        const consumer = await getConsumer({
          queue,
          messageHandler: throwingHandler(thrown),
        });

        const producer = await startProducer();
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody('throw-nonerror')
            .setRetryThreshold(0),
        );

        await consumer.run();

        await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
          timeoutMs: 10_000,
          description: `message ${id} dead-lettered after non-Error throw`,
        });
      },
    );
  });

  // -------------------------------------------------------------------------
  // Unacknowledgement cause
  // -------------------------------------------------------------------------

  describe('unacknowledgement cause', () => {
    it('records the cause as UNACKNOWLEDGED', async () => {
      const queue = uniqueQueue('promise-throw-cause');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: throwingHandler(new Error('simulated failure')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('throw-cause')
          .setRetryThreshold(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered`,
      });

      const history =
        await RedisSMQ.createMessageManager().getMessageUnacknowledgementHistory(
          id,
        );

      // With retryThreshold 0, the message fails on its first delivery
      // and immediately dead-letters, so the history has exactly one
      // record.
      expect(history).toHaveLength(1);
      expect(history[0].cause).toBe(
        EMessageUnacknowledgementCause.UNACKNOWLEDGED,
      );
      expect(history[0].messageId).toBe(id);
    });
  });

  // -------------------------------------------------------------------------
  // Retry
  // -------------------------------------------------------------------------

  describe('retry', () => {
    it('requeues the message when retries remain, and a later delivery succeeds', async () => {
      const queue = uniqueQueue('promise-throw-retry');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let callCount = 0;
      const consumer = await getConsumer({
        queue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        messageHandler: async (_msg: IMessageTransferable) => {
          callCount += 1;
          if (callCount === 1) {
            throw new Error('first attempt fails');
          }
          // Second attempt succeeds — the async function resolves to
          // undefined, which RedisSMQ treats as an ack.
        },
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('retry-once')
          .setRetryThreshold(3)
          .setRetryDelay(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 15_000,
        description: `message ${id} acknowledged after one retry`,
      });

      // The handler was invoked exactly twice: once for the throw, once
      // for the successful retry. A duplicate delivery would push this
      // above 2; a lost message would leave it at 1.
      expect(callCount).toBe(2);

      const state = await RedisSMQ.createMessageManager().getMessageState(id);
      expect(state.attempts).toBe(2);
    });

    it('still fails the message when the handler throws after doing work', async () => {
      const queue = uniqueQueue('promise-throw-partial');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        messageHandler: async (_msg: IMessageTransferable) => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          throw new Error('failed after doing work');
        },
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('partial-then-throw')
          .setRetryThreshold(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered after partial work`,
      });

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const page = await deadLettered.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(1);
      expect(page.items[0].id).toBe(id);
    });
  });
});
