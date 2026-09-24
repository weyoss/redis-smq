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
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the independence of the three message-audit
 * flags.
 *
 * The message-audit subsystem has three sub-keys:
 *
 *   - `acknowledgedMessages` — the acknowledged list.
 *   - `deadLetteredMessages` — the dead-letter list.
 *   - `unacknowledgementHistory` — the per-message unack history.
 *
 * They are independent. Enabling or disabling one has no effect on the
 * others. A caller who wants to keep the dead-letter list for
 * post-mortem analysis but turn off the acknowledged list — a common
 * configuration for high-throughput queues, where ack records are
 * mostly noise — sets exactly the one flag and expects the other two
 * to keep working.
 *
 * `disabled.test.ts` covers the all-off case (`messageAudit: false`).
 * This file covers the mixed cases: one flag disabled while the others
 * stay on.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Apply a partial message-audit config to the current test.
 *
 * The partial goes through `updateConfig`, which merges it with the
 * current config (restored to the test defaults by `per-test.ts`'s
 * `beforeEach`). Unmentioned sub-keys keep their default `true`
 * values — that is the merge contract this file relies on.
 *
 * The parameter type is intentionally loose: the tests pass various
 * shapes (section-level booleans, partial sub-objects), and typing
 * them all would require enumerating the config's full union.
 */
async function setAuditFlags(partial: Record<string, unknown>): Promise<void> {
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig({ messageAudit: partial });
}

/**
 * Drive a message to the acknowledged state and return its ID.
 *
 * The consumer is registered with an immediate-ack handler and shut
 * down after the ack — a live consumer would poll the queue and
 * interfere with subsequent setup in the same test.
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
    RedisSMQ.newProducibleMessage().setQueue(queue).setBody('will-be-acked'),
  );

  const acked = untilMessageAcknowledged(consumer, id);
  await consumer.run();
  await acked;
  await consumer.shutdown();
  await producer.shutdown();

  return id;
}

/**
 * Drive a message to the dead-lettered state and return its ID.
 *
 * Uses `retryThreshold: 0` so the first failure is terminal — one
 * delivery, one unack, one dead-letter. That also means the unack
 * history has exactly one entry per dead-lettered message, which is
 * sufficient for the "history is readable" assertions below.
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
      .setBody('will-be-dead-lettered')
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

describe('Message audit — selective enable', () => {
  // -------------------------------------------------------------------------
  // Acknowledged disabled, siblings on
  // -------------------------------------------------------------------------

  it('ack disabled: ack read rejects while dl and history remain readable', async () => {
    const queue = uniqueQueue('audit-selective-ack-off');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    await setAuditFlags({ acknowledgedMessages: false });

    // Drive one message through each terminal state. The order does
    // not matter — the two helpers use separate consumers with
    // separate shutdowns.
    await ackOneMessage(queue);
    const dlId = await deadLetterOneMessage(queue);

    // Negative: the ack list is disabled.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    await expect(acknowledged.getMessages(queue, 0, 100)).rejects.toThrow(
      errors.AcknowledgmentAuditDisabledError,
    );

    // Positive: the dl list is enabled, and it contains the message
    // that went through the dead-letter pipeline.
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const dlPage = await deadLettered.getMessages(queue, 0, 100);
    expect(dlPage.totalItems).toBe(1);
    expect(dlPage.items).toHaveLength(1);
    expect(dlPage.items[0].id).toBe(dlId);
  });

  // -------------------------------------------------------------------------
  // Dead-lettered disabled, siblings on
  // -------------------------------------------------------------------------

  it('dl disabled: dl read rejects while ack and history remain readable', async () => {
    const queue = uniqueQueue('audit-selective-dl-off');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    await setAuditFlags({ deadLetteredMessages: false });

    const ackId = await ackOneMessage(queue);
    await deadLetterOneMessage(queue);

    // Positive: the ack list is enabled and contains the acked
    // message.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const ackPage = await acknowledged.getMessages(queue, 0, 100);
    expect(ackPage.totalItems).toBe(1);
    expect(ackPage.items).toHaveLength(1);
    expect(ackPage.items[0].id).toBe(ackId);

    // Negative: the dl list is disabled.
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    await expect(deadLettered.getMessages(queue, 0, 100)).rejects.toThrow(
      errors.DeadLetterAuditDisabledError,
    );
  });

  // -------------------------------------------------------------------------
  // History disabled, siblings on
  // -------------------------------------------------------------------------

  it('history disabled: history read rejects while ack and dl remain readable', async () => {
    const queue = uniqueQueue('audit-selective-history-off');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    await setAuditFlags({ unacknowledgementHistory: false });

    const ackId = await ackOneMessage(queue);
    const dlId = await deadLetterOneMessage(queue);

    // Positive: both lists are enabled.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const ackPage = await acknowledged.getMessages(queue, 0, 100);
    expect(ackPage.totalItems).toBe(1);
    expect(ackPage.items[0].id).toBe(ackId);

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const dlPage = await deadLettered.getMessages(queue, 0, 100);
    expect(dlPage.totalItems).toBe(1);
    expect(dlPage.items[0].id).toBe(dlId);

    // Negative: the history is disabled. The read uses the
    // dead-lettered message's ID, which would have had a history
    // entry if the flag were on.
    const messageManager = RedisSMQ.createMessageManager();
    await expect(
      messageManager.getMessageUnacknowledgementHistory(dlId),
    ).rejects.toThrow(errors.UnacknowledgmentHistoryDisabledError);
  });

  // -------------------------------------------------------------------------
  // Two of three disabled, history stays on
  // -------------------------------------------------------------------------

  it('ack + dl disabled: both list reads reject while history remains readable', async () => {
    const queue = uniqueQueue('audit-selective-two-lists-off');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    await setAuditFlags({
      acknowledgedMessages: false,
      deadLetteredMessages: false,
    });

    await ackOneMessage(queue);
    const dlId = await deadLetterOneMessage(queue);

    // Negative: both lists are disabled.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    await expect(acknowledged.getMessages(queue, 0, 100)).rejects.toThrow(
      errors.AcknowledgmentAuditDisabledError,
    );

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    await expect(deadLettered.getMessages(queue, 0, 100)).rejects.toThrow(
      errors.DeadLetterAuditDisabledError,
    );

    // Positive: the history is still enabled. The dead-lettered
    // message has one history entry — with `retryThreshold: 0`, the
    // single failure produced a single unack record.
    const messageManager = RedisSMQ.createMessageManager();
    const history =
      await messageManager.getMessageUnacknowledgementHistory(dlId);
    expect(history).toHaveLength(1);
    expect(history[0].messageId).toBe(dlId);
  });
});
