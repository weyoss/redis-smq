import { Message } from '../../../message';
import { EQueueMetadata, ICallback } from '../../../../types';
import { redisKeys } from '../../redis-keys';
import { RedisClient } from '../../redis-client';
import { metadata } from '../../metadata';

export class EnqueueMessageHandler {
  enqueue(
    redisClient: RedisClient,
    queueName: string,
    message: Message,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    const { keyQueue, keyQueuePriority } = redisKeys.getKeys(queueName);
    const { keyMetadataMessage } = redisKeys.getMessageKeys(message.getId());
    const { keyMetadataQueue } = redisKeys.getKeys(queueName);
    const messageMetadata = metadata.getEnqueuedMessageMetadata(
      message,
      withPriority,
    );
    const priority = withPriority ? messageMetadata.state.getPriority() : null;
    const multi = redisClient.multi();
    if (typeof priority === 'number')
      multi.zadd(keyQueuePriority, priority, JSON.stringify(message));
    else multi.lpush(keyQueue, JSON.stringify(message));
    multi.rpush(keyMetadataMessage, JSON.stringify(messageMetadata));
    multi.hincrby(
      keyMetadataQueue,
      withPriority
        ? EQueueMetadata.PENDING_MESSAGES_WITH_PRIORITY
        : EQueueMetadata.PENDING_MESSAGES,
      1,
    );
    redisClient.execMulti(multi, (err) => cb(err));
  }
}
