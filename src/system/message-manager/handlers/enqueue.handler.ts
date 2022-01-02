import { Message } from '../../message';
import {
  ICallback,
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TQueueParams,
  TRedisClientMulti,
} from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { RedisClient } from '../../redis-client/redis-client';
import {
  deleteListMessageAtSequenceId,
  getPaginatedListMessages,
  getPaginatedSortedSetMessages,
} from '../common';
import { Handler } from './handler';
import { LockManager } from '../../common/lock-manager/lock-manager';
import { PanicError } from '../../common/errors/panic.error';
import { MessageNotFoundError } from '../errors/message-not-found.error';

export class EnqueueHandler extends Handler {
  getAcknowledgedMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    getPaginatedListMessages(
      this.redisClient,
      keyQueueAcknowledgedMessages,
      skip,
      take,
      cb,
    );
  }

  getDeadLetteredMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queue.name, queue.ns);
    getPaginatedListMessages(this.redisClient, keyQueueDL, skip, take, cb);
  }

  getPendingMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueue } = redisKeys.getKeys(queue.name, queue.ns);
    getPaginatedListMessages(this.redisClient, keyQueue, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    const { keyQueuePriority, keyPendingMessagesWithPriority } =
      redisKeys.getKeys(queue.name, queue.ns);
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
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueue, keyLockDeletePendingMessage } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeletePendingMessage,
      keyQueue,
      sequenceId,
      messageId,
      queue,
      (err) => {
        // In case the message does not exist
        // we assume it was delivered or already deleted
        const error = err instanceof MessageNotFoundError ? null : err;
        if (error) cb(error);
        else cb();
      },
    );
  }

  deletePendingMessageWithPriority(
    queue: TQueueParams,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const {
      keyQueuePriority,
      keyPendingMessagesWithPriority,
      keyLockDeletePendingMessageWithPriority,
    } = redisKeys.getKeys(queue.name, queue.ns);
    LockManager.lockFN(
      this.redisClient,
      keyLockDeletePendingMessageWithPriority,
      (cb) => {
        // Not verifying if the message exists.
        // In case the message does not exist we assume it was delivered or already deleted
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
    queue: TQueueParams,
    message: Message,
  ): void {
    const messageId = message.getId();
    const priority = message.getPriority();
    if (priority === null)
      throw new PanicError(`Expected a non-empty priority value`);
    const { keyQueuePriority, keyPendingMessagesWithPriority } =
      redisKeys.getKeys(queue.name, queue.ns);
    multi.hset(
      keyPendingMessagesWithPriority,
      messageId,
      JSON.stringify(message),
    );
    multi.zadd(keyQueuePriority, priority, messageId);
  }

  protected enqueueMessageWithPriority(
    redisClient: RedisClient,
    queue: TQueueParams,
    message: Message,
    cb: ICallback<void>,
  ): void {
    const messageId = message.getId();
    const priority = message.getPriority();
    if (priority === null)
      throw new PanicError(`Expected a non-empty priority value`);
    const { keyQueuePriority, keyPendingMessagesWithPriority } =
      redisKeys.getKeys(queue.name, queue.ns);
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
    cb?: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue)
      throw new PanicError(`Can not enqueue a message without a queue name`);
    const { keyQueue } = redisKeys.getKeys(queue.name, queue.ns);
    message.setPublishedAt(Date.now());
    if (redisClientOrMulti instanceof RedisClient) {
      if (!cb) throw new PanicError('A callback function is required.');
      if (message.isPriorityQueuingEnabled()) {
        this.enqueueMessageWithPriority(redisClientOrMulti, queue, message, cb);
      } else {
        redisClientOrMulti.rpush(keyQueue, JSON.stringify(message), (err) =>
          cb(err),
        );
      }
    } else {
      if (message.isPriorityQueuingEnabled())
        this.enqueueMessageWithPriorityMulti(
          redisClientOrMulti,
          queue,
          message,
        );
      else redisClientOrMulti.rpush(keyQueue, JSON.stringify(message));
    }
  }
}
