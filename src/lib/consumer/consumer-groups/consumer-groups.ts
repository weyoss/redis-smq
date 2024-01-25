/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../../types';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { _getConsumerGroups } from './_get-consumer-groups';
import { _parseQueueParams } from '../../queue/queue/_parse-queue-params';
import { _deleteConsumerGroup } from './_delete-consumer-group';
import { _saveConsumerGroup } from './_save-consumer-group';

export class ConsumerGroups {
  saveConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<number>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _saveConsumerGroup(client, queueParams, groupId, cb);
    });
  }

  deleteConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<void>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _deleteConsumerGroup(client, queueParams, groupId, cb);
    });
  }

  getConsumerGroups(
    queue: string | IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getConsumerGroups(client, queueParams, cb);
    });
  }
}
