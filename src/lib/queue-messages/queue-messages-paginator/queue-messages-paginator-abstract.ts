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
  logger,
} from 'redis-smq-common';
import { RedisClientInstance } from '../../../common/redis-client/redis-client-instance.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { _deleteMessage } from '../../message/_/_delete-message.js';
import { IMessageTransferable, Message } from '../../message/index.js';
import { _parseQueueExtendedParams } from '../../queue/_/_parse-queue-extended-params.js';
import { IQueueParsedParams, TQueueExtendedParams } from '../../queue/index.js';
import { _validateQueueExtendedParams } from '../_/_validate-queue-extended-params.js';
import {
  IQueueMessages,
  IQueueMessagesPage,
  IQueueMessagesPageParams,
} from '../types/index.js';

export abstract class QueueMessagesPaginatorAbstract implements IQueueMessages {
  protected redisClient;
  protected logger;
  protected message;
  protected requireGroupId: boolean = false;
  protected abstract redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `queue-messages`,
    );
    this.redisClient = new RedisClientInstance();
    this.redisClient.on('error', (err) => this.logger.error(err));
    this.message = new Message();
  }

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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const parsedParams = _parseQueueExtendedParams(queue);
        if (parsedParams instanceof Error) cb(parsedParams);
        else {
          _validateQueueExtendedParams(
            client,
            parsedParams,
            this.requireGroupId,
            (err) => {
              if (err) cb(err);
              else this.count(parsedParams, cb);
            },
          );
        }
      }
    });
  }

  purge(queue: TQueueExtendedParams, cb: ICallback<void>): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) cb(parsedParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          _validateQueueExtendedParams(
            client,
            parsedParams,
            this.requireGroupId,
            (err) => {
              if (err) cb(err);
              else {
                const deleteMessages = (cursor = '0') => {
                  async.waterfall<string>(
                    [
                      (cb: ICallback<IQueueMessagesPage<string>>) => {
                        this.getMessagesIds(
                          parsedParams,
                          Number(cursor),
                          1000,
                          cb,
                        );
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
            },
          );
        }
      });
    }
  }

  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<IMessageTransferable>>,
  ): void {
    const parsedParams = _parseQueueExtendedParams(queue);
    if (parsedParams instanceof Error) cb(parsedParams);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else {
          _validateQueueExtendedParams(
            client,
            parsedParams,
            this.requireGroupId,
            (err) => {
              if (err) cb(err);
              else
                this.getMessagesIds(
                  parsedParams,
                  page,
                  pageSize,
                  (err, reply) => {
                    if (err) cb(err);
                    else if (!reply) cb(new CallbackEmptyReplyError());
                    else {
                      if (reply.items.length) {
                        this.message.getMessagesByIds(
                          reply.items,
                          (err, items) => {
                            if (err) cb(err);
                            else {
                              cb(null, { ...reply, items: items ?? [] });
                            }
                          },
                        );
                      } else cb(null, { ...reply, items: [] });
                    }
                  },
                );
            },
          );
        }
      });
    }
  }

  shutdown(cb: ICallback<void>) {
    async.waterfall([this.message.shutdown, this.redisClient.shutdown], cb);
  }
}
