/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it, vi } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import {
  expectMessageStatus,
  waitForMessageStatus,
} from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { deferred } from '../../helpers/async/deferred.js';

/**
 * Integration tests for the callback-style message handler.
 *
 * The signature is:
 *
 *     (msg: IMessageTransferable, cb: ICallback<void>) => void
 *
 * The handler returns synchronously; RedisSMQ does not treat that
 * return as an ack. The callback invocation is the only completion signal
 * RedisSMQ recognizes. This is the crucial distinction between the
 * callback form and the promise form (`async (msg) => Promise<void>`):
 *
 *   - Promise form:  the handler's returned Promise resolving → ack,
 *                    rejecting → unack.
 *   - Callback form: the handler returns; RedisSMQ waits. `cb()`
 *                    later acks; `cb(new Error(...))` later unacks.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Callback-style message handler', () => {
  // -------------------------------------------------------------------------
  // Acknowledgement
  // -------------------------------------------------------------------------

  describe('acknowledgement', () => {
    it('acks the message when the callback is invoked with no arguments', async () => {
      const queue = uniqueQueue('cb-ack');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('ack-via-cb()'),
      );

      // Subscribe before run — see the note in `consume-message.test.ts`
      // for why the subscribe-then-run ordering matters even when the
      // consumer has not polled yet.
      const acked = untilMessageAcknowledged(consumer, id);

      await consumer.run();
      await acked;

      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
    });

    it('acks the message when the callback is invoked with null', async () => {
      const queue = uniqueQueue('cb-null-ack');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(null),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('ack-via-cb(null)'),
      );

      const acked = untilMessageAcknowledged(consumer, id);

      await consumer.run();
      await acked;

      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
    });
  });

  // -------------------------------------------------------------------------
  // Message shape
  // -------------------------------------------------------------------------

  describe('message shape', () => {
    it('invokes the handler with the full IMessageTransferable', async () => {
      const queue = uniqueQueue('cb-shape');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const handled = vi.fn();
      const consumer = await getConsumer({
        queue,
        messageHandler: (msg: IMessageTransferable, cb: ICallback) => {
          handled(msg);
          cb();
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

      // The handler runs exactly once for this message.
      expect(handled).toHaveBeenCalledTimes(1);

      const received = handled.mock.calls[0][0] as IMessageTransferable;
      expect(received.id).toBe(id);
      expect(received.body).toEqual(body);
      expect(received.destinationQueue).toEqual(queue);
    });
  });

  // -------------------------------------------------------------------------
  // Deferred callback — the distinctive contract of the callback form
  // -------------------------------------------------------------------------

  describe('deferred callback', () => {
    it('does not ack on handler return; it waits for the callback', async () => {
      // This test pins the central distinction between the callback form
      // and the promise form. A callback-style handler is permitted to
      // return before calling the callback — that is the whole point of
      // the callback style. RedisSMQ must therefore:
      //
      //   1. Invoke the handler.
      //   2. Observe that the handler returned without calling the
      //      callback.
      //   3. NOT ack the message (it is not finished yet).
      //   4. Wait indefinitely for the callback.
      //
      // A buggy framework that treated "handler returned" as "handler
      // completed successfully" would ack the message and then never
      // invoke the callback. The test detects this by checking that the
      // message is still in PROCESSING after the handler has returned.
      const queue = uniqueQueue('cb-deferred');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Capture the callback so the test body can invoke it explicitly
      // after confirming RedisSMQ is waiting.
      let capturedCb: ICallback | undefined;
      const handlerEntered = deferred();

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
          capturedCb = cb;
          handlerEntered.notify();
          // Deliberately do NOT call cb here. The handler returns; the
          // framework must wait.
        },
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('deferred-cb'),
      );

      await consumer.run();
      await handlerEntered.promise;

      // The handler has been invoked and has returned. Give RedisSMQ
      // a bounded window to process the return — if it were going to ack
      // on return, it would have done so within a microtask or two, and
      // the 200ms window is far more than enough.
      await new Promise((resolve) => setTimeout(resolve, 200));

      // The message must still be PROCESSING. Anything else means the
      // framework either acked on return (ACKNOWLEDGED) or treated the
      // missing callback as a failure (UNACK_*).
      await expectMessageStatus(id, EMessagePropertyStatus.PROCESSING);

      // Now invoke the captured callback. RedisSMQ must ack.
      expect(capturedCb).toBeDefined();
      capturedCb!();

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 5000,
        description:
          'message acknowledged after the deferred callback was invoked',
      });
    });
  });

  // -------------------------------------------------------------------------
  // Callback error path
  // -------------------------------------------------------------------------

  describe('callback error', () => {
    it('routes the message to the dead-letter list when the callback reports an error and no retries remain', async () => {
      const queue = uniqueQueue('cb-error-dl');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
          cb(new Error('handler reported failure')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('will-dead-letter')
          .setRetryThreshold(0),
      );

      await consumer.run();

      // Wait for the settled dead-letter state rather than for the
      // unacknowledged event. The event fires when the pipeline begins;
      // the state we care about is where the pipeline ends. `waitForMessageStatus`
      // polls for the end state, which is what a caller would observe
      // by reading the queue.
      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered after callback error`,
      });

      // The message is in the dead-letter list, not the acknowledged
      // list,RedisSMQ and not the pending list. A bug where the error callback
      // was silently ignored would leave the message PROCESSING or
      // ACKNOWLEDGED, both of which would fail the assertion above.
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const page = await deadLettered.getMessages(queue, 0, 100);

      expect(page.totalItems).toBe(1);
      expect(page.items).toHaveLength(1);
      expect(page.items[0].id).toBe(id);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      expect(await acknowledged.countMessages(queue)).toBe(0);

      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);
    });
  });
});
