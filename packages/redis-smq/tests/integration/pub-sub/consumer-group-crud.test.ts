/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EQueueDeliveryModel,
  EQueueType,
  errors,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { getGroupIds, waitForGroupIds } from '../../helpers/pub-sub/groups.js';

/**
 * Integration tests for the consumer-groups manager's CRUD API.
 *
 * A PUB_SUB queue's delivery model routes every produced message to
 * every registered consumer group. The groups themselves are managed
 * through `IConsumerGroupsManager`:
 *
 *   - `saveConsumerGroup(queue, groupId)` — create or ensure a group.
 *   - `getConsumerGroups(queue)` — list the groups on the queue.
 *   - `deleteConsumerGroup(queue, groupId)` — remove a group.
 *
 * The delete is covered in `delete-blockers.test.ts` where the
 * precondition (no active consumers) is the subject. This file
 * covers the create and list operations in isolation, plus the
 * interplay between them and the queue's delivery model.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface IPubSubFixture {
  queue: IQueueParams;
  consumerGroups: ReturnType<typeof RedisSMQ.createConsumerGroupsManager>;
}

/**
 * Create a fresh PUB_SUB queue and return it along with a
 * consumer-groups manager handle.
 */
async function makeFixture(prefix: string): Promise<IPubSubFixture> {
  const queue = uniqueQueue(prefix);
  await createQueue(queue, EQueueType.FIFO_QUEUE, EQueueDeliveryModel.PUB_SUB);

  return {
    queue,
    consumerGroups: RedisSMQ.createConsumerGroupsManager(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PUB_SUB — consumer group CRUD', () => {
  // -------------------------------------------------------------------------
  // saveConsumerGroup
  // -------------------------------------------------------------------------

  describe('saveConsumerGroup', () => {
    it('creates a group that appears in the list', async () => {
      const { queue, consumerGroups } = await makeFixture('crud-create');

      // Pre-state: no groups on a freshly-created queue.
      expect(await getGroupIds(queue)).toEqual([]);

      await consumerGroups.saveConsumerGroup(queue, 'group-a');

      await waitForGroupIds(
        queue,
        (groups) => groups.includes('group-a'),
        'group-a present after save',
      );

      expect(await getGroupIds(queue)).toEqual(['group-a']);
    });

    it('is idempotent when saving the same group twice', async () => {
      const { queue, consumerGroups } = await makeFixture('crud-idempotent');

      await consumerGroups.saveConsumerGroup(queue, 'group-a');
      // The second call must resolve without error. The bare `await`
      // is the assertion — a rejection would fail the test with the
      // actual error, and the return value is not part of the contract.
      await consumerGroups.saveConsumerGroup(queue, 'group-a');

      await waitForGroupIds(
        queue,
        (groups) => groups.includes('group-a'),
        'group-a present after first save',
      );

      // The group appears once, not twice.
      expect(await getGroupIds(queue)).toEqual(['group-a']);
    });

    it('allows multiple groups on the same queue', async () => {
      const { queue, consumerGroups } = await makeFixture('crud-multi');

      await consumerGroups.saveConsumerGroup(queue, 'group-a');
      await consumerGroups.saveConsumerGroup(queue, 'group-b');

      await waitForGroupIds(
        queue,
        (groups) => groups.includes('group-a') && groups.includes('group-b'),
        'both groups present',
      );

      expect([...(await getGroupIds(queue))].sort()).toEqual([
        'group-a',
        'group-b',
      ]);
    });

    it('rejects with QueueNotFoundError when the queue does not exist', async () => {
      const { consumerGroups } = await makeFixture('crud-missing-queue');

      const missingQueue: IQueueParams = {
        ns: 'testing',
        name: `never-created-${Date.now()}`,
      };

      await expect(
        consumerGroups.saveConsumerGroup(missingQueue, 'group-a'),
      ).rejects.toThrow(errors.QueueNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // getConsumerGroups
  // -------------------------------------------------------------------------

  describe('getConsumerGroups', () => {
    it('returns an empty list for a queue with no groups', async () => {
      const { queue } = await makeFixture('crud-empty');

      expect(await getGroupIds(queue)).toEqual([]);
    });

    it('reports all groups, including ones with no active consumers', async () => {
      const { queue, consumerGroups } = await makeFixture('crud-no-consumers');

      await consumerGroups.saveConsumerGroup(queue, 'orphan-group');

      await waitForGroupIds(
        queue,
        (groups) => groups.includes('orphan-group'),
        'orphan-group present after save',
      );

      // The group is listed even though no consumer is registered
      // under it.
      expect(await getGroupIds(queue)).toEqual(['orphan-group']);

      // The queue manager's consumer view is empty — a separate
      // accessor, a separate contract.
      const consumers = await RedisSMQ.createQueueManager().getConsumers(queue);
      expect(Object.keys(consumers)).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // deleteConsumerGroup — happy path
  // -------------------------------------------------------------------------

  describe('deleteConsumerGroup', () => {
    it('removes a group with no active consumers', async () => {
      const { queue, consumerGroups } = await makeFixture('crud-delete');

      await consumerGroups.saveConsumerGroup(queue, 'group-a');

      await waitForGroupIds(
        queue,
        (groups) => groups.includes('group-a'),
        'group-a present before delete',
      );

      await consumerGroups.deleteConsumerGroup(queue, 'group-a');

      await waitForGroupIds(
        queue,
        (groups) => !groups.includes('group-a'),
        'group-a removed after delete',
      );

      expect(await getGroupIds(queue)).toEqual([]);
    });

    it('resolves without error when deleting a group that was never registered', async () => {
      const { queue, consumerGroups } = await makeFixture(
        'crud-delete-missing',
      );

      await consumerGroups.saveConsumerGroup(queue, 'existing-group');

      // Delete a group that was never saved. The call resolves without
      // error — the `await` alone is the assertion.
      await consumerGroups.deleteConsumerGroup(queue, 'never-saved-group');

      // The existing group is untouched. The no-op delete of a
      // different group does not affect the group that does exist.
      expect(await getGroupIds(queue)).toEqual(['existing-group']);
    });
  });
});
