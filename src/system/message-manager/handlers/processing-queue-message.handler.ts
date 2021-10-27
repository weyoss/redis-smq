import { RedisClient } from '../../redis-client/redis-client';
import { Message } from '../../../message';
import {
  EMessageDeadLetterCause,
  EMessageUnacknowledgedCause,
  ICallback,
} from '../../../../types';
import { redisKeys } from '../../redis-keys';
import { deleteListMessageAtIndex } from '../common';

export class ProcessingQueueMessageHandler {
  deleteDeadLetterMessage(
    redisClient: RedisClient,
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    deleteListMessageAtIndex(redisClient, keyQueueDL, index, messageId, cb);
  }

  deleteAcknowledgedMessage(
    redisClient: RedisClient,
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    deleteListMessageAtIndex(
      redisClient,
      keyQueueAcknowledgedMessages,
      index,
      messageId,
      cb,
    );
  }

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
