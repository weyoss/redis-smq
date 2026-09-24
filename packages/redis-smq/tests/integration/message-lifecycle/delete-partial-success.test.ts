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
  type IQueueParams,
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
 * Integration tests for the mixed-outcome case of `deleteMessagesByIds`.
 *
 * A batch delete processes every ID in the input and reports the
 * aggregate outcome through a `status` string plus a `stats` object.
 * The status has three values:
 *
 *     every ID succeeded       →  'OK'
 *     some succeeded           →  'PARTIAL_SUCCESS'
 *     none succeeded           →  'MESSAGE_NOT_DELETED'
 *
 * The `stats` object carries the per-outcome counters:
 *
 *     {
 *       processed:  number of IDs RedisSMQ looked at
 *       success:    number of messages actually deleted
 *       notFound:   number that did not exist or were in an undeletable state
 *       inProcess:  number currently checked out by a consumer
 *     }
 *
 * `success + notFound + inProcess` sums to `processed`, and the status
 * is derived from those counters rather than being set independently.
 * A caller who needs to distinguish "the operation partially succeeded
 * because one message was already gone" from "it partially succeeded
 * because one message was busy" reads the counters, not the status.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce a message, deliver it to a consumer that acks it, and shut
 * the consumer and producer down.
 *
 * The result is a message in the acknowledged list, which is the
 * simplest terminal state to set up (one delivery, one ack, no retry
 * pipeline, no worker). The partial-success tests use acknowledged
 * messages because the delete operation is queue-state-agnostic — the
 * aggregation logic this file exercises is the same regardless of which
 * list the messages were in.
 */
async function produceAcknowledgedMessage(
  queue: IQueueParams,
): Promise<string> {
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
  });

  const producer = await startProducer();
  const [messageId] = await producer.produce(
    RedisSMQ.newProducibleMessage().setQueue(queue).setBody('will-be-acked'),
  );

  await consumer.run();

  await waitForMessageStatus(messageId, EMessagePropertyStatus.ACKNOWLEDGED, {
    timeoutMs: 10_000,
    description: `setup: message ${messageId} reached ACKNOWLEDGED`,
  });

  await consumer.shutdown();
  await producer.shutdown();

  return messageId;
}

/**
 * A well-formed but nonexistent ID. Uses the same UUID format the
 * framework assigns, so a lookup fails with "not found" rather than an
 * error about the ID's shape. Two distinct constants ensure the tests
 * that use two missing IDs are actually exercising two different
 * lookups.
 */
const MISSING_ID_1 = '00000000-0000-4000-8000-000000000001';
const MISSING_ID_2 = '00000000-0000-4000-8000-000000000002';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Delete messages by IDs — partial success', () => {
  // -------------------------------------------------------------------------
  // OK baseline
  // -------------------------------------------------------------------------

  it('returns OK when every ID in the batch is deleted', async () => {
    const queue = uniqueQueue('partial-ok');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const id1 = await produceAcknowledgedMessage(queue);
    const id2 = await produceAcknowledgedMessage(queue);

    const messageManager = RedisSMQ.createMessageManager();
    const reply = await messageManager.deleteMessagesByIds([id1, id2]);

    expect(reply.status).toBe('OK');
    expect(reply.stats).toEqual({
      processed: 2,
      success: 2,
      notFound: 0,
      inProcess: 0,
    });
  });

  // -------------------------------------------------------------------------
  // PARTIAL_SUCCESS — mix of success and not-found
  // -------------------------------------------------------------------------

  it('returns PARTIAL_SUCCESS when one ID succeeds and another is already gone', async () => {
    const queue = uniqueQueue('partial-gone');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const id1 = await produceAcknowledgedMessage(queue);
    const id2 = await produceAcknowledgedMessage(queue);

    const messageManager = RedisSMQ.createMessageManager();

    // Delete id1 first. It succeeds and is removed from the acknowledged
    // list. id2 remains.
    const firstDelete = await messageManager.deleteMessageById(id1);
    expect(firstDelete.status).toBe('OK');
    expect(firstDelete.stats.success).toBe(1);

    // Confirm the pre-state of the second delete: id2 is present, id1
    // is not. Without this, a bug that somehow left id1 in place would
    // produce a different reply shape and the failure would point at
    // the second delete rather than at the first's post-state.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const beforeSecond = await acknowledged.getMessages(queue, 0, 100);
    expect(beforeSecond.totalItems).toBe(1);
    expect(beforeSecond.items[0].id).toBe(id2);

    // Second delete: [id1 (gone), id2 (present)].
    const reply = await messageManager.deleteMessagesByIds([id1, id2]);

    expect(reply.status).toBe('PARTIAL_SUCCESS');
    expect(reply.stats).toEqual({
      processed: 2,
      success: 1,
      notFound: 1,
      inProcess: 0,
    });

    // The successful ID was actually removed. A regression where the
    // stats reported `success: 1` but the message was not removed from
    // the acknowledged list would fail here, and the failure would
    // name the count mismatch.
    const after = await acknowledged.getMessages(queue, 0, 100);
    expect(after.totalItems).toBe(0);

    const count = await acknowledged.countMessages(queue);
    expect(count).toBe(0);
  });

  it('counts each notFound ID separately when a batch has multiple missing IDs', async () => {
    const queue = uniqueQueue('partial-multiple-missing');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const existingId = await produceAcknowledgedMessage(queue);

    const messageManager = RedisSMQ.createMessageManager();
    const reply = await messageManager.deleteMessagesByIds([
      existingId,
      MISSING_ID_1,
      MISSING_ID_2,
    ]);

    expect(reply.status).toBe('PARTIAL_SUCCESS');
    expect(reply.stats).toEqual({
      processed: 3,
      success: 1,
      notFound: 2,
      inProcess: 0,
    });

    // The existing message was deleted; the missing ones never existed.
    // The acknowledged list is empty.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    expect(await acknowledged.countMessages(queue)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // PARTIAL_SUCCESS — mix of success and in-process
  // -------------------------------------------------------------------------

  it('returns PARTIAL_SUCCESS when one ID is deletable and another is in process', async () => {
    const queue = uniqueQueue('partial-in-process');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const entered = deferred();
    const proceed = deferred();

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        entered.notify();
        void proceed.promise.then(() => cb());
      },
    });

    const producer = await startProducer();
    const [inProcessId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('will-be-processed'),
    );
    const [pendingId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('will-stay-pending'),
    );

    await consumer.run();

    // Wait for the handler to be entered. When `entered.promise`
    // resolves, `inProcessId` has been checked out and the handler is
    // holding it. The consumer is blocked on that message, so
    // `pendingId` has not yet been dequeued.
    await entered.promise;

    // Confirm the state assignment before deleting. If RedisSMQ
    // had picked up the wrong message first, the delete below would
    // exercise a different combination than the test intends, and the
    // stats assertion would fail in a confusing way.
    await expectMessageStatus(inProcessId, EMessagePropertyStatus.PROCESSING);
    await expectMessageStatus(pendingId, EMessagePropertyStatus.PENDING);

    const messageManager = RedisSMQ.createMessageManager();
    const reply = await messageManager.deleteMessagesByIds([
      inProcessId,
      pendingId,
    ]);

    expect(reply.status).toBe('PARTIAL_SUCCESS');
    expect(reply.stats).toEqual({
      processed: 2,
      success: 1,
      notFound: 0,
      inProcess: 1,
    });

    // The in-process message was not disturbed by the delete attempt.
    // A regression that removed the message from the consumer's
    // processing queue before checking whether it was safe to delete
    // would leave the handler unable to ack — the ack would fail with
    // "message not found", and the assertion below would catch it.
    await expectMessageStatus(inProcessId, EMessagePropertyStatus.PROCESSING);

    // Release the handler. It calls its callback, RedisSMQ acks
    // the message, and the message moves to the acknowledged list.
    proceed.notify();
    await untilMessageAcknowledged(consumer, inProcessId);

    // The message reaches its terminal state normally. The failed
    // delete attempt did not disrupt the pipeline.
    await expectMessageStatus(inProcessId, EMessagePropertyStatus.ACKNOWLEDGED);

    // The pending message was deleted; the in-process message was not.
    // One message is in acknowledged (the one the handler just acked),
    // and none are pending.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    expect(await acknowledged.countMessages(queue)).toBe(1);
  });
});
