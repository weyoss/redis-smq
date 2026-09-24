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
import {
  EMessagePropertyStatus,
  EQueueType,
  errors,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { produceOne } from '../../helpers/factories/message.js';

/**
 * Integration tests for file-based handler error paths.
 *
 * Behaviour is split across two phases:
 *
 *   Phase 1 — validation at consume() time
 *
 *     `MessageConsumer.validateHandler` is called during the handler's
 *     `goingUp` and rejects:
 *
 *       - paths whose extension is not `.js` or `.cjs`
 *         (MessageHandlerFilenameExtensionError),
 *       - `.js`/`.cjs` paths where `stat` fails, i.e. the file does not
 *         exist (MessageHandlerFileError),
 *       - non-function, non-string handlers
 *         (InvalidMessageHandlerTypeError).
 *
 *     Because validation runs inside the handler's `goingUp`, the
 *     rejection surfaces on `consume()` only when the consumer is already
 *     running. `MessageHandlerRunner.addMessageHandler` starts the
 *     handler immediately after registering it if `this.isOperational()`
 *     — so these tests run the consumer before registering the bad
 *     handler. Registering before `run()` would defer the failure to the
 *     `run()` call, which is a different (and less useful) test.
 *
 *   Phase 2 — failure at delivery time
 *
 *     A path that passes Phase 1 (a real `.js` file) is not inspected
 *     further until a message actually arrives. When `MessageConsumer`'s
 *     `invokeWorker` calls `CallableWorker.call`, the module is imported
 *     in a worker process. A module with no default export, or a module
 *     that terminates the process on load, fails at that point. The error
 *     flows to `recordOutcome`, which records an unack with cause
 *     `UNACKNOWLEDGED`. The unacknowledgement pipeline then resolves the
 *     message.
 *
 *     With `retryThreshold: 0` on the message, the resolution is
 *     DEAD_LETTER (see `MessageUnacknowledger.getResolution`): the
 *     message moves to the dead-letter list. This is the terminal state
 *     the Phase 2 tests assert on. The original
 *     `consume-message-worker/test00002.test.ts` exercised Phase 2 by
 *     producing a message with `retryThreshold: 0` and asserting the
 *     count grew; the rewrite below asserts the outcome directly.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Resolve the absolute path to a handler fixture.
 *
 * Path math: `env.getCurrentDir()` returns the directory of the
 * currently-executing test file. From `test/integration/handlers/`, the
 * fixtures directory is two levels up, then into `helpers/`:
 *
 *   ../../../              -> repository root (packages/redis-smq/)
 *   ../../helpers/         -> test/helpers/
 *   ../../helpers/fixtures/handlers/ -> test/helpers/fixtures/handlers/
 *
 * A three-dot form (`../../../helpers/...`) would resolve to
 * `packages/redis-smq/helpers/...`, which does not exist.
 */
function handlerFixturePath(filename: string): string {
  return path.resolve(
    env.getCurrentDir(),
    '../../helpers/fixtures/handlers',
    filename,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('File-based handler errors', () => {
  // -------------------------------------------------------------------------
  // Phase 1 — validation at consume() time
  // -------------------------------------------------------------------------

  describe('validation at consume() time', () => {
    it('rejects with MessageHandlerFileError when the file does not exist', async () => {
      const queue = uniqueQueue('file-missing');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // The consumer must be running before consume() is called — the
      // handler's goingUp is what runs validateHandler, and that only
      // fires for a runner that is operational.
      const consumer = createBareConsumer();
      await consumer.run();

      const missing = handlerFixturePath('does-not-exist.js');

      await expect(consumer.consume(queue, missing)).rejects.toThrow(
        errors.MessageHandlerFileError,
      );

      // A rejected consume() must not leave a registry entry behind. The
      // runner's removeMessageHandler is called on validation failure, so
      // getQueues() returns empty.
      expect(consumer.getQueues()).toEqual([]);
    });

    it('rejects with MessageHandlerFilenameExtensionError when the extension is not .js or .cjs', async () => {
      const queue = uniqueQueue('file-bad-ext');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      const wrongExt = handlerFixturePath('ack.ts');

      await expect(consumer.consume(queue, wrongExt)).rejects.toThrow(
        errors.MessageHandlerFilenameExtensionError,
      );

      expect(consumer.getQueues()).toEqual([]);
    });

    it('rejects an extensionless path with MessageHandlerFilenameExtensionError', async () => {
      // Distinct from the previous test: no extension at all rather than
      // a wrong one. RedisSMQ's check is
      // `!['.js', '.cjs'].includes(path.extname(handler))`, which rejects
      // both the same way.
      const queue = uniqueQueue('file-no-ext');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      const noExt = handlerFixturePath('ack');

      await expect(consumer.consume(queue, noExt)).rejects.toThrow(
        errors.MessageHandlerFilenameExtensionError,
      );

      expect(consumer.getQueues()).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Phase 2 — failure at delivery time
  // -------------------------------------------------------------------------

  describe('failure at delivery time', () => {
    it('dead-letters the message when the handler module has no default export', async () => {
      const queue = uniqueQueue('file-faulty');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      // Registration succeeds — validateHandler only checks the extension
      // and existence, not the module's shape. The failure surfaces when
      // the first message arrives.
      await consumer.consume(queue, handlerFixturePath('faulty.js'));

      const id = await produceOne(
        queue,
        { variant: 'faulty' },
        { retryThreshold: 0 },
      );

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 15_000,
        description: `message ${id} dead-lettered by faulty module`,
      });

      // The message reached the dead-letter list specifically, not merely
      // "some terminal state". A bug that dropped the message instead of
      // dead-lettering it would fail here even if the status happened to
      // read as DEAD_LETTERED — the list membership is the stronger
      // claim.
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const page = await deadLettered.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(1);
      expect(page.items[0].id).toBe(id);
    });

    it('dead-letters the message when the handler module terminates the process at load time', async () => {
      const queue = uniqueQueue('file-faulty-exit');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      await consumer.consume(queue, handlerFixturePath('faulty-exit.js'));

      const id = await produceOne(
        queue,
        { variant: 'faulty-exit' },
        { retryThreshold: 0 },
      );

      await waitForMessageStatus(id, EMessagePropertyStatus.DEAD_LETTERED, {
        timeoutMs: 15_000,
        description: `message ${id} dead-lettered by exiting worker`,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Recovery
  // -------------------------------------------------------------------------

  describe('recovery', () => {
    it('can register and use a valid handler after a rejected registration', async () => {
      // A rejected consume() must not leave the consumer in a state
      // where subsequent registrations fail or misbehave.
      const queueBad = uniqueQueue('recover-bad');
      const queueGood = uniqueQueue('recover-good');
      await createQueue(queueBad, EQueueType.FIFO_QUEUE);
      await createQueue(queueGood, EQueueType.FIFO_QUEUE);

      const consumer = createBareConsumer();
      await consumer.run();

      await expect(
        consumer.consume(queueBad, handlerFixturePath('does-not-exist.js')),
      ).rejects.toThrow(errors.MessageHandlerFileError);

      await consumer.consume(queueGood, handlerFixturePath('ack.js'));

      // Produce one message to the good queue and confirm it acks. The
      // ack proves the second registration worked end-to-end.
      const id = await produceOne(queueGood, { source: 'good' });

      await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
        timeoutMs: 10_000,
        description: `message ${id} acknowledged via re-registered handler`,
      });

      // The bad registration is gone, the good one is present.
      const registered = consumer
        .getQueues()
        .map((entry) => entry.queueParams.name);
      expect(registered).toEqual([queueGood.name]);
    });
  });
});
