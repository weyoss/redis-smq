/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { ChildProcess } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { EQueueType, type TRedisSMQEvent } from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getEventBus } from '../../helpers/events/event-bus.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { consumeWithFixture } from '../../helpers/scenarios/consume-with-fixture.js';

/**
 * Integration test for the event bus's cross-process delivery.
 *
 * The bus is a *distributed* emitter: an event published by a
 * consumer or producer in one process is delivered to every
 * subscriber on the same bus, regardless of which process the
 * subscriber lives in. This test verifies the property directly:
 *
 *   1. The parent subscribes to `consumer.messageAcknowledged` on the
 *      bus.
 *   2. The parent forks a child that produces a message to a unique
 *      queue and consumes it with a file-based handler that acks.
 *   3. The child's consumer acks the message; RedisSMQ publishes
 *      the ack event on the bus.
 *   4. The event arrives at the parent's subscriber, carrying the
 *      child's message ID, the queue, and the child's consumer ID.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Subscribe to a bus event before its trigger, capture its args, and
 * return both the capture buffer and a cleanup function.
 *
 * Same shape as the sibling events files.
 */
async function setupCapture<K extends keyof TRedisSMQEvent>(
  event: K,
): Promise<{
  captured: Array<Parameters<TRedisSMQEvent[K]>>;
  cleanup: () => void;
}> {
  const bus = await getEventBus();
  const captured: Array<Parameters<TRedisSMQEvent[K]>> = [];

  const handler = ((...args: Parameters<TRedisSMQEvent[K]>) => {
    captured.push(args);
  }) as TRedisSMQEvent[K];

  bus.on(event, handler);

  return {
    captured,
    cleanup: () => bus.removeListener(event, handler),
  };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe('event bus — cross-process delivery', () => {
  it('delivers an ack event fired in a child process to a subscriber in the parent', async () => {
    // The unique queue is what makes the correlation unambiguous —
    // see the file header.
    const queue = uniqueQueue('cross-process-ack');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Subscribe before forking the child. See the file header for
    // why the ordering matters.
    const { captured, cleanup } = await setupCapture(
      'consumer.messageAcknowledged',
    );

    let child: ChildProcess | undefined;

    try {
      // Fork the worker with the `ack.js` fixture. The helper resolves
      // the bare filename to an absolute path before sending it to
      // the child — see the helper's header for why.
      child = consumeWithFixture({
        queue,
        handlerFilename: 'ack.js',
      });

      // Wait for the event to arrive at the parent. The timeout
      // covers the child's fork + initialize + produce + consume +
      // ack cycle plus the pub/sub propagation latency, with
      // generous slack for a loaded CI.
      await waitFor(() => captured.length >= 1, {
        timeoutMs: 30_000,
        description:
          `consumer.messageAcknowledged for queue ` +
          `${queue.ns}:${queue.name} arrived at the parent after the ` +
          `child acked`,
      });

      // The payload shape matches the in-process tests in
      // `consumer-events.test.ts` — three positional arguments: the
      // message ID, the queue, and the consumer ID.
      const [eventMessageId, eventQueue, eventConsumerId] = captured[0];

      // The message ID is a non-empty string. The parent cannot
      // predict the specific ID the child generated, but the shape
      // is RedisSMQ's contract.
      expect(typeof eventMessageId).toBe('string');
      expect(eventMessageId.length).toBeGreaterThan(0);

      // The queue matches the one the parent passed to the child.
      // This is the load-bearing correlation: the event is about the
      // child's ack, not about some unrelated activity on the same
      // bus.
      expect(eventQueue).toEqual({
        queueParams: queue,
        groupId: null,
      });

      // The consumer ID belongs to the child's consumer, not to any
      // consumer the parent might have created — the parent created
      // none. The check is a shape assertion rather than a value
      // comparison because the parent has no way to know the child's
      // consumer ID in advance.
      expect(typeof eventConsumerId).toBe('string');
      expect(eventConsumerId.length).toBeGreaterThan(0);
    } finally {
      cleanup();
      // Kill the child explicitly. Its own exit budget (3 seconds)
      // is a safety net; the parent's cleanup should not depend on
      // it. SIGKILL is used because the child is lingering in a
      // `setTimeout` and has no reason to handle SIGTERM.
      child?.kill('SIGKILL');
    }
  });
});
