/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/queue.js';

/**
 * Manages consumer groups on PUB/SUB queues.
 *
 * A consumer group is a named set of consumers that share a queue. For a
 * PUB/SUB queue, each message is delivered to every consumer group
 * subscribed to the queue — one copy per group. Within a group, the
 * consumers compete for messages, exactly as consumers of a
 * POINT_TO_POINT queue compete.
 *
 * Consumer groups apply only to PUB/SUB queues. Calling any method in
 * this interface against a POINT_TO_POINT queue fails with
 * `ConsumerGroupsNotSupportedError`.
 *
 * Consumers that register against a PUB/SUB queue without supplying an
 * explicit group ID are assigned an ephemeral group — `cid-<consumerId>`,
 * generated from the consumer's own ID. The group is created on
 * registration and deleted when the consumer unsubscribes. Ephemeral
 * groups are managed automatically by the library; this interface
 * manages the groups a caller creates explicitly.
 *
 * Both the promise and callback forms are declared for every
 * asynchronous method, matching the concrete class.
 *
 * @example
 * const groups = new ConsumerGroups();
 *
 * // Create a group explicitly
 * await groups.saveConsumerGroup('notifications', 'email-handlers');
 *
 * // Every consumer that subscribes under 'email-handlers' now competes
 * // for the messages the group receives.
 *
 * // Enumerate the groups
 * const all = await groups.getConsumerGroups('notifications');
 *
 * // Remove the group (fails if it still has consumers or messages)
 * await groups.deleteConsumerGroup('notifications', 'email-handlers');
 */
export interface IConsumerGroupsManager {
  /**
   * Creates a consumer group on a queue.
   *
   * The group is identified by its ID within the queue's namespace. The
   * ID must satisfy the library's Redis-key rules (start with a letter;
   * letters, digits, `-`, `_`, and `.` thereafter). An invalid ID fails
   * with `InvalidConsumerGroupIdError`.
   *
   * Creating a group that already exists is not an error. The method
   * returns `1` for a newly created group and `0` for a group that was
   * already present, matching Redis's `SADD` semantics. A caller who
   * needs to distinguish the two cases inspects the return value.
   *
   * Fails with `ConsumerGroupsNotSupportedError` if the queue is
   * POINT_TO_POINT. Fails with `QueueNotFoundError` if the queue does
   * not exist. Fails with `QueueLockedError` if the queue is LOCKED and
   * no matching lock ID was supplied.
   *
   * A successful creation emits a `queue.consumerGroupCreated` event on
   * the event bus. The event fires whether the group was newly created
   * or already existed — it is a "group is present" notification, not a
   * strictly-new signal. A caller who needs the strict version uses the
   * return value to distinguish.
   *
   * @example
   * // Promise
   * const result = await groups.saveConsumerGroup('notifications', 'email-handlers');
   * if (result === 1) {
   *   console.log('Group created');
   * } else {
   *   console.log('Group already existed');
   * }
   *
   * // Callback
   * groups.saveConsumerGroup('notifications', 'email-handlers', (err, result) => {
   *   if (err) throw err;
   *   console.log(result);
   * });
   */
  saveConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
  ): Promise<number>;
  saveConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<number>,
  ): void;

  /**
   * Deletes a consumer group from a queue.
   *
   * Deletion removes the group from the queue's group registry, deletes
   * the group's pending list (or sorted set, for priority queues), and
   * deletes the group's consumer set.
   *
   * Two preconditions must hold before the deletion is allowed:
   *
   *   - The group must have no active consumers. A group with at least
   *     one subscribed consumer fails with
   *     `ConsumerGroupHasActiveConsumersError`.
   *
   *   - The group's pending queue must be empty. A group with at least
   *     one message in its pending list or sorted set fails with
   *     `ConsumerGroupNotEmptyError`.
   *
   * The preconditions exist because deleting a group that is still in
   * use would silently orphan either the consumers (which would continue
   * to listen on a queue that no longer routes to them) or the messages
   * (which would be lost when the pending list is deleted).
   *
   * Fails with `ConsumerGroupsNotSupportedError` if the queue is
   * POINT_TO_POINT. Fails with `QueueNotFoundError` if the queue does
   * not exist. Fails with `QueueLockedError` if the queue is LOCKED and
   * no matching lock ID was supplied.
   *
   * A successful deletion emits a `queue.consumerGroupDeleted` event on
   * the event bus.
   *
   * @example
   * // Promise
   * await groups.deleteConsumerGroup('notifications', 'email-handlers');
   *
   * // Callback
   * groups.deleteConsumerGroup('notifications', 'email-handlers', (err) => {
   *   if (err) throw err;
   * });
   */
  deleteConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
  ): Promise<void>;
  deleteConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback,
  ): void;

  /**
   * Returns every consumer group registered on a queue.
   *
   * The result is a flat list of group IDs. Order is undefined. A queue
   * with no groups returns an empty array.
   *
   * For a PUB/SUB queue with ephemeral groups (consumers that did not
   * supply a group ID), the ephemeral IDs appear in the result alongside
   * any explicitly created groups. Ephemeral IDs are prefixed with
   * `cid-` so they can be distinguished from caller-chosen group IDs.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist. Does
   * not fail for a POINT_TO_POINT queue — it returns an empty array,
   * because a POINT_TO_POINT queue has no group registry. This is
   * inconsistent with `saveConsumerGroup` and `deleteConsumerGroup`,
   * which both reject non-PUB/SUB queues; the contract preserves the
   * asymmetry rather than harmonizing it.
   *
   * @example
   * // Promise
   * const groups = await consumerGroups.getConsumerGroups('notifications');
   * groups.forEach((id) => console.log(id));
   *
   * // Callback
   * consumerGroups.getConsumerGroups('notifications', (err, groups) => {
   *   if (err) throw err;
   *   console.log(groups);
   * });
   */
  getConsumerGroups(queue: string | IQueueParams): Promise<string[]>;
  getConsumerGroups(
    queue: string | IQueueParams,
    cb: ICallback<string[]>,
  ): void;
}
