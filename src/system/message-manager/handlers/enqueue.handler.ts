import { Message } from '../../message';
import { ICallback, TGetMessagesReply } from '../../../../types';
import { redisKeys } from '../../common/redis-keys';
import { RedisClient } from '../../redis-client/redis-client';
import {
  deleteListMessageAtSequenceId,
  deleteSortedSetMessageAtSequenceId,
  getPaginatedListMessages,
  getPaginatedSortedSetMessages,
} from '../common';
import { Handler } from './handler';

export class EnqueueHandler extends Handler {
  getAcknowledgedMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    getPaginatedListMessages(
      this.redisClient,
      keyQueueAcknowledgedMessages,
      skip,
      take,
      cb,
    );
  }

  getDeadLetteredMessages(
    redisClient: RedisClient,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    getPaginatedListMessages(redisClient, keyQueueDL, skip, take, cb);
  }

  getPendingMessages(
    redisClient: RedisClient,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueue } = redisKeys.getKeys(queueName);
    getPaginatedListMessages(redisClient, keyQueue, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    redisClient: RedisClient,
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueuePriority } = redisKeys.getKeys(queueName);
    getPaginatedSortedSetMessages(
      redisClient,
      keyQueuePriority,
      skip,
      take,
      cb,
    );
  }

  deletePendingMessage(
    redisClient: RedisClient,
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueue, keyLockDeletePendingMessage } =
      redisKeys.getKeys(queueName);
    deleteListMessageAtSequenceId(
      redisClient,
      keyLockDeletePendingMessage,
      keyQueue,
      index,
      messageId,
      cb,
    );
  }

  deletePendingMessageWithPriority(
    redisClient: RedisClient,
    queueName: string,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueuePriority, keyLockDeletePendingMessageWithPriority } =
      redisKeys.getKeys(queueName);
    deleteSortedSetMessageAtSequenceId(
      redisClient,
      keyLockDeletePendingMessageWithPriority,
      keyQueuePriority,
      index,
      messageId,
      cb,
    );
  }

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
