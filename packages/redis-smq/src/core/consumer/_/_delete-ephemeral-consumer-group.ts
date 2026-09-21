import { ConsumerGroupsManager } from '../../consumer-groups/index.js';
import { ICallback } from 'redis-smq-common';
import { _generateEphemeralConsumerGroupId } from './_generate-ephemeral-consumer-group-id.js';
import { IQueueParams } from '../../../contracts/index.js';

export function _deleteEphemeralConsumerGroup(
  queueParams: IQueueParams,
  consumerId: string,
  ephemeralConsumerGroupId: string | null,
  cb: ICallback,
) {
  const consumerGroups: ConsumerGroupsManager = new ConsumerGroupsManager();
  const groupId = ephemeralConsumerGroupId
    ? ephemeralConsumerGroupId
    : _generateEphemeralConsumerGroupId(consumerId);
  consumerGroups.deleteConsumerGroup(queueParams, groupId, cb);
}
