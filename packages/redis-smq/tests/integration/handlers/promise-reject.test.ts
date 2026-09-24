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
 * Integration tests for handlers that return a rejected Promise.
 *
 * A promise-style handler is invoked with the message only:
 *
 *     (msg: IMessageTransferable) => Promise<void>
 *
 * A rejected Promise is the failure signal. RedisSMQ detects it by
 * checking whether the handler's return value is thenable and, if so,
 * attaching a rejection handler:
 *
 *     result.then(() => once(), (err) => once(normalize(err)));
 *
 * `normalize(err)` is `err instanceof Error ? err : new Error(String(err))`.
 * RedisSMQ wraps non-Error rejection values so downstream code (the
 * unacknowledgement pipeline, the logger, the classifier) can rely on
 * receiving an `Error`. The wrapping is not observable through the
 * message outcome — it only affects internal code paths — so the tests
 * below pin the user-visible contract (rejection is treated as a failure)
 * and not the internal normalization (which error object arrives at the
 * pipeline). Where the normalization has an observable consequence, it's
 * called out in the individual test.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A promise-returning handler that rejects with the given value.
 *
 * The handler is declared with arity 1 so `MessageConsumer.validateHandler`
 * accepts it. The return type is `Promise<never>` — always rejects — which
 * is assignable to `Promise<void>`.
 *
 * Not `async`. Using `Promise.reject(...)` directly makes the intent
 * "this handler returns a rejected promise" explicit, and avoids the
 * linter suggestion to replace `return Promise.reject(...)` with `throw`
 * inside an async function. The runtime behavior is identical to
 * `async (msg) => { throw ... }`; the syntactic distinction is what this
 * file is about.
 */
function rejectingHandler(
  rejection: unknown,
): (msg: IMessageTransferable) => Promise<never> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (_msg: IMessageTransferable) => Promise.reject(rejection);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Handler returning a rejected Promise', () => {
  // -------------------------------------------------------------------------
  // Basic rejection
  // -------------------------------------------------------------------------

  describe('basic rejection', () => {
    it('dead-letters the message when retryThreshold is 0', async () => {
      const queue = uniqueQueue('promise-reject-dl');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: rejectingHandler(new Error('simulated failure')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('reject')
          .setRetryThreshold(0),
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered after promise rejection`,
      });

      // Dead-letter, not acknowledged, not pending. The list membership
      // is the stronger assertion — a status transition without the
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
  // Non-Error rejection values
  // -------------------------------------------------------------------------

  describe('non-Error rejection values', () => {
    it.each<[string, unknown]>([
      ['undefined (Promise.reject() with no argument)', undefined],
      ['null', null],
      ['a string', 'a bare string rejection'],
      ['a number', 42],
      ['a plain object', { code: 'E_FAIL', message: 'not an Error' }],
    ])(
      'treats a rejection with %s as a failure and dead-letters',
      async (_label, rejection) => {
        const queue = uniqueQueue('promise-reject-nonerror');
        await createQueue(queue, EQueueType.FIFO_QUEUE);

        const consumer = await getConsumer({
          queue,
          messageHandler: rejectingHandler(rejection),
        });

        const producer = await startProducer();
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody('reject-nonerror')
            .setRetryThreshold(0),
        );

        await consumer.run();

        await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
          timeoutMs: 10_000,
          description: `message ${id} dead-lettered after non-Error rejection`,
        });
      },
    );
  });

  // -------------------------------------------------------------------------
  // Unacknowledgement cause
  // -------------------------------------------------------------------------

  describe('unacknowledgement cause', () => {
    it('records the cause as UNACKNOWLEDGED', async () => {
      const queue = uniqueQueue('promise-reject-cause');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: rejectingHandler(new Error('simulated failure')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('reject-cause')
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
      // The handler rejects on the first delivery and succeeds on the
      // second. With the default retry threshold (3), the first rejection
      // requeues the message rather than dead-lettering it, and the
      // second delivery acks.
      //
      // This pins two things the terminal-state tests above cannot:
      //
      //   1. A rejected promise is not automatically terminal. It's a
      //      failure that goes through the same retry pipeline as any
      //      other unack.
      //
      //   2. The message survives the rejection — it isn't dropped, and
      //      it isn't double-delivered. The message manager's attempts
      //      count is the ground truth for "how many times was this
      //      delivered", and the final state is ACKNOWLEDGED, which
      //      can only happen after a successful handler run.
      const queue = uniqueQueue('promise-reject-retry');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let callCount = 0;
      const consumer = await getConsumer({
        queue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        messageHandler: (_msg: IMessageTransferable) => {
          callCount += 1;
          if (callCount === 1) {
            return Promise.reject(new Error('first attempt fails'));
          }
          // Second attempt succeeds.
          return Promise.resolve();
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

      // The handler was invoked exactly twice: once for the rejection,
      // once for the successful retry. A duplicate delivery would push
      // this above 2; a lost message would leave it at 1.
      expect(callCount).toBe(2);

      // The message state's attempts counter confirms RedisSMQ's
      // view matches the handler's view. `attempts` is incremented by
      // CHECKOUT_MESSAGE before the handler runs, so after two deliveries
      // it's 2.
      const state = await RedisSMQ.createMessageManager().getMessageState(id);
      expect(state.attempts).toBe(2);
    });
  });
});
