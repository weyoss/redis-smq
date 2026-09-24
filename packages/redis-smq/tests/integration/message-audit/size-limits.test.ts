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
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import {
  produceAndAck,
  produceAndDeadLetter,
} from '../../helpers/scenarios/message-lifecycle.js';

/**
 * Integration tests for the count-based caps on the audit subsystems.
 *
 * Each audit subsystem accepts a maximum size:
 *
 *   - `acknowledgedMessages.queueSize` — the acked list's cap.
 *   - `deadLetteredMessages.queueSize` — the DL list's cap.
 *   - `unacknowledgementHistory.maxSize` — the per-message history's cap.
 *
 * When the cap is positive, RedisSMQ trims the storage to the cap
 * on every write that would exceed it. Which records survive the trim
 * is the interesting contract this file pins: the *newest* records are
 * kept and the oldest are evicted. That is the useful behavior for a
 * caller — the recent failures are the ones worth inspecting.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The queue cap used by both list tests.
 *
 * Three is small enough that driving two extra messages is cheap and
 * large enough that the surviving set is non-trivial — with a cap of
 * one, "the newest survives" is indistinguishable from "the last one
 * written survives".
 */
const QUEUE_SIZE = 3;

/**
 * Messages driven through each list's pipeline.
 *
 * `QUEUE_SIZE + 2` exercises the trim-on-every-overflow contract
 * twice: after the 4th write (list would be 4, trimmed to 3) and
 * after the 5th (list would be 4, trimmed to 3). A regression that
 * only fired the trim on the first overflow would leave 4 records
 * after the 5th write and fail the count assertion.
 */
const LIST_TOTAL = QUEUE_SIZE + 2;

/**
 * The history cap. Same reasoning as `QUEUE_SIZE`.
 */
const HISTORY_MAX_SIZE = 3;

/**
 * Retry threshold used by the history test.
 *
 * `HISTORY_MAX_SIZE + 2` deliveries produce that many history
 * entries, exercising the trim twice. `retryDelay: 0` keeps the
 * intermediate actions as `REQUEUE` (fast) rather than `DELAY`.
 */
const HISTORY_RETRY_THRESHOLD = HISTORY_MAX_SIZE + 2;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Configure the acknowledged list's `queueSize`.
 *
 * `enabled: true` is passed explicitly to remove any ambiguity about
 * the merge semantics — see the discussion in `disabled.test.ts`.
 */
async function setAckQueueSize(queueSize: number): Promise<void> {
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig({
    messageAudit: {
      acknowledgedMessages: { enabled: true, queueSize },
    },
  });
}

/**
 * Configure the dead-lettered list's `queueSize`.
 */
async function setDlQueueSize(queueSize: number): Promise<void> {
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig({
    messageAudit: {
      deadLetteredMessages: { enabled: true, queueSize },
    },
  });
}

/**
 * Configure the unacknowledgement history's `maxSize`.
 */
async function setHistoryMaxSize(maxSize: number): Promise<void> {
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig({
    messageAudit: {
      unacknowledgementHistory: { enabled: true, maxSize },
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message audit — size limits', () => {
  // -------------------------------------------------------------------------
  // Acknowledged list
  // -------------------------------------------------------------------------

  describe('acknowledged list (queueSize)', () => {
    it('caps the list at queueSize, keeping the newest records', async () => {
      const queue = uniqueQueue('audit-ack-cap');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await setAckQueueSize(QUEUE_SIZE);

      const ackedIds = await produceAndAck(queue, LIST_TOTAL);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      const page = await acknowledged.getMessages(queue, 0, 100);

      // Count: capped at QUEUE_SIZE.
      expect(
        page.totalItems,
        `after ${LIST_TOTAL} acks with queueSize=${QUEUE_SIZE}, ` +
          `the list should hold ${QUEUE_SIZE} records`,
      ).toBe(QUEUE_SIZE);
      expect(page.items).toHaveLength(QUEUE_SIZE);

      // The count accessor agrees with the page.
      expect(await acknowledged.countMessages(queue)).toBe(QUEUE_SIZE);

      const expectedSurviving = ackedIds.slice(-QUEUE_SIZE);
      const actualSurviving = page.items.map((m) => m.id);

      expect(
        new Set(actualSurviving),
        `after ${LIST_TOTAL} acks with queueSize=${QUEUE_SIZE}, the ` +
          `surviving records should be the newest ${QUEUE_SIZE} ` +
          `(the last ${QUEUE_SIZE} in ack order: ` +
          `[${expectedSurviving.join(', ')}]). ` +
          `Actual survivors: [${actualSurviving.join(', ')}]`,
      ).toEqual(new Set(expectedSurviving));

      const evictedIds = ackedIds.slice(0, LIST_TOTAL - QUEUE_SIZE);
      for (const evictedId of evictedIds) {
        expect(
          actualSurviving,
          `record ${evictedId} should have been evicted but is still present`,
        ).not.toContain(evictedId);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Dead-lettered list
  // -------------------------------------------------------------------------

  describe('dead-lettered list (queueSize)', () => {
    it('caps the list at queueSize, keeping the newest records', async () => {
      const queue = uniqueQueue('audit-dl-cap');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await setDlQueueSize(QUEUE_SIZE);

      const dlIds = await produceAndDeadLetter(queue, LIST_TOTAL);

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const page = await deadLettered.getMessages(queue, 0, 100);

      expect(
        page.totalItems,
        `after ${LIST_TOTAL} DLs with queueSize=${QUEUE_SIZE}, ` +
          `the list should hold ${QUEUE_SIZE} records`,
      ).toBe(QUEUE_SIZE);
      expect(page.items).toHaveLength(QUEUE_SIZE);

      expect(await deadLettered.countMessages(queue)).toBe(QUEUE_SIZE);

      const expectedSurviving = dlIds.slice(-QUEUE_SIZE);
      const actualSurviving = page.items.map((m) => m.id);

      expect(
        new Set(actualSurviving),
        `after ${LIST_TOTAL} DLs with queueSize=${QUEUE_SIZE}, the ` +
          `surviving records should be the newest ${QUEUE_SIZE} ` +
          `(the last ${QUEUE_SIZE} in DL order: ` +
          `[${expectedSurviving.join(', ')}]). ` +
          `Actual survivors: [${actualSurviving.join(', ')}]`,
      ).toEqual(new Set(expectedSurviving));

      const evictedIds = dlIds.slice(0, LIST_TOTAL - QUEUE_SIZE);
      for (const evictedId of evictedIds) {
        expect(
          actualSurviving,
          `record ${evictedId} should have been evicted but is ` +
            `still present`,
        ).not.toContain(evictedId);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Unacknowledgement history
  // -------------------------------------------------------------------------

  describe('unacknowledgement history (maxSize)', () => {
    it('caps the history at maxSize, keeping the newest entries', async () => {
      const queue = uniqueQueue('audit-history-cap');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await setHistoryMaxSize(HISTORY_MAX_SIZE);

      // Drive the message through the full retry chain. `retryDelay:
      // 0` keeps the intermediate actions as REQUEUE and the test's
      // wall time bounded — the subject here is the trim, not the
      // delay.
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
          cb(new Error('always fails')),
      });

      const producer = await startProducer();
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('always-fails')
          .setRetryThreshold(HISTORY_RETRY_THRESHOLD)
          .setRetryDelay(0),
      );
      await producer.shutdown();

      await consumer.run();
      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 15_000,
        description: `setup: message ${id} reached DEAD_LETTERED`,
      });
      await consumer.shutdown();

      const messageManager = RedisSMQ.createMessageManager();
      const history =
        await messageManager.getMessageUnacknowledgementHistory(id);

      // Count: capped at HISTORY_MAX_SIZE.
      expect(
        history.length,
        `after ${HISTORY_RETRY_THRESHOLD} unacks with ` +
          `maxSize=${HISTORY_MAX_SIZE}, the history should hold ` +
          `${HISTORY_MAX_SIZE} entries`,
      ).toBe(HISTORY_MAX_SIZE);

      const expectedRetryCounts = Array.from(
        { length: HISTORY_MAX_SIZE },
        (_, i) => HISTORY_RETRY_THRESHOLD - i,
      );

      const actualRetryCounts = history.map((h) => h.retryCount);

      expect(
        actualRetryCounts,
        `after ${HISTORY_RETRY_THRESHOLD} unacks with ` +
          `maxSize=${HISTORY_MAX_SIZE}, the surviving entries ` +
          `(newest-first) should have retry counts ` +
          `[${expectedRetryCounts.join(', ')}]. ` +
          `Actual: [${actualRetryCounts.join(', ')}]`,
      ).toEqual(expectedRetryCounts);

      // The terminal entry — the one carrying the deadLetterCause —
      // survived the trim. This is the most important single record
      // in the history, and the policy that keeps the newest entries
      // is precisely what preserves it.
      //
      // The `deadLetterCause` is on the terminal entry only; the
      // other surviving entries are intermediate and omit the field
      // entirely (see `unacknowledgement-history.test.ts` for the
      // shape discussion).
      expect(
        history[0].deadLetterCause,
        'the terminal entry (with its deadLetterCause) should survive ' +
          'the history trim',
      ).toBeDefined();

      // The oldest entries were evicted — their retry counts are not
      // in the surviving set. A regression that kept the oldest
      // (LIFO-ish) would produce [1, 2, 3] here and fail.
      const oldestRetryCounts = Array.from(
        { length: HISTORY_RETRY_THRESHOLD - HISTORY_MAX_SIZE },
        (_, i) => i + 1,
      );
      for (const oldCount of oldestRetryCounts) {
        expect(
          actualRetryCounts,
          `entry with retryCount=${oldCount} should have been ` +
            `evicted but is still present`,
        ).not.toContain(oldCount);
      }
    });
  });
});
