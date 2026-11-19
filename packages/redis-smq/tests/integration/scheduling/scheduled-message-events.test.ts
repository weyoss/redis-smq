/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { EQueueType, RedisSMQ, TRedisSMQEvent } from '../../../src/index.js';
import { getEventBus } from '../../helpers/events/event-bus.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { startScheduleWorker } from '../../helpers/workers/schedule-worker.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';

describe('scheduled message firing events', () => {
  it('emits scheduler.messagePublished for a firing, not producer.messagePublished', async () => {
    const queue = uniqueQueue('sched-events');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const bus = await getEventBus();
    const schedulerEvents: Array<
      Parameters<TRedisSMQEvent['scheduler.messagePublished']>
    > = [];
    const producerEvents: Array<
      Parameters<TRedisSMQEvent['producer.messagePublished']>
    > = [];

    bus.on('scheduler.messagePublished', (...args) =>
      schedulerEvents.push(args),
    );
    bus.on('producer.messagePublished', (...args) => producerEvents.push(args));

    const producer = await startProducer();
    await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('fired')
        .setScheduledDelay(500),
    );

    await startScheduleWorker(queue);

    const pending = RedisSMQ.createQueuePendingMessages();
    await waitFor(async () => (await pending.countMessages(queue)) >= 1, {
      timeoutMs: 15_000,
      description: 'scheduled message reached pending',
    });

    // The scheduler emitted exactly one event for the firing.
    expect(schedulerEvents).toHaveLength(1);
    const [messageId, eventQueue] = schedulerEvents[0];
    expect(typeof messageId).toBe('string');
    expect(eventQueue).toEqual({ queueParams: queue, groupId: null });

    // The producer did NOT emit an event for the firing — the original
    // produce went to the scheduled set, not to a pending queue, and the
    // firing is the scheduler's event, not the producer's.
    expect(producerEvents).toHaveLength(0);
  });
});
