import {
  EMessageUnacknowledgedCause,
  IRequiredConfig,
  TQueueParams,
} from '../../../../types';
import { Message } from '../../message/message';
import { async, RedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { ICallback, IRedisClientMulti } from 'redis-smq-common/dist/types';
import { retryMessage, TRetryStatus } from './retry-message';

export type TCleanUpStatus = TRetryStatus | false;

function fetchProcessingQueueMessage(
  redisClient: RedisClient,
  keyQueueProcessing: string,
  cb: ICallback<Message>,
): void {
  redisClient.lrange(
    keyQueueProcessing,
    0,
    0,
    (err?: Error | null, range?: string[] | null) => {
      if (err) cb(err);
      else if (range && range.length) {
        const msg = Message.createFromMessage(range[0]);
        cb(null, msg);
      } else cb();
    },
  );
}

function deleteProcessingQueue(
  multi: IRedisClientMulti,
  queue: TQueueParams,
  processingQueue: string,
): void {
  const { keyProcessingQueues, keyQueueProcessingQueues } =
    redisKeys.getQueueKeys(queue);
  multi.srem(keyProcessingQueues, processingQueue);
  multi.hdel(keyQueueProcessingQueues, processingQueue);
  multi.del(processingQueue);
}

export const processingQueue = {
  cleanUpProcessingQueue(
    config: IRequiredConfig,
    redisClient: RedisClient,
    consumerId: string,
    queue: TQueueParams,
    multi: IRedisClientMulti,
    cb: ICallback<TCleanUpStatus>,
  ): void {
    const { keyQueueProcessing } = redisKeys.getQueueConsumerKeys(
      queue,
      consumerId,
    );
    let status: TCleanUpStatus = false;
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          fetchProcessingQueueMessage(
            redisClient,
            keyQueueProcessing,
            (err, msg) => {
              if (err) cb(err);
              else if (msg) {
                status = retryMessage(
                  config,
                  multi,
                  keyQueueProcessing,
                  msg,
                  EMessageUnacknowledgedCause.OFFLINE_CONSUMER,
                );
                cb();
              } else cb();
            },
          );
        },
        (cb: ICallback<void>) => {
          deleteProcessingQueue(multi, queue, keyQueueProcessing);
          cb();
        },
      ],
      (err) => {
        if (err) cb(err);
        else cb(null, status);
      },
    );
  },

  setUpProcessingQueue(
    multi: IRedisClientMulti,
    queue: TQueueParams,
    consumerId: string,
  ): void {
    const {
      keyQueueProcessing,
      keyProcessingQueues,
      keyQueueProcessingQueues,
    } = redisKeys.getQueueConsumerKeys(queue, consumerId);
    multi.hset(keyQueueProcessingQueues, keyQueueProcessing, consumerId);
    multi.sadd(keyProcessingQueues, keyQueueProcessing);
  },

  getQueueProcessingQueues(
    redisClient: RedisClient,
    queue: TQueueParams,
    cb: ICallback<Record<string, string>>,
  ): void {
    const { keyQueueProcessingQueues } = redisKeys.getQueueKeys(queue);
    redisClient.hgetall(keyQueueProcessingQueues, cb);
  },
};
