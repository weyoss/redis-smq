/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { IQueueParsedParams } from '../../queue/index.js';
import { IQueueMessagesPage } from '../types/index.js';
import { QueueMessagesPaginatorAbstract } from './queue-messages-paginator-abstract.js';

export abstract class QueueMessagesPaginatorSortedSet extends QueueMessagesPaginatorAbstract {
  protected count(queue: IQueueParsedParams, cb: ICallback<number>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        client.zcard(keys[this.redisKey], cb);
      }
    });
  }

  protected getMessagesIds(
    queue: IQueueParsedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<string>>,
  ): void {
    async.waterfall(
      [
        (cb: ICallback<number>) => this.count(queue, cb),
        (totalItems: number, cb: ICallback<IQueueMessagesPage<string>>) => {
          this.redisClient.getSetInstance((err, client) => {
            if (err) cb(err);
            else if (!client) cb(new CallbackEmptyReplyError());
            else {
              if (!totalItems) {
                cb(null, {
                  cursor: 0,
                  totalItems,
                  items: [],
                });
              } else {
                const { queueParams, groupId } = queue;
                const keys = redisKeys.getQueueKeys(queueParams, groupId);
                client.zscan(
                  keys[this.redisKey],
                  String(page),
                  { COUNT: pageSize },
                  (err, reply) => {
                    if (err) cb(err);
                    else if (!reply) cb(new CallbackEmptyReplyError());
                    else
                      cb(null, {
                        cursor: Number(reply.cursor),
                        totalItems,
                        items: reply.items,
                      });
                  },
                );
              }
            }
          });
        },
      ],
      cb,
    );
  }
}
