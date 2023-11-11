import { async, errors, ICallback } from 'redis-smq-common';
import { QueueMessagesPaginatorAbstract } from './queue-messages-paginator-abstract';
import {
  EQueueProperty,
  IQueueMessagesPage,
  IQueueParams,
} from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { _getCommonRedisClient } from '../../../common/_get-common-redis-client';
import { _getQueueParams } from '../queue/_get-queue-params';
import { _getQueueProperties } from '../queue/_get-queue-properties';

export abstract class QueueMessagesPaginatorSet extends QueueMessagesPaginatorAbstract {
  override countMessages(
    queue: string | IQueueParams,
    cb: ICallback<number>,
  ): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else {
        const queueParams = _getQueueParams(queue);
        _getQueueProperties(client, queueParams, (err, properties) => {
          if (err) cb(err);
          else if (!properties) cb(new errors.EmptyCallbackReplyError());
          else cb(null, properties[EQueueProperty.MESSAGES_COUNT]);
        });
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
              if (!totalItems) {
                cb(null, {
                  cursor: 0,
                  totalItems,
                  items: [],
                });
              } else {
                const queueParams = _getQueueParams(queue);
                const { keyQueueMessages } =
                  redisKeys.getQueueKeys(queueParams);
                client.sscan(
                  keyQueueMessages,
                  String(cursor),
                  { COUNT: pageSize },
                  (err, reply) => {
                    if (err) cb(err);
                    else if (!reply) cb(new errors.EmptyCallbackReplyError());
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