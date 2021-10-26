import { Message } from '../../../message';
import { ICallback } from '../../../../types';
import { redisKeys } from '../../redis-keys';
import { RedisClient } from '../../redis-client/redis-client';

export class EnqueueMessageHandler {
  enqueue(
    redisClient: RedisClient,
    queueName: string,
    message: Message,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    const { keyQueue, keyQueuePriority } = redisKeys.getKeys(queueName);
    const priority = withPriority ? message.getSetPriority(undefined) : null;
    if (typeof priority === 'number') {
      redisClient.zadd(
        keyQueuePriority,
        priority,
        JSON.stringify(message),
        (err) => cb(err),
      );
    } else {
      redisClient.lpush(keyQueue, JSON.stringify(message), (err) => cb(err));
    }
  }
}
