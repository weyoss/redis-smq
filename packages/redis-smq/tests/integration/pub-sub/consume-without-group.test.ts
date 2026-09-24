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
  EQueueDeliveryModel,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { _generateEphemeralConsumerGroupId } from '../../../src/core/consumer/_/_generate-ephemeral-consumer-group-id.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import {
  createBareConsumer,
  getConsumer,
} from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { getGroupIds } from '../../helpers/pub-sub/groups.js';

/**
 * Integration tests for consuming a PUB_SUB queue without an explicit
 * consumer group.
 *
 * A PUB_SUB queue delivers a copy of every message to every registered
 * consumer group. The group is normally supplied by the caller —
 * `consumer.consume({ queueParams, groupId }, handler)` — but it is
 * optional. When the caller omits it, RedisSMQ generates an
 * *ephemeral* group for the consumer, derived from the consumer's own
 * ID.
 *
 * The generated ID has the form `cid-<consumerId>`. RedisSMQ uses
 * that derivation consistently:
 *
 *   - `_prepareConsumerGroup` generates the ID when a PUB_SUB queue is
 *     consumed without one.
 *   - `_deleteEphemeralConsumerGroup` regenerates the same ID for
 *     cleanup, so the consumer's shutdown removes its own group
 *     without needing to look it up.
 *
 * The tests below pin the observable consequences of the generated ID:
 * the group is created, delivery works, and two consumers without
 * explicit groups get two *distinct* ephemeral groups.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PUB_SUB — consuming without an explicit group', () => {
  // -------------------------------------------------------------------------
  // Ephemeral group creation
  // -------------------------------------------------------------------------

  describe('group creation', () => {
    it('creates an ephemeral group when consume() is called without one', async () => {
      const queue = uniqueQueue('pubsub-no-group');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const consumer = createBareConsumer();
      await consumer.consume(
        queue,
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );

      // The group exists, and its ID matches RedisSMQ's own
      // derivation for this consumer.
      const expectedGroupId = _generateEphemeralConsumerGroupId(
        consumer.getId(),
      );

      await waitFor(
        async () => (await getGroupIds(queue)).includes(expectedGroupId),
        {
          timeoutMs: 5000,
          description: `ephemeral group ${expectedGroupId} registered on the queue`,
        },
      );

      // Re-read for the definitive assertion, so a failure names the
      // actual group list rather than a timeout.
      const groups = await getGroupIds(queue);
      expect(groups).toEqual([expectedGroupId]);

      // The group ID is not the consumer ID — the ephemeral group is a
      // distinct entity, and a regression that stored the consumer ID
      // directly would collide with the "explicit group" namespace.
      expect(expectedGroupId).not.toBe(consumer.getId());
    });

    it('does not create an ephemeral group when an explicit group is supplied', async () => {
      const queue = uniqueQueue('pubsub-explicit-group');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const explicitGroupId = 'explicit-group';
      const consumer = createBareConsumer();
      await consumer.consume(
        { queueParams: queue, groupId: explicitGroupId },
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );

      await waitFor(
        async () => (await getGroupIds(queue)).includes(explicitGroupId),
        {
          timeoutMs: 5000,
          description: `explicit group ${explicitGroupId} registered on the queue`,
        },
      );

      const groups = await getGroupIds(queue);
      expect(groups).toEqual([explicitGroupId]);

      // The generated ID for this consumer is not in the list. If it
      // were, RedisSMQ would have created two groups for one
      // consumer — the case this test exists to rule out.
      const generatedGroupId = _generateEphemeralConsumerGroupId(
        consumer.getId(),
      );
      expect(groups).not.toContain(generatedGroupId);
    });
  });

  // -------------------------------------------------------------------------
  // Delivery via the ephemeral group
  // -------------------------------------------------------------------------

  describe('delivery via the ephemeral group', () => {
    it('delivers and acknowledges a produced message', async () => {
      const queue = uniqueQueue('pubsub-delivery');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const producer = await startProducer();
      const [messageId] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('pubsub-payload'),
      );

      // Subscribe before run — the ack awaiter must be in place before
      // the consumer's first poll can fire the event.
      const acked = untilMessageAcknowledged(consumer, messageId);

      await consumer.run();
      await acked;

      // The message reached the ephemeral consumer. Both the ack event
      // and the ephemeral group's existence are observable; the ack
      // is the stronger claim because it confirms the handler ran.
      const groups = await getGroupIds(queue);
      expect(groups).toContain(
        _generateEphemeralConsumerGroupId(consumer.getId()),
      );
    });

    it('delivers a copy to each of two consumers without explicit groups', async () => {
      const queue = uniqueQueue('pubsub-two-consumers');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      // Capture each consumer's received messages. The bodies confirm
      // that both consumers received the *same logical message* even
      // though RedisSMQ assigned distinct copy IDs.
      const receivedA: IMessageTransferable[] = [];
      const receivedB: IMessageTransferable[] = [];

      const consumerA = await getConsumer({
        queue,
        messageHandler: (msg: IMessageTransferable, cb: ICallback) => {
          receivedA.push(msg);
          cb();
        },
      });
      const consumerB = await getConsumer({
        queue,
        messageHandler: (msg: IMessageTransferable, cb: ICallback) => {
          receivedB.push(msg);
          cb();
        },
      });

      // Both ephemeral groups exist and are distinct.
      const groupA = _generateEphemeralConsumerGroupId(consumerA.getId());
      const groupB = _generateEphemeralConsumerGroupId(consumerB.getId());

      await waitFor(
        async () => {
          const groups = await getGroupIds(queue);
          return groups.includes(groupA) && groups.includes(groupB);
        },
        {
          timeoutMs: 5000,
          description: 'both ephemeral groups registered on the queue',
        },
      );

      expect(groupA).not.toBe(groupB);

      // Produce a single message. With two groups on the queue, the
      // framework produces one copy per group.
      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody('fan-out'),
      );

      // Wait for each consumer to ack any message. The awaiter is not
      // filtered by message ID because the produced ID corresponds to
      // only one of the two copies.
      const ackedA = untilMessageAcknowledged(consumerA);
      const ackedB = untilMessageAcknowledged(consumerB);

      await consumerA.run();
      await consumerB.run();

      await Promise.all([ackedA, ackedB]);

      // Each consumer received exactly one message with the expected
      // body. The count assertions catch both directions of fan-out
      // failure: if only one consumer received the message, the other
      // array would be empty and the `toHaveLength(1)` would fail; if
      // one consumer received two copies, its length would be 2.
      expect(receivedA).toHaveLength(1);
      expect(receivedB).toHaveLength(1);
      expect(receivedA[0].body).toBe('fan-out');
      expect(receivedB[0].body).toBe('fan-out');

      // Both ephemeral groups are still registered — the ack does not
      // remove them. The group's lifetime is the consumer's, and the
      // cleanup happens on cancel or shutdown (see
      // `ephemeral-group-lifecycle.test.ts`).
      const finalGroups = await getGroupIds(queue);
      expect(finalGroups).toContain(groupA);
      expect(finalGroups).toContain(groupB);
    });
  });
});
