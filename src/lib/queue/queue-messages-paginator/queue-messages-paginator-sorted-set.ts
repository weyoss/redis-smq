/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { QueueMessagesPaginatorAbstract } from './queue-messages-paginator-abstract';
import { IQueueMessagesPage, IQueueParams } from '../../../../types';

export abstract class QueueMessagesPaginatorSortedSet extends QueueMessagesPaginatorAbstract {
  countMessages(queue: string | IQueueParams, cb: ICallback<number>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const key = this.getRedisKey(queue);
        client.zcard(key, cb);
      }
    });
  }

  protected getMessagesIds(
    queue: string | IQueueParams,
    cursor: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<string>>,
  ): void {
    async.waterfall(
      [
        (cb: ICallback<number>) => this.countMessages(queue, cb),
        (totalItems: number, cb: ICallback<IQueueMessagesPage<string>>) => {
          _getCommonRedisClient((err, client) => {
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
                const key = this.getRedisKey(queue);
                client.zscan(
                  key,
                  String(cursor),
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
