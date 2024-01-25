/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IConsumableMessage,
  IQueueMessages,
  IQueueMessagesPage,
  IQueueMessagesPageParams,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../../../../types';
import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { _deleteMessage } from '../../message/_delete-message';
import { Message } from '../../message/message';
import { _validateQueueExtendedParams } from '../_validate-queue-extended-params';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { _parseQueueExtendedParams } from '../queue/_parse-queue-extended-params';

export abstract class QueueMessagesPaginatorAbstract implements IQueueMessages {
  protected requireGroupId: boolean = false;
  protected abstract redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>;

  protected getTotalPages(pageSize: number, totalItems: number): number {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages === 0) return 1;
    return totalPages;
  }

  protected getPaginationParams(
    cursor: number,
    totalItems: number,
    pageSize: number,
  ): IQueueMessagesPageParams {
    const totalPages = this.getTotalPages(pageSize, totalItems);
    const currentPage = cursor < 1 || cursor > totalPages ? 1 : cursor;
    const offsetBase = currentPage - 1;
    const offsetStart = offsetBase * pageSize;
    const offsetEnd = offsetStart + pageSize - 1;
    return {
      offsetStart,
      offsetEnd,
      currentPage,
      totalPages,
    };
  }

  protected abstract getMessagesIds(
    queue: IQueueParsedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<string>>,
  ): void;

  protected abstract count(
    queue: IQueueParsedParams,
    cb: ICallback<number>,
  ): void;

  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    _validateQueueExtendedParams(parsedParams, this.requireGroupId, (err) => {
      if (err) cb(err);
      else this.count(parsedParams, cb);
    });
  }

  purge(queue: TQueueExtendedParams, cb: ICallback<void>): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    _validateQueueExtendedParams(parsedParams, this.requireGroupId, (err) => {
      if (err) cb(err);
      else
        _getCommonRedisClient((err, client) => {
          if (err) cb(err);
          else if (!client) cb(new CallbackEmptyReplyError());
          else {
            const deleteMessages = (cursor = '0') => {
              async.waterfall<string>(
                [
                  (cb: ICallback<IQueueMessagesPage<string>>) => {
                    this.getMessagesIds(parsedParams, Number(cursor), 1000, cb);
                  },
                  (
                    reply: IQueueMessagesPage<string>,
                    cb: ICallback<string>,
                  ) => {
                    const { items, cursor } = reply;
                    _deleteMessage(client, items, (err) => {
                      if (err) cb(err);
                      else cb(null, String(cursor));
                    });
                  },
                ],
                (err, next) => {
                  if (err) cb(err);
                  else if (next !== '0') deleteMessages(next);
                  else cb();
                },
              );
            };
            deleteMessages('0');
          }
        });
    });
  }

  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<IConsumableMessage>>,
  ): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    _validateQueueExtendedParams(parsedParams, this.requireGroupId, (err) => {
      if (err) cb(err);
      else
        this.getMessagesIds(parsedParams, page, pageSize, (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else {
            if (reply.items.length) {
              _getCommonRedisClient((err, client) => {
                if (err) cb(err);
                else if (!client) cb(new CallbackEmptyReplyError());
                else {
                  const message = new Message();
                  message.getMessagesByIds(reply.items, (err, items) => {
                    if (err) cb(err);
                    else {
                      cb(null, { ...reply, items: items ?? [] });
                    }
                  });
                }
              });
            } else cb(null, { ...reply, items: [] });
          }
        });
    });
  }
}
