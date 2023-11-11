import {
  IQueueMessages,
  IQeueMessagesPageParams,
  IQueueMessagesPage,
  IQueueParams,
} from '../../../../types';
import { async, errors, ICallback } from 'redis-smq-common';
import { Message } from '../../message/message';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { _deleteMessage } from '../queue-messages/_delete-message';
import { _getMessages } from '../queue-messages/_get-message';

export abstract class QueueMessagesPaginatorAbstract implements IQueueMessages {
  protected getTotalPages(pageSize: number, totalItems: number): number {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages === 0) return 1;
    return totalPages;
  }

  protected getPaginationParams(
    cursor: number,
    totalItems: number,
    pageSize: number,
  ): IQeueMessagesPageParams {
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

  abstract countMessages(
    queue: string | IQueueParams,
    cb: ICallback<number>,
  ): void;

  protected abstract getMessagesIds(
    queue: string | IQueueParams,
    cursor: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<string>>,
  ): void;

  protected abstract getRedisKey(queue: string | IQueueParams): string;

  purge(queue: string | IQueueParams, cb: ICallback<void>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const deleteMessages = (cursor = '0') => {
          async.waterfall<string>(
            [
              (cb: ICallback<IQueueMessagesPage<string>>) => {
                this.getMessagesIds(queue, Number(cursor), 1000, cb);
              },
              (reply: IQueueMessagesPage<string>, cb: ICallback<string>) => {
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
  }

  getMessages(
    queue: string | IQueueParams,
    cursor: number,
    pageSize: number,
    cb: ICallback<IQueueMessagesPage<Message>>,
  ): void {
    this.getMessagesIds(queue, cursor, pageSize, (err, reply) => {
      if (err) cb(err);
      else if (!reply) cb(new errors.EmptyCallbackReplyError());
      else {
        if (reply.items.length) {
          _getCommonRedisClient((err, client) => {
            if (err) cb(err);
            else if (!client) cb(new errors.EmptyCallbackReplyError());
            else {
              _getMessages(client, reply.items, (err, messages) => {
                if (err) cb(err);
                else cb(null, { ...reply, items: messages ?? [] });
              });
            }
          });
        } else cb(null, { ...reply, items: [] });
      }
    });
  }

  deleteMessage(
    queue: string | IQueueParams,
    messageId: string | string[],
    cb: ICallback<void>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else _deleteMessage(client, messageId, cb);
    });
  }
}
