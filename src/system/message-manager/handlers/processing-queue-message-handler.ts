import { RedisClient } from '../../redis-client/redis-client';
import { Message } from '../../../message';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
} from '../../../../types';
import { redisKeys } from '../../redis-keys';

export class ProcessingQueueMessageHandler {
  deadLetterMessage(
    redisClient: RedisClient,
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    deadLetterCause: EMessageDeadLetterCause,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    redisClient.rpoplpush(keyQueueProcessing, keyQueueDL, (err) => {
      if (err) cb(err);
      else cb();
    });
  }

  acknowledge(
    redisClient: RedisClient,
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    redisClient.rpoplpush(
      keyQueueProcessing,
      keyQueueAcknowledgedMessages,
      (err) => {
        if (err) cb(err);
        else cb();
      },
    );
  }

  delayBeforeRequeue(
    redisClient: RedisClient,
    message: Message,
    queueName: string,
    delayTimestamp: number,
    keyQueueProcessing: string,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDelay } = redisKeys.getKeys(queueName);
    redisClient.rpoplpush(keyQueueProcessing, keyQueueDelay, (err) => cb(err));
  }

  requeue(
    redisClient: RedisClient,
    message: Message,
    queueName: string,
    keyQueueProcessing: string,
    withPriority: boolean,
    unacknowledgedCause: EMessageUnacknowledgedCause,
    cb: ICallback<void>,
  ): void {
    const { keyQueueRequeue } = redisKeys.getKeys(queueName);
    redisClient.rpoplpush(keyQueueProcessing, keyQueueRequeue, (err) =>
      cb(err),
    );
  }
}
