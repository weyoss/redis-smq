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
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { expectMessageStatus } from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for handlers that return a resolved Promise.
 *
 * A promise-style handler is invoked with the message only:
 *
 *     (msg: IMessageTransferable) => Promise<void>
 *
 * Resolution is the acknowledgement signal. RedisSMQ detects the
 * return value's thenable shape and attaches a resolution handler:
 *
 *     result.then(
 *       () => once(),                             // ← resolved: ack
 *       (err) => once(normalize(err)),            // ← rejected: unack
 *     );
 *
 * Two contracts fall directly out of that line, and this file tests both:
 *
 *   1. THE RESOLVED VALUE IS DISCARDED. `.then(() => once())` takes no
 *      parameter. A handler resolving with `{ success: true }` and one
 *      resolving with `undefined` are indistinguishable from the
 *      framework's perspective. A refactor that started inspecting the
 *      resolved value — looking for an error field, a status, a
 *      callback-style result — would change the contract silently, and
 *      would break every async handler written under the current model.
 *
 *   2. THE ACK WAITS FOR SETTLEMENT, NOT FOR RETURN. An `async` function
 *      returns a Promise immediately, synchronously, at its first `await`
 *      or at the end of its synchronous prefix. RedisSMQ attaches
 *      `.then()` to that Promise, so the ack fires when the *Promise*
 *      resolves, not when the function returns. A handler with internal
 *      `await`s therefore delays the ack by the duration of those awaits.
 *      A refactor that acked on function return would call `once()`
 *      before the handler's own work finished — which for any handler
 *      that awaits external I/O before declaring success would be wrong.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A promise-returning handler that resolves with the given value.
 *
 * The handler is declared with arity 1 so `MessageConsumer.validateHandler`
 * accepts it. Arity 0 would be rejected with
 * `InvalidMessageHandlerSignatureError` — RedisSMQ requires at least
 * one parameter to receive the message.
 *
 * Not `async`. Using `Promise.resolve(...)` directly keeps the intent
 * explicit — "this handler returns a resolved Promise" — and avoids the
 * `return-await` lint rule that would suggest removing the `await` from
 * an `async` function whose only statement is a return.
 */
function resolvingHandler(
  resolveValue?: unknown,
): (msg: IMessageTransferable) => Promise<unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (_msg: IMessageTransferable) => Promise.resolve(resolveValue);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Handler returning a resolved Promise', () => {
  // -------------------------------------------------------------------------
  // Basic acknowledgement
  // -------------------------------------------------------------------------

  describe('basic acknowledgement', () => {
    it('acks the message when the handler resolves', async () => {
      const queue = uniqueQueue('promise-resolve');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: resolvingHandler(),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('resolve'),
      );

      // Subscribe before run — the subscribe-before-trigger contract
      // documented in `await-event.ts`.
      const acked = untilMessageAcknowledged(consumer, id);

      await consumer.run();
      await acked;

      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);

      // The message is in the acknowledged list, not the dead-letter
      // list, and not still pending. A status assertion alone would miss
      // a bug where the state machine and the list bookkeeping diverge.
      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      expect(await acknowledged.countMessages(queue)).toBe(1);

      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);
    });

    it('invokes the handler with the full IMessageTransferable', async () => {
      const queue = uniqueQueue('promise-shape');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Capture the message without wrapping the handler in vi.fn().
      // Vitest's `vi.fn(impl)` returns a spy whose arity may not match
      // `impl`'s — and RedisSMQ's validator rejects any handler
      // whose arity is not 1 or 2. Capturing manually sidesteps the
      // wrapper entirely.
      const received: IMessageTransferable[] = [];
      const consumer = await getConsumer({
        queue,
        messageHandler: async (msg: IMessageTransferable) => {
          received.push(msg);
        },
      });

      const producer = await startProducer();
      const body = { hello: 'world', nested: { ok: true } };
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody(body),
      );

      const acked = untilMessageAcknowledged(consumer, id);
      await consumer.run();
      await acked;

      expect(received).toHaveLength(1);

      const msg = received[0];
      expect(msg.id).toBe(id);
      expect(msg.body).toEqual(body);
      expect(msg.destinationQueue).toEqual(queue);
    });
  });

  // -------------------------------------------------------------------------
  // Resolution value is discarded
  // -------------------------------------------------------------------------

  describe('resolution value semantics', () => {
    it.each<[string, unknown]>([
      ['undefined', undefined],
      ['null', null],
      ['a string', 'hello'],
      ['a number', 42],
      ['a plain object', { ok: true }],
      ['an array', [1, 2, 3]],
    ])(
      'acks when the handler resolves with %s',
      async (_label, resolveValue) => {
        const queue = uniqueQueue('promise-value');
        await createQueue(queue, EQueueType.FIFO_QUEUE);

        const consumer = await getConsumer({
          queue,
          messageHandler: resolvingHandler(resolveValue),
        });

        const producer = await startProducer();
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(queue)
            .setBody('resolve-value'),
        );

        const acked = untilMessageAcknowledged(consumer, id);
        await consumer.run();
        await acked;

        await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
      },
    );
  });

  // -------------------------------------------------------------------------
  // Ack waits for settlement, not for return
  // -------------------------------------------------------------------------

  describe('settlement semantics', () => {
    it('does not ack until the handler Promise settles', async () => {
      const queue = uniqueQueue('promise-settlement');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      let handlerWorkComplete = false;
      const consumer = await getConsumer({
        queue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        messageHandler: async (_msg: IMessageTransferable) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          handlerWorkComplete = true;
        },
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('wait-for-me'),
      );

      const acked = untilMessageAcknowledged(consumer, id);
      await consumer.run();
      await acked;

      // By the time the ack fires, the handler's awaited work must have
      // completed. This is the ordering contract: the ack is downstream
      // of the promise's resolution, which is downstream of the
      // handler's internal awaits.
      expect(handlerWorkComplete).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple messages
  // -------------------------------------------------------------------------

  describe('multiple messages', () => {
    it('acks every message when the handler resolves for each', async () => {
      const queue = uniqueQueue('promise-many');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        messageHandler: async (_msg: IMessageTransferable) => {
          // no-op: resolving is the ack signal
        },
      });

      const producer = await startProducer();
      const ids: string[] = [];
      for (let i = 0; i < 5; i += 1) {
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody({ seq: i }),
        );
        ids.push(id);
      }

      // All awaiters before run — creating any awaiter after
      // `consumer.run()` risks subscribing to an event that has already
      // fired, which is the subscribe-before-trigger contract.
      const ackedPromises = ids.map((id) =>
        untilMessageAcknowledged(consumer, id),
      );

      await consumer.run();
      await Promise.all(ackedPromises);

      for (const id of ids) {
        await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
      }

      // All five are in the acknowledged list, nothing is left pending.
      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      expect(await acknowledged.countMessages(queue)).toBe(5);

      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);
    });
  });
});
