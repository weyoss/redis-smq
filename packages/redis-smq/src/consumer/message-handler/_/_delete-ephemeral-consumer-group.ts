import { ConsumerGroups } from '../../../consumer-groups/index.js';
import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../../../queue-manager/index.js';
import { _generateEphemeralConsumerGroupId } from './_generate-ephemeral-consumer-group-id.js';

export function _deleteEphemeralConsumerGroup(
  queueParams: IQueueParams,
  consumerId: string,
  cb: ICallback,
) {
  const consumerGroups: ConsumerGroups = new ConsumerGroups();
  const groupId = _generateEphemeralConsumerGroupId(consumerId);
  consumerGroups.deleteConsumerGroup(queueParams, groupId, cb);
}
