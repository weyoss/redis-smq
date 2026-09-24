/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for time-based expiration of audit records.
 *
 * The two audit lists — acknowledged and dead-lettered — accept an
 * `expire` configuration option (milliseconds). When set to a positive
 * value, RedisSMQ applies a TTL to the records as they are
 * written, and the records disappear once the TTL elapses.
 *
 * The two lists expire independently: `acknowledgedMessages.expire`
 * and `deadLetteredMessages.expire` are separate config fields and
 * apply to separate Redis keys. This file covers both.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The expire duration used by both tests.
 *
 * See the file header for the trade-off. 3000ms is short enough to
 * keep the test under ~6s of wall time, long enough to be safe from
 * a startup hiccup on a loaded CI.
 */
const EXPIRE_MS = 3000;

/**
 * Polling deadline for the "record is gone" wait.
 *
 * `EXPIRE_MS` plus a generous buffer for RedisSMQ's own
 * enforcement latency. On a healthy run the wait resolves shortly
 * after `EXPIRE_MS`; the buffer only matters if RedisSMQ's
 * enforcement is slow or the CI is loaded.
 */
const GONE_TIMEOUT_MS = EXPIRE_MS + 7000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Set the expire for the acknowledged-messages list.
 *
 * The partial includes `enabled: true` alongside `expire` — even
 * though the test defaults already enable the list — because a partial
 * that omits `enabled` is not guaranteed to preserve the prior value
 * across all config paths (see the merge contract discussion in
 * `disabled.test.ts`). Being explicit here removes the ambiguity.
 */
async function setAckExpire(expireMs: number): Promise<void> {
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig({
    messageAudit: {
      acknowledgedMessages: { enabled: true, expire: expireMs },
    },
  });
}

/**
 * Set the expire for the dead-lettered-messages list.
 *
 * Same reasoning as `setAckExpire`.
 */
async function setDlExpire(expireMs: number): Promise<void> {
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig({
    messageAudit: {
      deadLetteredMessages: { enabled: true, expire: expireMs },
    },
  });
}

/**
 * Drive one message to the acknowledged state and shut the consumer
 * down. Returns the message's ID.
 */
async function ackOneMessage(
  queue: ReturnType<typeof uniqueQueue>,
): Promise<string> {
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
  });

  const producer = await startProducer();
  const [id] = await producer.produce(
    RedisSMQ.newProducibleMessage().setQueue(queue).setBody('will-expire'),
  );

  const acked = untilMessageAcknowledged(consumer, id);
  await consumer.run();
  await acked;
  await consumer.shutdown();
  await producer.shutdown();

  return id;
}

/**
 * Drive one message to the dead-lettered state and shut the consumer
 * down. Returns the message's ID.
 *
 * `retryThreshold: 0` makes the first failure terminal, so the record
 * is written on the first delivery — the setup cost is one delivery
 * rather than the full retry chain.
 */
async function deadLetterOneMessage(
  queue: ReturnType<typeof uniqueQueue>,
): Promise<string> {
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
      cb(new Error('always fails')),
  });

  const producer = await startProducer();
  const [id] = await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody('will-expire')
      .setRetryThreshold(0),
  );

  await consumer.run();
  await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
    timeoutMs: 10_000,
    description: `setup: message ${id} reached DEAD_LETTERED`,
  });
  await consumer.shutdown();
  await producer.shutdown();

  return id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message audit — record expiration', () => {
  // -------------------------------------------------------------------------
  // Acknowledged messages
  // -------------------------------------------------------------------------

  describe('acknowledged messages', () => {
    it('removes the record after the configured expire elapses', async () => {
      const queue = uniqueQueue('audit-ack-expire');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Configure the expire *before* producing. RedisSMQ reads
      // the config at write time, so the TTL is applied to the record
      // when the ack happens below.
      await setAckExpire(EXPIRE_MS);

      const id = await ackOneMessage(queue);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

      // Present: the record exists immediately after the ack. The
      // window between the ack and this read is milliseconds — far
      // shorter than `EXPIRE_MS` — so this read is safe.
      const presentPage = await acknowledged.getMessages(queue, 0, 100);
      expect(
        presentPage.totalItems,
        'the acked record should be present immediately after the ack',
      ).toBe(1);
      expect(presentPage.items).toHaveLength(1);
      expect(presentPage.items[0].id).toBe(id);

      await waitFor(
        async () => {
          const page = await acknowledged.getMessages(queue, 0, 100);
          return page.totalItems === 0;
        },
        {
          timeoutMs: GONE_TIMEOUT_MS,
          intervalMs: 100,
          description:
            `the acked record for ${id} was removed after the ` +
            `${EXPIRE_MS}ms expire elapsed`,
        },
      );

      const finalPage = await acknowledged.getMessages(queue, 0, 100);
      expect(
        finalPage.totalItems,
        `the acked list should be empty after the ${EXPIRE_MS}ms expire elapsed; found ${finalPage.totalItems} record(s)`,
      ).toBe(0);
      expect(finalPage.items).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Dead-lettered messages
  // -------------------------------------------------------------------------

  describe('dead-lettered messages', () => {
    it('removes the record after the configured expire elapses', async () => {
      const queue = uniqueQueue('audit-dl-expire');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await setDlExpire(EXPIRE_MS);

      const id = await deadLetterOneMessage(queue);

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

      // Present.
      const presentPage = await deadLettered.getMessages(queue, 0, 100);
      expect(
        presentPage.totalItems,
        'the DL record should be present immediately after the DL',
      ).toBe(1);
      expect(presentPage.items).toHaveLength(1);
      expect(presentPage.items[0].id).toBe(id);

      // Absent.
      await waitFor(
        async () => {
          const page = await deadLettered.getMessages(queue, 0, 100);
          return page.totalItems === 0;
        },
        {
          timeoutMs: GONE_TIMEOUT_MS,
          intervalMs: 100,
          description:
            `the DL record for ${id} was removed after the ` +
            `${EXPIRE_MS}ms expire elapsed`,
        },
      );

      const finalPage = await deadLettered.getMessages(queue, 0, 100);
      expect(
        finalPage.totalItems,
        `the DL list should be empty after the ${EXPIRE_MS}ms expire ` +
          `elapsed; found ${finalPage.totalItems} record(s)`,
      ).toBe(0);
      expect(finalPage.items).toEqual([]);
    });
  });
});
