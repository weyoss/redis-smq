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
 * Integration tests for the fully-disabled audit configuration.
 *
 * The message-audit subsystem has three independent flags — one per
 * record type:
 *
 *   - `messageAudit.acknowledgedMessages` — the acknowledged list.
 *   - `messageAudit.deadLetteredMessages` — the dead-letter list.
 *   - `messageAudit.unacknowledgementHistory` — the per-message unack
 *     history.
 *
 * Setting `messageAudit: false` (a boolean in place of the section
 * object) disables all three at once. This file pins that contract.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The configuration that disables the whole audit subsystem.
 *
 * `messageAudit: false` is the section-level boolean. It replaces the
 * entire section, so all three sub-keys become false regardless of
 * their prior values. See the file header for the merge semantics.
 */
const DISABLED_AUDIT = { messageAudit: false } as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Disable the whole audit subsystem for the current test.
 *
 * Called at the top of every test in this file. The `beforeEach`
 * reset in `tests/setup/per-test.ts` restores the defaults
 * (`acknowledgedMessages: true`, `deadLetteredMessages: true`,
 * `unacknowledgementHistory: true`) before the next test, so no
 * cleanup is needed.
 */
async function disableAudit(): Promise<void> {
  const configManager = RedisSMQ.createConfigManager();
  await configManager.updateConfig(DISABLED_AUDIT);
}

/**
 * Drive a message to the acknowledged state.
 *
 * Produces a message, registers a consumer that acks immediately,
 * waits for the ack event, then shuts the consumer down.
 *
 * The returned message ID is unused by the callers in this file
 * (because the audit lists are disabled and can't be read), but
 * keeping the return type uniform with the sibling helper below makes
 * the two setup functions interchangeable.
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
 * Drive a message to the dead-lettered state.
 *
 * Produces a message with `retryThreshold: 0` (so the first failure is
 * terminal) and registers a consumer that always reports a failure.
 * Waits for the message's status to reach `DEAD_LETTERED`, then shuts
 * the consumer down.
 *
 * The status wait uses `waitForMessageStatus` rather than the
 * `consumer.messageDeadLettered` event because the state store
 * remains observable even when the audit list is disabled — the two
 * are separate concerns (the state store is framework-internal; the
 * audit list is the caller-facing record).
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

describe('Message audit — disabled (messageAudit: false)', () => {
  // -------------------------------------------------------------------------
  // Acknowledged messages
  // -------------------------------------------------------------------------

  describe('acknowledged messages', () => {
    it('rejects getMessages with AcknowledgmentAuditDisabledError', async () => {
      const queue = uniqueQueue('audit-disabled-ack-read');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await disableAudit();

      await ackOneMessage(queue);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      await expect(acknowledged.getMessages(queue, 0, 100)).rejects.toThrow(
        errors.AcknowledgmentAuditDisabledError,
      );
    });

    it('rejects countMessages with AcknowledgmentAuditDisabledError', async () => {
      const queue = uniqueQueue('audit-disabled-ack-count');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await disableAudit();

      await ackOneMessage(queue);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      await expect(acknowledged.countMessages(queue)).rejects.toThrow(
        errors.AcknowledgmentAuditDisabledError,
      );
    });

    it('rejects purge with AcknowledgmentAuditDisabledError', async () => {
      const queue = uniqueQueue('audit-disabled-ack-purge');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await disableAudit();

      await ackOneMessage(queue);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      await expect(acknowledged.purge(queue)).rejects.toThrow(
        errors.AcknowledgmentAuditDisabledError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Dead-lettered messages
  // -------------------------------------------------------------------------

  describe('dead-lettered messages', () => {
    it('rejects getMessages with DeadLetterAuditDisabledError', async () => {
      const queue = uniqueQueue('audit-disabled-dl-read');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await disableAudit();

      await deadLetterOneMessage(queue);

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      await expect(deadLettered.getMessages(queue, 0, 100)).rejects.toThrow(
        errors.DeadLetterAuditDisabledError,
      );
    });

    it('rejects countMessages with DeadLetterAuditDisabledError', async () => {
      const queue = uniqueQueue('audit-disabled-dl-count');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await disableAudit();

      await deadLetterOneMessage(queue);

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      await expect(deadLettered.countMessages(queue)).rejects.toThrow(
        errors.DeadLetterAuditDisabledError,
      );
    });

    it('rejects purge with DeadLetterAuditDisabledError', async () => {
      const queue = uniqueQueue('audit-disabled-dl-purge');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await disableAudit();

      await deadLetterOneMessage(queue);

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      await expect(deadLettered.purge(queue)).rejects.toThrow(
        errors.DeadLetterAuditDisabledError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Unacknowledgement history
  // -------------------------------------------------------------------------

  describe('unacknowledgement history', () => {
    it('rejects getMessageUnacknowledgementHistory with UnacknowledgmentHistoryDisabledError', async () => {
      const queue = uniqueQueue('audit-disabled-history');
      await createQueue(queue, EQueueType.FIFO_QUEUE);
      await disableAudit();

      const id = await deadLetterOneMessage(queue);

      const messageManager = RedisSMQ.createMessageManager();
      await expect(
        messageManager.getMessageUnacknowledgementHistory(id),
      ).rejects.toThrow(errors.UnacknowledgmentHistoryDisabledError);
    });
  });
});
