/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for synchronous throws from handlers.
 *
 * A synchronous throw is an exception that escapes the handler's
 * function call *before* the handler has returned anything and *before*
 * the callback has been invoked. RedisSMQ catches it with a
 * try/catch around the invocation:
 *
 *     let result: unknown;
 *     try {
 *       result = handler(msg, once);
 *     } catch (err) {
 *       return once(err instanceof Error ? err : new Error(String(err)));
 *     }
 *
 * That try/catch is the only reason a synchronous throw doesn't escape
 * into the consumer's dequeue loop and take down the runner. Its absence
 * would be a serious bug — one that only this file would catch, because
 * every other handler form produces a Promise or invokes the callback.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A non-async handler that throws the given value.
 *
 * The handler is deliberately not `async` — the point of this file is
 * RedisSMQ's synchronous catch, which an `async` function would
 * bypass by returning a rejected Promise instead.
 *
 * `arity` selects between the callback form (2) and the promise form (1).
 * Both must produce the same behavior; RedisSMQ's catch does not
 * inspect arity.
 */
function syncThrowingHandler(
  thrown: unknown,
  arity: 1 | 2 = 2,
): (msg: IMessageTransferable, cb?: ICallback) => void {
  if (arity === 1) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return (_msg: IMessageTransferable) => {
      throw thrown;
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (_msg: IMessageTransferable, _cb?: ICallback) => {
    throw thrown;
  };
}

/**
 * A handler that calls `cb()` and then throws.
 *
 * The throw escapes the function call, and RedisSMQ's catch routes
 * it through `once(err)`. Because `once` was already called (via `cb`),
 * `settled` is true and the second invocation is a no-op. The ack is the
 * recorded outcome; the throw is discarded.
 */
function throwsAfterCallback(): (
  msg: IMessageTransferable,
  cb: ICallback,
) => void {
  return (_msg: IMessageTransferable, cb: ICallback) => {
    cb();
    throw new Error('thrown after cb');
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Handler that throws synchronously', () => {
  // -------------------------------------------------------------------------
  // Basic throw
  // -------------------------------------------------------------------------

  describe('basic throw', () => {
    it('dead-letters the message when retryThreshold is 0', async () => {
      const queue = uniqueQueue('sync-throw-dl');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: syncThrowingHandler(new Error('simulated failure')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('sync-throw')
          .setRetryThreshold(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered after sync throw`,
      });

      // The message reached the dead-letter list specifically, not
      // merely "some terminal state". A regression that dropped the
      // message instead of unacking it would fail here even if the
      // status happened to read as terminal.
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
      'treats a sync throw of %s as a failure and dead-letters',
      async (_label, thrown) => {
        const queue = uniqueQueue('sync-throw-nonerror');
        await createQueue(queue, EQueueType.FIFO_QUEUE);

        const consumer = await getConsumer({
          queue,
          messageHandler: syncThrowingHandler(thrown),
        });

        const producer = await startProducer();
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody('sync-throw-nonerror')
            .setRetryThreshold(0),
        );

        await consumer.run();

        await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
          timeoutMs: 10_000,
          description: `message ${id} dead-lettered after non-Error sync throw`,
        });
      },
    );
  });

  // -------------------------------------------------------------------------
  // Arity independence
  // -------------------------------------------------------------------------

  describe('arity independence', () => {
    it('catches a sync throw from a one-parameter handler', async () => {
      const queue = uniqueQueue('sync-throw-arity-1');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: syncThrowingHandler(new Error('arity-1 throw'), 1),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('sync-throw-arity-1')
          .setRetryThreshold(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered after arity-1 sync throw`,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Retry
  // -------------------------------------------------------------------------

  describe('retry', () => {
    it('requeues the message when retries remain, and a later delivery succeeds', async () => {
      const queue = uniqueQueue('sync-throw-retry');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let callCount = 0;
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
          callCount += 1;
          if (callCount === 1) {
            throw new Error('first attempt fails');
          }
          // Second attempt succeeds — invoking the callback acks the
          // message.
          cb();
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
      // for the successful retry.
      expect(callCount).toBe(2);

      // The message state confirms RedisSMQ's count matches.
      const state = await RedisSMQ.createMessageManager().getMessageState(id);
      expect(state.attempts).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Throw after callback
  // -------------------------------------------------------------------------

  describe('throw after callback', () => {
    it('does not undo the ack when the handler throws after calling cb()', async () => {
      const queue = uniqueQueue('sync-throw-after-cb');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: throwsAfterCallback(),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('ack-then-throw')
          .setRetryThreshold(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 10_000,
        description: `message ${id} acknowledged despite post-callback throw`,
      });

      // Neither the dead-letter nor the pending list should have
      // entries — the message went straight to acknowledged.
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      expect(await deadLettered.countMessages(queue)).toBe(0);

      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      expect(await acknowledged.countMessages(queue)).toBe(1);
    });
  });
});
