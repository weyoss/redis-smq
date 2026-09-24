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
  errors,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the disabled unacknowledgement-history
 * configuration.
 *
 * RedisSMQ records a per-message history of unacknowledgements
 * when `messageAudit.unacknowledgementHistory` is enabled (the test
 * default). When disabled, RedisSMQ does not append entries to
 * the history, and `getMessageUnacknowledgementHistory` rejects with
 * `UnacknowledgmentHistoryDisabledError`.
 *
 * The rejection is the caller-visible contract: a caller who tries to
 * read a history that is not being recorded gets an actionable error
 * rather than an empty array. An empty array would be
 * indistinguishable from "the message never failed", which is the
 * wrong signal for a caller investigating a failure.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Retry threshold used by the setup.
 *
 * Matches `unacknowledgement-history.test.ts` so a reader comparing
 * the two files sees the same retry chain: three deliveries, two
 * intermediate `REQUEUE` entries and one terminal `DEAD_LETTER`
 * entry — the full progression, if the history were enabled.
 */
const RETRY_THRESHOLD = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Disable the unacknowledgement-history subsystem for the current
 * test.
 *
 * Uses the per-flag form so the two sibling flags — the acknowledged
 * list and the dead-letter list — keep their default `true` values.
 * The `beforeEach` reset in `tests/setup/per-test.ts` restores the
 * defaults before the next test, so no cleanup is needed here.
 */
async function disableHistory(): Promise<void> {
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig({
    messageAudit: { unacknowledgementHistory: false },
  });
}

/**
 * Drive a message through the retry chain to DEAD_LETTER and return
 * its ID.
 *
 * The setup is deliberately identical to
 * `unacknowledgement-history.test.ts`'s `driveToDeadLetter` — same
 * retry threshold, same handler that always fails, same
 * `retryDelay: 0` — so the two files are directly comparable: the
 * only difference is the audit flag's value.
 *
 * With `retryThreshold: 3` and a handler that always fails, the
 * framework delivers the message three times before dead-lettering
 * it. If the history were enabled, those three deliveries would
 * produce three history entries; the disabled case asserts that the
 * reader rejects instead.
 */
async function driveToDeadLetter(queue: IQueueParams): Promise<string> {
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
      .setRetryThreshold(RETRY_THRESHOLD)
      .setRetryDelay(0),
  );
  await producer.shutdown();

  await consumer.run();
  await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
    timeoutMs: 15_000,
    description: `setup: message ${id} reached DEAD_LETTERED`,
  });
  await consumer.shutdown();

  return id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message audit — unacknowledgement history disabled', () => {
  it('rejects getMessageUnacknowledgementHistory with UnacknowledgmentHistoryDisabledError', async () => {
    const queue = uniqueQueue('audit-history-disabled');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    await disableHistory();

    const id = await driveToDeadLetter(queue);

    const messageManager = RedisSMQ.createMessageManager();
    await expect(
      messageManager.getMessageUnacknowledgementHistory(id),
    ).rejects.toThrow(errors.UnacknowledgmentHistoryDisabledError);
  });

  it('leaves the dead-letter list readable (the sibling flag is unaffected)', async () => {
    const queue = uniqueQueue('audit-history-disabled-sibling');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    await disableHistory();

    const id = await driveToDeadLetter(queue);

    // The history reader rejects.
    const messageManager = RedisSMQ.createMessageManager();
    await expect(
      messageManager.getMessageUnacknowledgementHistory(id),
    ).rejects.toThrow(errors.UnacknowledgmentHistoryDisabledError);

    // The dead-letter list still works — the flag this test disabled
    // is not the DL flag, and the message reached DEAD_LETTER via the
    // same chain the history would have recorded.
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLettered.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(id);
  });
});
