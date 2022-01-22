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
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(
      queue.name,
      queue.ns,
    );
    getPaginatedListMessages(
      this.redisClient,
      keyQueueAcknowledged,
      skip,
      take,
      cb,
    );
  }

  purgeAcknowledgedMessages(queue: TQueueParams, cb: ICallback<void>): void {
    const { keyQueueAcknowledged } = redisKeys.getQueueKeys(
      queue.name,
      queue.ns,
    );
    this.redisClient.del(keyQueueAcknowledged, (err) => cb(err));
  }

  getDeadLetteredMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueueDL } = redisKeys.getQueueKeys(queue.name, queue.ns);
    getPaginatedListMessages(this.redisClient, keyQueueDL, skip, take, cb);
  }

  purgeDeadLetteredMessages(queue: TQueueParams, cb: ICallback<void>): void {
    const { keyQueueDL } = redisKeys.getQueueKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueueDL, (err) => cb(err));
  }

  getPendingMessages(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetMessagesReply>,
  ): void {
    const { keyQueuePending } = redisKeys.getQueueKeys(queue.name, queue.ns);
    getPaginatedListMessages(this.redisClient, keyQueuePending, skip, take, cb);
  }

  purgePendingMessages(queue: TQueueParams, cb: ICallback<void>): void {
    const { keyQueuePending } = redisKeys.getQueueKeys(queue.name, queue.ns);
    this.redisClient.del(keyQueuePending, (err) => cb(err));
  }

  getPendingMessagesWithPriority(
    queue: TQueueParams,
    skip: number,
    take: number,
    cb: ICallback<TGetPendingMessagesWithPriorityReply>,
  ): void {
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queue.name, queue.ns);
    getPaginatedSortedSetMessages(
      this.redisClient,
      keyQueuePendingPriorityMessages,
      keyQueuePendingPriorityMessageIds,
      skip,
      take,
      cb,
    );
  }

  purgePendingMessagesWithPriority(
    queue: TQueueParams,
    cb: ICallback<void>,
  ): void {
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queue.name, queue.ns);
    const multi = this.redisClient.multi();
    multi.del(keyQueuePendingPriorityMessages);
    multi.del(keyQueuePendingPriorityMessageIds);
    this.redisClient.execMulti(multi, (err) => cb(err));
  }

  deletePendingMessage(
    queue: TQueueParams,
    sequenceId: number,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    const { keyQueuePending, keyLockDeletePendingMessage } =
      redisKeys.getQueueKeys(queue.name, queue.ns);
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
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
      keyLockDeletePendingMessageWithPriority,
    } = redisKeys.getQueueKeys(queue.name, queue.ns);
    LockManager.lockFN(
      this.redisClient,
      keyLockDeletePendingMessageWithPriority,
      (cb) => {
        // Not verifying if the message exists.
        // In case the message does not exist we assume it was delivered or already deleted
        const multi = this.redisClient.multi();
        multi.hdel(keyQueuePendingPriorityMessages, messageId);
        multi.zrem(keyQueuePendingPriorityMessageIds, messageId);
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
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queue.name, queue.ns);
    multi.hset(
      keyQueuePendingPriorityMessages,
      messageId,
      JSON.stringify(message),
    );
    multi.zadd(keyQueuePendingPriorityMessageIds, priority, messageId);
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
    const {
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
    } = redisKeys.getQueueKeys(queue.name, queue.ns);
    redisClient.zpushhset(
      keyQueuePendingPriorityMessageIds,
      keyQueuePendingPriorityMessages,
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
      keyQueuePendingPriorityMessages,
      keyQueuePendingPriorityMessageIds,
      keyQueuePending,
    } = redisKeys.getQueueKeys(queue.name, queue.ns);
    this.redisClient.runScript(
      ELuaScriptName.PUBLISH_MESSAGE,
      [
        keyQueues,
        JSON.stringify(queue),
        message.getId(),
        JSON.stringify(message),
        message.getPriority() ?? '',
        keyQueuePendingPriorityMessages,
        keyQueuePendingPriorityMessageIds,
        keyQueuePending,
      ],
      (err) => cb(err),
    );
  }
}
