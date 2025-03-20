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

export abstract class QueueMessagesPaginatorList extends QueueMessagesPaginatorAbstract {
  protected count(queue: IQueueParsedParams, cb: ICallback<number>): void {
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        client.llen(keys[this.redisKey], cb);
      }
    });
  }

  protected getMessagesIds(
    queue: IQueueParsedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<string>>,
  ): void {
    const { queueParams, groupId } = queue;
    async.waterfall(
      [
        (cb: ICallback<number>) => this.count(queue, cb),
        (totalItems: number, cb: ICallback<IQueueMessagesPage<string>>) => {
          this.redisClient.getSetInstance((err, client) => {
            if (err) cb(err);
            else if (!client) cb(new CallbackEmptyReplyError());
            else {
              const { currentPage, offsetStart, offsetEnd, totalPages } =
                this.getPaginationParams(page, totalItems, pageSize);
              const next = currentPage < totalPages ? currentPage + 1 : 0;
              if (!totalItems)
                cb(null, {
                  cursor: next,
                  totalItems,
                  items: [],
                });
              else {
                const key = redisKeys.getQueueKeys(queueParams, groupId);
                client.lrange(
                  key[this.redisKey],
                  offsetStart,
                  offsetEnd,
                  (err, items) => {
                    if (err) cb(err);
                    else {
                      cb(null, {
                        cursor: next,
                        totalItems,
                        items: items ?? [],
                      });
                    }
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
