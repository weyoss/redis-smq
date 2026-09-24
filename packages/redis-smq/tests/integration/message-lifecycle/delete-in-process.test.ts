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
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { deferred } from '../../helpers/async/deferred.js';

/**
 * Integration tests for deleting a message that is currently being
 * processed.
 *
 * A message is "in process" from the moment RedisSMQ checks it out
 * (moves it from `keyQueuePending` to the consumer's
 * `keyQueueProcessing`) until the handler either acks it or the
 * framework resolves it through the unack pipeline. During that window,
 * the message is owned by the consumer and cannot be deleted from
 * outside.
 *
 * The delete operations enforce this by reporting the message's state
 * in the `stats` object:
 *
 *     deleteMessageById(id)
 *       → {
 *           status: 'MESSAGE_NOT_DELETED',
 *           stats: { processed: 1, success: 0, notFound: 0, inProcess: 1 },
 *         }
 *
 * The `inProcess: 1` counter is the specific signal that distinguishes
 * "the message exists but is busy" from "the message does not exist"
 * (`notFound: 1`). A caller can therefore decide whether to retry the
 * delete later (in-process) or give up (not found).
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Delete in-process message', () => {
  it('rejects the delete while the handler is running, and succeeds after the ack', async () => {
    const queue = uniqueQueue('delete-in-process');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Two deferreds: one signals handler entry, the other gates the
    // handler's completion. Holding the second unresolved keeps the
    // message in process for as long as the test needs.
    const entered = deferred();
    const proceed = deferred();

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        // Signal that the message is now checked out. RedisSMQ
        // has already moved it from pending to the consumer's
        // processing list at this point; from an external observer's
        // perspective the message is PROCESSING.
        entered.notify();
        // Wait for the test to release us. Do not call cb yet.
        proceed.promise.then(() => cb());
      },
    });

    const producer = await startProducer();
    const [messageId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('in-process')
        .setConsumeTimeout(0),
    );

    await consumer.run();

    // Wait for the handler to be entered, then confirm the message is
    // in PROCESSING. The deferred signal says "the handler ran"; the
    // state read confirms RedisSMQ's own view matches. Both are
    // needed — a bug that invoked the handler before writing the state
    // would be caught by the second check even though the first
    // passed.
    await entered.promise;
    await waitForMessageStatus(messageId, EMessagePropertyStatus.PROCESSING, {
      timeoutMs: 5000,
      description: `message ${messageId} reached PROCESSING`,
    });

    // Delete attempt while in process. RedisSMQ must refuse it and
    // report `inProcess: 1`, distinguishing this case from a message
    // that simply does not exist.
    const messageManager = RedisSMQ.createMessageManager();
    const rejected = await messageManager.deleteMessageById(messageId);

    expect(rejected.status).toBe('MESSAGE_NOT_DELETED');
    expect(rejected.stats).toEqual({
      processed: 1,
      success: 0,
      notFound: 0,
      inProcess: 1,
    });

    // The failed attempt must not have modified the message. If the
    // framework removed it from `keyQueueProcessing` before checking
    // whether it was safe to delete, the handler's eventual ack would
    // fail with a state inconsistency. The next steps — allowing the
    // handler to complete, and asserting the ack — would fail loudly
    // if that happened.
    await expectMessageStatus(messageId, EMessagePropertyStatus.PROCESSING);

    // Release the handler. It calls its callback, RedisSMQ acks
    // the message, and the message moves to the acknowledged list.
    proceed.notify();

    await untilMessageAcknowledged(consumer, messageId);

    await expectMessageStatus(messageId, EMessagePropertyStatus.ACKNOWLEDGED);

    // Now the message is no longer owned by the consumer. The same
    // delete that was rejected a moment ago succeeds.
    const accepted = await messageManager.deleteMessageById(messageId);

    expect(accepted.status).toBe('OK');
    expect(accepted.stats).toEqual({
      processed: 1,
      success: 1,
      notFound: 0,
      inProcess: 0,
    });

    // The message is gone from the acknowledged list — where it landed
    // after the handler completed — and the count reflects it.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const after = await acknowledged.getMessages(queue, 0, 100);
    expect(after.totalItems).toBe(0);

    const count = await acknowledged.countMessages(queue);
    expect(count).toBe(0);
  });

  it('reports the in-process ID distinctly from missing IDs in a batch', async () => {
    const queue = uniqueQueue('delete-in-process-mixed');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const entered = deferred();
    const proceed = deferred();

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        entered.notify();
        proceed.promise.then(() => cb());
      },
    });

    const producer = await startProducer();
    const [inProcessId] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody('in-process'),
    );

    await consumer.run();

    // Sync on handler entry, then confirm the state.
    await entered.promise;
    await waitForMessageStatus(inProcessId, EMessagePropertyStatus.PROCESSING, {
      timeoutMs: 5000,
      description: `message ${inProcessId} reached PROCESSING`,
    });

    // A well-formed but nonexistent ID. Its format is the same as the
    // framework's — a UUID — so a lookup against Redis returns "not
    // found" rather than an error about the ID's shape.
    const missingId = '00000000-0000-4000-8000-000000000000';

    const messageManager = RedisSMQ.createMessageManager();
    const reply = await messageManager.deleteMessagesByIds([
      inProcessId,
      missingId,
    ]);

    // Nothing was deleted, so the status is the total-failure status.
    // `PARTIAL_SUCCESS` would require at least one successful deletion
    // in the batch; the mixed causes of failure do not produce a
    // "partial" outcome on their own.
    expect(reply.status).toBe('MESSAGE_NOT_DELETED');

    // The counters separate the two failure modes. `processed: 2`
    // confirms RedisSMQ looked at both IDs; `success: 0` and the
    // two failure counters sum to `processed`.
    expect(reply.stats).toEqual({
      processed: 2,
      success: 0,
      notFound: 1,
      inProcess: 1,
    });

    // Release the handler so the test can shut down cleanly. Without
    // this the deferred promise never resolves, the handler never
    // calls cb, and the consumer's shutdown waits for the message to
    // complete before releasing its pool connection.
    proceed.notify();
    await untilMessageAcknowledged(consumer, inProcessId);
  });
});
