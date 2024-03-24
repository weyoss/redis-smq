/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  ICallback,
  IRedisClient,
} from 'redis-smq-common';
import { IQueueParams } from '../../../queue/index.js';
import { _getQueues } from '../../../queue/_/_get-queues.js';
import { ITopicParams } from '../../types/index.js';
import { _getTopicExchangeParams } from './_get-topic-exchange-params.js';

export function _getTopicExchangeQueues(
  redisClient: IRedisClient,
  topic: ITopicParams | string,
  cb: ICallback<IQueueParams[]>,
): void {
  const topicParams = _getTopicExchangeParams(topic);
  if (topicParams instanceof Error) cb(topicParams);
  else {
    _getQueues(redisClient, (err, queues) => {
      if (err) cb(err);
      else if (!queues) cb(new CallbackEmptyReplyError());
      else {
        const matched: IQueueParams[] = [];
        const regExp = new RegExp(topicParams.topic);
        async.eachOf(
          queues,
          (queue, index, done) => {
            if (queue.ns === topicParams.ns && regExp.test(queue.name))
              matched.push(queue);
            done();
          },
          (err) => cb(err, matched),
        );
      }
    });
  }
}
