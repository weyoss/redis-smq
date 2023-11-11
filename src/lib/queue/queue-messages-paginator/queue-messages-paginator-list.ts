import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { async, errors, ICallback } from 'redis-smq-common';
import { QueueMessagesPaginatorAbstract } from './queue-messages-paginator-abstract';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { ELuaScriptName } from '../../../common/redis-client/redis-client';
import {
  EMessageProperty,
  EMessagePropertyStatus,
  EQueueProperty,
  EQueueType,
  IQueueMessagesPage,
  IQueueParams,
} from '../../../../types';
import { MessageRequeueError } from '../errors/message-requeue.error';
import { _getMessage } from '../queue-messages/_get-message';

export abstract class QueueMessagesPaginatorList extends QueueMessagesPaginatorAbstract {
  countMessages(queue: string | IQueueParams, cb: ICallback<number>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const key = this.getRedisKey(queue);
        client.llen(key, cb);
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
            else if (!client) cb(new errors.EmptyCallbackReplyError());
            else {
              const { currentPage, offsetStart, offsetEnd, totalPages } =
                this.getPaginationParams(cursor, totalItems, pageSize);
              const next = currentPage < totalPages ? currentPage + 1 : 0;
              if (!totalItems)
                cb(null, {
                  cursor: next,
                  totalItems,
                  items: [],
                });
              else {
                const key = this.getRedisKey(queue);
                client.lrange(key, offsetStart, offsetEnd, (err, items) => {
                  if (err) cb(err);
                  else {
                    cb(null, {
                      cursor: next,
                      totalItems,
                      items: items ?? [],
                    });
                  }
                });
              }
            }
          });
        },
      ],
      cb,
    );
  }

  requeueMessage(
    source: string | IQueueParams,
    id: string,
    cb: ICallback<void>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        _getMessage(client, id, (err, message) => {
          if (err) cb(err);
          else if (!message) cb(new errors.EmptyCallbackReplyError());
          else {
            const queue = message.getDestinationQueue();
            message.getRequiredMessageState().reset(); // resetting all system parameters
            const {
              keyQueueProperties,
              keyQueuePending,
              keyPriorityQueuePending,
            } = redisKeys.getQueueKeys(queue);
            const messageId = message.getRequiredId();
            const { keyMessage } = redisKeys.getMessageKeys(messageId);
            const sourceKey = this.getRedisKey(source);
            client.runScript(
              ELuaScriptName.REQUEUE_MESSAGE,
              [
                sourceKey,
                keyQueueProperties,
                keyPriorityQueuePending,
                keyQueuePending,
                keyMessage,
              ],
              [
                EQueueProperty.QUEUE_TYPE,
                EQueueType.PRIORITY_QUEUE,
                EQueueType.LIFO_QUEUE,
                EQueueType.FIFO_QUEUE,
                EMessageProperty.STATUS,
                EMessagePropertyStatus.PENDING,
                EMessageProperty.STATE,
                messageId,
                message.getPriority() ?? '',
                JSON.stringify(message.getRequiredMessageState()),
              ],
              (err, reply) => {
                if (err) cb(err);
                else if (!reply) cb(new MessageRequeueError());
                else cb();
              },
            );
          }
        });
      }
    });
  }
}
