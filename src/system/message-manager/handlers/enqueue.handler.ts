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
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName, ns);
    getPaginatedListMessages(
      this.redisClient,
      keyQueueAcknowledgedMessages,
      skip,
      take,
      cb,
    );
  }

  getDeadLetteredMessages(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName, ns);
    getPaginatedListMessages(this.redisClient, keyQueueDL, skip, take, cb);
  }

  getPendingMessages(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueue } = redisKeys.getKeys(queueName, ns);
    getPaginatedListMessages(this.redisClient, keyQueue, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queueName: string,
    ns: string | undefined,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueuePriority } = redisKeys.getKeys(queueName, ns);
    getPaginatedSortedSetMessages(
      this.redisClient,
      keyQueuePriority,
      skip,
      take,
      cb,
    );
  }

  deletePendingMessage(
    queueName: string,
    ns: string | undefined,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueue, keyLockDeletePendingMessage } = redisKeys.getKeys(
      queueName,
      ns,
    );
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeletePendingMessage,
      keyQueue,
      index,
      messageId,
      cb,
    );
  }

  deletePendingMessageWithPriority(
    queueName: string,
    ns: string | undefined,
    index: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueuePriority, keyLockDeletePendingMessageWithPriority } =
      redisKeys.getKeys(queueName, ns);
    deleteSortedSetMessageAtSequenceId(
      this.redisClient,
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
