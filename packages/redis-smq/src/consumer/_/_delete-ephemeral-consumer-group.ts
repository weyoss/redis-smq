/*
 * packages/redis-smq/src/consumer/_/_delete-ephemeral-consumer-group.ts
 */

import { ConsumerGroups } from '../../consumer-groups/index.js';
import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../../queue-manager/index.js';
import { _generateEphemeralConsumerGroupId } from './_generate-ephemeral-consumer-group-id.js';

export function _deleteEphemeralConsumerGroup(
  queueParams: IQueueParams,
  consumerId: string,
  ephemeralConsumerGroupId: string | null,
  cb: ICallback,
) {
  const consumerGroups: ConsumerGroups = new ConsumerGroups();
  const groupId = ephemeralConsumerGroupId
    ? ephemeralConsumerGroupId
    : _generateEphemeralConsumerGroupId(consumerId);
  consumerGroups.deleteConsumerGroup(queueParams, groupId, cb);
}
