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
  EMessageDeadLetterCause,
  EMessagePropertyStatus,
  EMessageUnacknowledgementAction,
  EMessageUnacknowledgementCause,
  EQueueType,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the unacknowledgement-history record.
 *
 * With `messageAudit.unacknowledgementHistory` enabled (the test
 * default; see `test-defaults.ts`), RedisSMQ records one entry
 * per unacknowledgement a message experiences. When a message fails
 * repeatedly — the standard retry path — the history is a chain of
 * entries, one per delivery.
 *
 * The history is read through
 * `MessageManager.getMessageUnacknowledgementHistory(messageId)`,
 * which returns the entries as an array. The array is ordered
 * *newest-first* — the same convention the queue state history uses
 * (see `queue-state/state-history.test.ts` for the parallel
 * reasoning). A caller who wants chronological order reverses it.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The retry threshold used by the tests.
 *
 * Three deliveries: two intermediate (REQUEUE) entries and one
 * terminal (DEAD_LETTER) entry. The smallest value that exercises the
 * full progression — 1 or 2 would collapse the intermediate cases
 * into a single entry or zero.
 */
const RETRY_THRESHOLD = 3;

/**
 * The keys present on every entry in the history chain.
 *
 * Declared once so each test that asserts on the shape uses the same
 * list. If RedisSMQ ever adds a field to the base set, all
 * assertions in this file fail with the specific key named in the
 * diff.
 *
 * `deadLetterCause` is deliberately *not* in this set — see
 * `TERMINAL_ENTRY_KEYS` below and the file header.
 */
const BASE_ENTRY_KEYS = [
  'action',
  'cause',
  'consumerId',
  'messageId',
  'queue',
  'retryCount',
  'timestamp',
].sort();

/**
 * The keys present on the terminal (newest) entry.
 *
 * The base set plus `deadLetterCause`. RedisSMQ's type declares
 * the field optional and the serialization drops it on entries where
 * it was not set — so intermediate entries have only the base keys
 * and this one has the extra.
 */
const TERMINAL_ENTRY_KEYS = [...BASE_ENTRY_KEYS, 'deadLetterCause'].sort();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * One entry in the unacknowledgement history.
 *
 * RedisSMQ exports the entry type; the local alias captures just
 * the fields the tests read, so a change to the exported type's
 * *extra* fields does not require updating this file.
 *
 * `deadLetterCause` is typed as optional (`?`) to match the
 * framework's declaration — the field is absent on intermediate
 * entries, not present-with-a-null-value.
 */
interface IHistoryEntry {
  messageId: string;
  cause: EMessageUnacknowledgementCause;
  action: EMessageUnacknowledgementAction;
  timestamp: number;
  retryCount: number;
  queue: { queueParams: IQueueParams; groupId: string | null };
  consumerId: string;
  deadLetterCause?: EMessageDeadLetterCause;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Drive a message to the dead-lettered state and return its ID and
 * the consumer ID that performed the deliveries.
 *
 * The handler always reports a failure; `retryDelay: 0` keeps the
 * intermediate actions as REQUEUE and the test's wall time bounded.
 * The consumer is shut down before returning so no further deliveries
 * occur while the assertions run.
 */
async function driveToDeadLetter(
  queue: IQueueParams,
  retryThreshold: number,
): Promise<{ id: string; consumerId: string }> {
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
      .setRetryThreshold(retryThreshold)
      .setRetryDelay(0),
  );
  await producer.shutdown();

  const consumerId = consumer.getId();

  await consumer.run();
  await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
    timeoutMs: 15_000,
    description: `setup: message ${id} reached DEAD_LETTERED`,
  });
  await consumer.shutdown();

  return { id, consumerId };
}

/**
 * Read the history for a message and cast it to the local entry type.
 *
 * The cast is a place to detect framework-shape changes: if the
 * exported type diverges from `IHistoryEntry`, the assertion here
 * fails to compile and names the missing or extra field.
 */
async function readHistory(id: string): Promise<IHistoryEntry[]> {
  const messageManager = RedisSMQ.createMessageManager();
  const history = await messageManager.getMessageUnacknowledgementHistory(id);
  return history as unknown as IHistoryEntry[];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message audit — unacknowledgement history', () => {
  // -------------------------------------------------------------------------
  // Chain shape
  // -------------------------------------------------------------------------

  it('records one entry per failed delivery, ordered newest-first', async () => {
    const queue = uniqueQueue('audit-history-chain');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const { id, consumerId } = await driveToDeadLetter(queue, RETRY_THRESHOLD);

    const history = await readHistory(id);

    // One entry per failed delivery.
    expect(
      history,
      `history length for a ${RETRY_THRESHOLD}-delivery chain: ` +
        `expected ${RETRY_THRESHOLD} entries, got ${history.length}`,
    ).toHaveLength(RETRY_THRESHOLD);

    // Newest-first: the retry count decreases across the array.
    // With RETRY_THRESHOLD = 3 and a handler that always fails, the
    // counts are [3, 2, 1].
    expect(
      history.map((h) => h.retryCount),
      'retry counts should decrease across the array (newest-first)',
    ).toEqual([3, 2, 1]);

    // Timestamps decrease across the array — the newest entry has the
    // latest timestamp, and each earlier entry is at or before the
    // next. The comparison is non-strict because two consecutive
    // unacks can land in the same millisecond.
    for (let i = 1; i < history.length; i += 1) {
      expect(
        history[i - 1].timestamp,
        `entry ${i - 1}'s timestamp (${history[i - 1].timestamp}) ` +
          `should be ≥ entry ${i}'s (${history[i].timestamp}) in a ` +
          `newest-first array`,
      ).toBeGreaterThanOrEqual(history[i].timestamp);
    }

    // Every entry describes the same message and attributes it to
    // the same consumer. A regression that recorded entries against
    // the wrong message — a plausible bug if the entry's message ID
    // were read from a mutable source — would be caught here.
    for (const entry of history) {
      expect(entry.messageId).toBe(id);
      expect(entry.consumerId).toBe(consumerId);
    }

    // Every entry's queue reference matches, and carries the
    // POINT_TO_POINT shape: `groupId: null`.
    for (const entry of history) {
      expect(entry.queue).toEqual({
        queueParams: queue,
        groupId: null,
      });
    }
  });

  // -------------------------------------------------------------------------
  // Entry shape
  // -------------------------------------------------------------------------

  it('every entry carries the base record shape; only the terminal entry has deadLetterCause', async () => {
    const queue = uniqueQueue('audit-history-shape');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const { id } = await driveToDeadLetter(queue, RETRY_THRESHOLD);

    const history = await readHistory(id);

    // Every entry carries at least the base keys, and no unexpected
    // keys — the assertion on the exact set for intermediates (below)
    // covers the "no unexpected" half. This loop covers the "at
    // least the base" half.
    for (let i = 0; i < history.length; i += 1) {
      const keys = Object.keys(history[i]).sort();
      for (const baseKey of BASE_ENTRY_KEYS) {
        expect(
          keys,
          `entry ${i} is missing the base key "${baseKey}"`,
        ).toContain(baseKey);
      }
    }

    // The terminal entry has exactly the base set plus
    // `deadLetterCause`. The exact-equality assertion catches an
    // unexpected extra key on the terminal entry as well.
    expect(
      Object.keys(history[0]).sort(),
      'the terminal entry should carry the base keys plus "deadLetterCause"',
    ).toEqual(TERMINAL_ENTRY_KEYS);

    // Intermediate entries have exactly the base set — no
    // `deadLetterCause` key, not even one set to `undefined` or
    // `null`. This is the assertion that failed in the earlier
    // draft; it now pins the actual serialized shape.
    for (let i = 1; i < history.length; i += 1) {
      expect(
        Object.keys(history[i]).sort(),
        `intermediate entry ${i} should carry exactly the base keys, ` +
          `with "deadLetterCause" absent`,
      ).toEqual(BASE_ENTRY_KEYS);
    }

    // Per-field type checks for the base fields. Asserting these
    // here rather than in the progression test keeps the shape
    // contract in one place — a mismatch in the string/number shape
    // of a field fails with the field named at the specific entry.
    for (let i = 0; i < history.length; i += 1) {
      const entry = history[i];
      expect(typeof entry.messageId).toBe('string');
      expect(typeof entry.timestamp).toBe('number');
      expect(entry.timestamp).toBeGreaterThan(0);
      expect(typeof entry.retryCount).toBe('number');
      expect(entry.retryCount).toBeGreaterThan(0);
      expect(typeof entry.consumerId).toBe('string');
      expect(entry.consumerId.length).toBeGreaterThan(0);
    }
  });

  // -------------------------------------------------------------------------
  // Action and cause progression
  // -------------------------------------------------------------------------

  it('records the action, cause, and dead-letter cause per entry', async () => {
    const queue = uniqueQueue('audit-history-progression');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const { id } = await driveToDeadLetter(queue, RETRY_THRESHOLD);

    const history = await readHistory(id);

    // --- action progression ---------------------------------------------
    // Expected actions, indexed newest-first.
    const expectedActions: EMessageUnacknowledgementAction[] = [
      EMessageUnacknowledgementAction.DEAD_LETTER, // terminal
      EMessageUnacknowledgementAction.REQUEUE,
      EMessageUnacknowledgementAction.REQUEUE,
    ];

    expect(
      history.map((h) => h.action),
      'actions should be REQUEUE for intermediate entries and ' +
        'DEAD_LETTER for the terminal entry (newest-first)',
    ).toEqual(expectedActions);

    // --- deadLetterCause presence ----------------------------------------
    // The terminal entry carries the cause.
    expect(
      history[0].deadLetterCause,
      'the terminal entry should carry the retry-threshold cause',
    ).toBe(EMessageDeadLetterCause.RETRY_THRESHOLD_EXCEEDED);

    // Intermediate entries omit the field entirely — reading it
    // yields `undefined`. The `toBeUndefined` assertion is stricter
    // than a null check: if RedisSMQ started writing `null` for
    // the missing case, this test would fail and the reviewer would
    // decide whether the change is intentional.
    for (let i = 1; i < history.length; i += 1) {
      expect(
        history[i].deadLetterCause,
        `intermediate entry ${i} should not carry a deadLetterCause`,
      ).toBeUndefined();
    }

    // --- cause uniformity -------------------------------------------------
    // Every entry's cause is UNACKNOWLEDGED — the handler reported
    // every failure.
    for (let i = 0; i < history.length; i += 1) {
      expect(
        history[i].cause,
        `entry ${i}'s cause was not UNACKNOWLEDGED`,
      ).toBe(EMessageUnacknowledgementCause.UNACKNOWLEDGED);
    }
  });
});
