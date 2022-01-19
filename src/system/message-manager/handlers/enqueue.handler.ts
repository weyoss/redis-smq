import { Message } from '../../message';
import {
  ICallback,
  TGetMessagesReply,
  TGetPendingMessagesWithPriorityReply,
  TQueueParams,
  TRedisClientMulti,
} from '../../../../types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { RedisClient } from '../../common/redis-client/redis-client';
import {
  deleteListMessageAtSequenceId,
  getPaginatedListMessages,
  getPaginatedSortedSetMessages,
} from '../common';
import { Handler } from './handler';
import { LockManager } from '../../common/lock-manager/lock-manager';
import { PanicError } from '../../common/errors/panic.error';
import { MessageNotFoundError } from '../errors/message-not-found.error';
import { ELuaScriptName } from '../../common/redis-client/lua-scripts';

export class EnqueueHandler extends Handler {
  getAcknowledgedMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueueAcknowledged } = redisKeys.getKeys(queue.name, queue.ns);
    getPaginatedListMessages(
      this.redisClient,
      keyQueueAcknowledged,
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
    const { keyQueuePending } = redisKeys.getKeys(queue.name, queue.ns);
    getPaginatedListMessages(this.redisClient, keyQueuePending, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    const { keyQueuePriority, keyQueuePendingWithPriority } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    getPaginatedSortedSetMessages(
      this.redisClient,
      keyQueuePendingWithPriority,
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
    const { keyQueuePending, keyLockDeletePendingMessage } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    deleteListMessageAtSequenceId(
      this.redisClient,
      keyLockDeletePendingMessage,
      keyQueuePending,
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
      keyQueuePendingWithPriority,
      keyLockDeletePendingMessageWithPriority,
    } = redisKeys.getKeys(queue.name, queue.ns);
    LockManager.lockFN(
      this.redisClient,
      keyLockDeletePendingMessageWithPriority,
      (cb) => {
        // Not verifying if the message exists.
        // In case the message does not exist we assume it was delivered or already deleted
        const multi = this.redisClient.multi();
        multi.hdel(keyQueuePendingWithPriority, messageId);
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
    const { keyQueuePriority, keyQueuePendingWithPriority } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    multi.hset(keyQueuePendingWithPriority, messageId, JSON.stringify(message));
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
    const { keyQueuePriority, keyQueuePendingWithPriority } = redisKeys.getKeys(
      queue.name,
      queue.ns,
    );
    redisClient.zpushhset(
      keyQueuePriority,
      keyQueuePendingWithPriority,
      priority,
      messageId,
      JSON.stringify(message),
      cb,
    );
  }

  enqueue(
    redisClient: RedisClient,
    message: Message,
    cb: ICallback<void>,
  ): void {
    const queue = message.getQueue();
    if (!queue)
      throw new PanicError(`Can not enqueue a message without a queue name`);
    message.setPublishedAt(Date.now());
    const {
      keyQueues,
      keyQueuePendingWithPriority,
      keyQueuePriority,
      keyQueuePending,
    } = redisKeys.getKeys(queue.name, queue.ns);
    this.redisClient.runScript(
      ELuaScriptName.PUBLISH_MESSAGE,
      [
        keyQueues,
        JSON.stringify(queue),
        message.getId(),
        JSON.stringify(message),
        message.getPriority() ?? '',
        keyQueuePendingWithPriority,
        keyQueuePriority,
        keyQueuePending,
      ],
      (err) => cb(err),
    );
  }
}
