/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { env } from 'redis-smq-common';
import { EMessagePropertyStatus, EQueueType } from '../../../src/index.js';
import {
  expectMessageStatus,
  waitForMessageStatus,
} from '../../helpers/assertions/message-status.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { produceOne } from '../../helpers/factories/message.js';

/**
 * Integration tests for file-based message handlers.
 *
 * `consumer.consume(queue, handlerPath)` accepts a file path in place of
 * an inline handler. RedisSMQ loads the module at that path, checks
 * that it has a default export shaped like a handler, and uses it.
 * File-based handlers are the way a user runs handler logic in a separate
 * process or worker.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Resolve the absolute path to a handler fixture.
 *
 * See the file header for the path math. The parameter type is
 * `` `${string}.js` `` so a caller who forgets the extension gets a
 * compile error rather than a runtime `MessageHandlerFilenameExtensionError`.
 */
function handlerFixturePath(filename: `${string}.js`): string {
  return path.resolve(
    env.getCurrentDir(),
    '../../helpers/fixtures/handlers',
    filename,
  );
}

const ACK_HANDLER = handlerFixturePath('ack.js');
const UNACK_HANDLER = handlerFixturePath('unack.js');

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('File-based message handlers', () => {
  // -------------------------------------------------------------------------
  // Loading and running
  // -------------------------------------------------------------------------

  describe('loading', () => {
    it('loads a file-based handler and consumes a message', async () => {
      const queue = uniqueQueue('file-basic');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queue, ACK_HANDLER);

      const id = await produceOne(queue, { hello: 'world' });

      // Subscribe before run — the ack awaiter must be installed before
      // the consumer's first poll can fire the event.
      const acked = untilMessageAcknowledged(consumer, id);

      await consumer.run();
      await acked;

      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
    });
  });

  // -------------------------------------------------------------------------
  // The loaded file is the specified file
  // -------------------------------------------------------------------------

  describe('the loaded file is the one specified', () => {
    it('runs the ack fixture when the ack fixture path is given', async () => {
      const queue = uniqueQueue('file-ack');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queue, ACK_HANDLER);

      const id = await produceOne(queue, { variant: 'ack' });

      const acked = untilMessageAcknowledged(consumer, id);
      await consumer.run();
      await acked;

      await expectMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
    });

    it('runs the unack fixture when the unack fixture path is given', async () => {
      const queue = uniqueQueue('file-unack');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queue, UNACK_HANDLER);

      const id = await produceOne(
        queue,
        { variant: 'unack' },
        { retryThreshold: 0 },
      );

      await consumer.run();

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 10_000,
        description: `message ${id} dead-lettered by unack fixture`,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Multiple registrations
  // -------------------------------------------------------------------------

  describe('multiple registrations', () => {
    it('registers the same file for multiple queues on one consumer', async () => {
      const queueA = uniqueQueue('file-multi-a');
      const queueB = uniqueQueue('file-multi-b');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.consume(queueA, ACK_HANDLER);
      await consumer.consume(queueB, ACK_HANDLER);

      const idA = await produceOne(queueA, { queue: 'a' });
      const idB = await produceOne(queueB, { queue: 'b' });

      // Both awaiters must be created BEFORE `consumer.run()`. Creating
      // `ackedB` after `await ackedA` would race the idB event, which may
      // fire while the second awaiter is still being constructed.
      const ackedA = untilMessageAcknowledged(consumer, idA);
      const ackedB = untilMessageAcknowledged(consumer, idB);

      await consumer.run();
      await Promise.all([ackedA, ackedB]);

      // Both queues' messages are acknowledged — the file was loaded
      // twice (or shared correctly), and each registration delivered.
      await expectMessageStatus(idA, EMessagePropertyStatus.ACKNOWLEDGED);
      await expectMessageStatus(idB, EMessagePropertyStatus.ACKNOWLEDGED);
    });

    it('allows file-based and inline handlers to coexist on one consumer', async () => {
      const fileQueue = uniqueQueue('coexist-file');
      const inlineQueue = uniqueQueue('coexist-inline');
      await createQueue(fileQueue, EQueueType.FIFO_QUEUE);
      await createQueue(inlineQueue, EQueueType.FIFO_QUEUE);

      // Track inline invocations so the test can prove the inline
      // handler ran, not just that its message was acked.
      let inlineInvoked = 0;

      const consumer = createBareConsumer();
      await consumer.consume(fileQueue, ACK_HANDLER);
      await consumer.consume(inlineQueue, (_msg, cb) => {
        inlineInvoked += 1;
        cb();
      });

      const fileId = await produceOne(fileQueue, { source: 'file' });
      const inlineId = await produceOne(inlineQueue, { source: 'inline' });

      // Both awaiters before run, same reasoning as the previous test.
      const fileAcked = untilMessageAcknowledged(consumer, fileId);
      const inlineAcked = untilMessageAcknowledged(consumer, inlineId);

      await consumer.run();
      await Promise.all([fileAcked, inlineAcked]);

      await expectMessageStatus(fileId, EMessagePropertyStatus.ACKNOWLEDGED);
      await expectMessageStatus(inlineId, EMessagePropertyStatus.ACKNOWLEDGED);

      expect(inlineInvoked).toBe(1);
    });
  });
});
