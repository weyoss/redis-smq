import { IRequiredConfig, TQueueParams } from '../../../types';
import { ICallback, TRedisClientMulti } from 'redis-smq-common/dist/types';
import { async, RedisClient } from 'redis-smq-common';
import { consumerQueues } from './consumer-queues';
import { MessageHandler } from './consumer-message-handler/message-handler';

export function handleOfflineConsumer(
  config: IRequiredConfig,
  multi: TRedisClientMulti, // pending transaction
  redisClient: RedisClient, // for readonly operations
  consumerId: string,
  cb: ICallback<void>,
): void {
  async.waterfall(
    [
      (cb: ICallback<TQueueParams[]>) =>
        consumerQueues.getConsumerQueues(redisClient, consumerId, cb),
      (queues: TQueueParams[], cb: ICallback<void>) => {
        async.each(
          queues,
          (queue, _, done) => {
            MessageHandler.cleanUp(
              config,
              redisClient,
              consumerId,
              queue,
              multi,
              done,
            );
          },
          cb,
        );
      },
    ],
    cb,
  );
}
