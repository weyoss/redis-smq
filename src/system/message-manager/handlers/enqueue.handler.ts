import { Message } from '../../message';
import {
  ICallback,
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TRedisClientMulti,
} from '../../../../types';
import { redisKeys } from '../../common/redis-keys';
import { RedisClient } from '../../redis-client/redis-client';
import {
  deleteListMessageAtSequenceId,
  getPaginatedListMessages,
  getPaginatedSortedSetMessages,
} from '../common';
import { Handler } from './handler';
import { LockManager } from '../../common/lock-manager';

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
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    const { keyQueuePriority, keyPendingMessagesWithPriority } =
      redisKeys.getKeys(queueName, ns);
    getPaginatedSortedSetMessages(
      this.redisClient,
      keyPendingMessagesWithPriority,
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
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const {
      keyQueuePriority,
      keyPendingMessagesWithPriority,
      keyLockDeletePendingMessageWithPriority,
    } = redisKeys.getKeys(queueName, ns);
    LockManager.lockFN(
      this.redisClient,
      keyLockDeletePendingMessageWithPriority,
      (cb) => {
        // Not checking message existence.
        // If the message exists it will be deleted.
        // Otherwise, assuming that it has been already deleted
        const multi = this.redisClient.multi();
        multi.hdel(keyPendingMessagesWithPriority, messageId);
        multi.zrem(keyQueuePriority, messageId);
        this.redisClient.execMulti(multi, (err) => cb(err));
      },
      cb,
    );
  }

  protected enqueueMessageWithPriorityMulti(
    multi: TRedisClientMulti,
    namespace: string,
    queueName: string,
    message: Message,
  ): void {
    const messageId = message.getId();
    const priority = message.getSetPriority(undefined);
    const { keyQueuePriority, keyPendingMessagesWithPriority } =
      redisKeys.getKeys(queueName, namespace);
    multi.hset(
      keyPendingMessagesWithPriority,
      messageId,
      JSON.stringify(message),
    );
    multi.zadd(keyQueuePriority, priority, messageId);
  }

  protected enqueueMessageWithPriority(
    redisClient: RedisClient,
    namespace: string,
    queueName: string,
    message: Message,
    cb: ICallback<void>,
  ): void {
    const messageId = message.getId();
    const priority = message.getSetPriority(undefined);
    const { keyQueuePriority, keyPendingMessagesWithPriority } =
      redisKeys.getKeys(queueName, namespace);
    redisClient.zpushhset(
      keyQueuePriority,
      keyPendingMessagesWithPriority,
      priority,
      messageId,
      JSON.stringify(message),
      cb,
    );
  }

  enqueue(
    redisClientOrMulti: RedisClient | TRedisClientMulti,
    message: Message,
    withPriority: boolean,
    cb?: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue)
      throw new Error(`Can not enqueue a message without a queue name`);
    const { name, ns } = queue;
    const { keyQueue } = redisKeys.getKeys(name, ns);
    message.setPublishedAt(Date.now());
    if (redisClientOrMulti instanceof RedisClient) {
      if (!cb) throw new Error('Callback function is required.');
      if (withPriority) {
        this.enqueueMessageWithPriority(
          redisClientOrMulti,
          ns,
          name,
          message,
          cb,
        );
      } else {
        redisClientOrMulti.rpush(keyQueue, JSON.stringify(message), (err) =>
          cb(err),
        );
      }
    } else {
      if (withPriority)
        this.enqueueMessageWithPriorityMulti(
          redisClientOrMulti,
          ns,
          name,
          message,
        );
      else redisClientOrMulti.rpush(keyQueue, JSON.stringify(message));
    }
  }
}
