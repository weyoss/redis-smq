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
import {
  expectMessageStatus,
  waitForMessageStatus,
} from '../../helpers/assertions/message-status.js';
import {
  untilMessageAcknowledged,
  untilMessageUnacknowledged,
} from '../../helpers/events/await-event.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the message status lifecycle.
 *
 * A message's `EMessagePropertyStatus` moves through a documented
 * sequence as RedisSMQ processes it:
 *
 *     PENDING                     after produce, before any consumer
 *       │
 *       ▼
 *     PROCESSING                  during handler execution
 *       │
 *       ├──► ACKNOWLEDGED         handler acked
 *       │
 *       ├──► DEAD_LETTERED        failure with no retries left
 *       │
 *       └──► UNACK_REQUEUING      failure with retries remaining
 *              │
 *              ├──► PENDING       (retryDelay = 0: immediate requeue)
 *              │
 *              └──► UNACK_DELAYING  (retryDelay > 0: waiting for the delay)
 *                     │
 *                     ▼
 *                   PENDING        after the delay elapses
 *
 * Each test in this file asserts one complete flow from PENDING to its
 * terminal state, capturing the intermediate states it can observe
 * reliably.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message status transitions', () => {
  // -------------------------------------------------------------------------
  // PENDING → PROCESSING → ACKNOWLEDGED
  // -------------------------------------------------------------------------

  describe('PENDING → PROCESSING → ACKNOWLEDGED', () => {
    it('passes through the PENDING, PROCESSING, and ACKNOWLEDGED states', async () => {
      const queue = uniqueQueue('status-ack');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('ack-flow'),
      );

      // Immediately after produce, the message is PENDING. No consumer
      // is running yet, so nothing can have changed its state.
      await expectMessageStatus(id, EMessagePropertyStatus.PENDING);

      // Capture the status the handler sees. This is the transferable
      // message's status field, set by RedisSMQ at checkout time.
      const statusesSeenInHandler: EMessagePropertyStatus[] = [];

      const consumer = createBareConsumer();
      await consumer.consume(
        queue,
        (msg: IMessageTransferable, cb: ICallback) => {
          statusesSeenInHandler.push(msg.status);
          cb();
        },
      );

      // Subscribe before run — the ack awaiter must be installed before
      // the consumer's first poll can fire the event.
      const acked = untilMessageAcknowledged(consumer, id);

      await consumer.run();
      await acked;

      // The handler saw PROCESSING. If RedisSMQ delivered the
      // message with a different status (PENDING, or ACKNOWLEDGED
      // already), this assertion names the actual value.
      expect(statusesSeenInHandler).toEqual([
        EMessagePropertyStatus.PROCESSING,
      ]);

      // Terminal state: ACKNOWLEDGED in RedisSMQ's state store.
      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
    });
  });

  // -------------------------------------------------------------------------
  // PENDING → PROCESSING → DEAD_LETTERED
  // -------------------------------------------------------------------------

  describe('PENDING → PROCESSING → DEAD_LETTERED', () => {
    it('passes through PENDING and PROCESSING on the way to DEAD_LETTERED', async () => {
      const queue = uniqueQueue('status-dl');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('dl-flow')
          .setRetryThreshold(0),
      );

      await expectMessageStatus(id, EMessagePropertyStatus.PENDING);

      const statusesSeenInHandler: EMessagePropertyStatus[] = [];

      const consumer = createBareConsumer();
      await consumer.consume(
        queue,
        (msg: IMessageTransferable, cb: ICallback) => {
          statusesSeenInHandler.push(msg.status);
          cb(new Error('simulated failure'));
        },
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered`,
      });

      // The handler ran exactly once, and saw PROCESSING. A duplicate
      // delivery (which would push this to length 2) or an unexpected
      // initial status would both be caught here.
      expect(statusesSeenInHandler).toEqual([
        EMessagePropertyStatus.PROCESSING,
      ]);
    });
  });

  // -------------------------------------------------------------------------
  // PENDING → PROCESSING → UNACK_REQUEUING → PROCESSING → ACKNOWLEDGED
  // -------------------------------------------------------------------------

  describe('PENDING → PROCESSING → UNACK_REQUEUING → PROCESSING → ACKNOWLEDGED', () => {
    it('passes through UNACK_REQUEUING when the first attempt fails with retries remaining', async () => {
      const queue = uniqueQueue('status-requeue');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('requeue-flow')
          .setRetryThreshold(3)
          .setRetryDelay(0),
      );

      await expectMessageStatus(id, EMessagePropertyStatus.PENDING);

      const statusesSeenInHandler: EMessagePropertyStatus[] = [];
      let attempt = 0;

      const consumer = createBareConsumer();
      await consumer.consume(
        queue,
        (msg: IMessageTransferable, cb: ICallback) => {
          statusesSeenInHandler.push(msg.status);
          attempt += 1;
          if (attempt === 1) {
            cb(new Error('first attempt fails'));
          } else {
            cb();
          }
        },
      );

      // Subscribe before run — both events must be installed before
      // the first delivery can fire the first one.
      const unacked = untilMessageUnacknowledged(consumer, id);
      const acked = untilMessageAcknowledged(consumer, id);

      await consumer.run();

      // The unack event fires from inside the unack script's completion
      // path. At this point the message status is UNACK_REQUEUING — the
      // script has written it, and the requeue worker has not yet
      // picked the message up.
      await unacked;
      await expectMessageStatus(id, EMessagePropertyStatus.UNACK_REQUEUING);

      // The requeue worker moves the message back to pending, and the
      // consumer picks it up for a second attempt. This awaiter resolves
      // when the second delivery acks.
      await acked;

      // Both deliveries saw PROCESSING. Length 2 pins that the message
      // was delivered exactly twice — once for the failure, once for the
      // successful retry.
      expect(statusesSeenInHandler).toEqual([
        EMessagePropertyStatus.PROCESSING,
        EMessagePropertyStatus.PROCESSING,
      ]);

      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
    });
  });

  // -------------------------------------------------------------------------
  // PENDING → PROCESSING → UNACK_REQUEUING → UNACK_DELAYING → PENDING → PROCESSING → ACKNOWLEDGED
  // -------------------------------------------------------------------------

  describe('PENDING → PROCESSING → UNACK_REQUEUING → UNACK_DELAYING → PENDING → PROCESSING → ACKNOWLEDGED', () => {
    it('passes through UNACK_DELAYING when retryDelay > 0', async () => {
      const queue = uniqueQueue('status-delay');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('delay-flow')
          .setRetryThreshold(3)
          .setRetryDelay(5000),
      );

      await expectMessageStatus(id, EMessagePropertyStatus.PENDING);

      const statusesSeenInHandler: EMessagePropertyStatus[] = [];
      let attempt = 0;

      const consumer = createBareConsumer();
      await consumer.consume(
        queue,
        (msg: IMessageTransferable, cb: ICallback) => {
          statusesSeenInHandler.push(msg.status);
          attempt += 1;
          if (attempt === 1) {
            cb(new Error('first attempt fails'));
          } else {
            cb();
          }
        },
      );

      const unacked = untilMessageUnacknowledged(consumer, id);
      const acked = untilMessageAcknowledged(consumer, id);

      await consumer.run();

      // The unack event fires when the script completes; the message is
      // in UNACK_REQUEUING at that moment.
      await unacked;
      await expectMessageStatus(id, EMessagePropertyStatus.UNACK_REQUEUING);

      // Poll for UNACK_DELAYING. The message spends ~5s in this state,
      // so `waitForMessageStatus` catches it without racing.
      await waitForMessageStatus(id, EMessagePropertyStatus.UNACK_DELAYING, {
        timeoutMs: 10_000,
        description: `message ${id} reached UNACK_DELAYING`,
      });

      // After the delay, RedisSMQ moves the message to PENDING,
      // the consumer picks it up, and the second delivery acks.
      await acked;

      expect(statusesSeenInHandler).toEqual([
        EMessagePropertyStatus.PROCESSING,
        EMessagePropertyStatus.PROCESSING,
      ]);

      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
    });
  });
});
