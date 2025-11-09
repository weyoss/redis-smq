/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ConsumerGroups } from '../../../consumer-groups/index.js';
import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../../../queue-manager/index.js';
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
