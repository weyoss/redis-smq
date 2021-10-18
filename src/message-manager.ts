import {
  EMessageMetadataType,
  ICallback,
  IConfig,
  TGetAcknowledgedMessagesReply,
  IMessageMetadata,
  TRedisClientMulti,
} from '../types';
import { RedisClient } from './system/redis-client';
import { Scheduler } from './system/scheduler';
import { Message } from './message';
import { redisKeys } from './system/redis-keys';
import { metadata } from './system/metadata';

export class MessageManager {
  protected static instance: MessageManager | null = null;
  protected redisClient: RedisClient;

  protected constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  ///

  protected requeueMessage(
    queueName: string,
    message: Message,
    withPriority: boolean,
    multi: TRedisClientMulti,
  ): void {
    // a brand new state
    const msg = Message.createFromMessage(message, true);
    withPriority
      ? this.enqueueMessageWithPriority(queueName, msg, multi)
      : this.enqueueMessage(queueName, msg, multi);
  }

  enqueueMessageFromAcknowledgedQueue(
    queueName: string,
    messageId: string,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    this.getMessageMetadata(messageId, (err, messageMetata) => {
      if (err) cb(err);
      else if (!messageMetata || !messageMetata.length)
        cb(new Error('Message does not exist'));
      else {
        const last = messageMetata.pop();
        if (last?.type === EMessageMetadataType.ACKNOWLEDGED) {
          const multi = this.redisClient.multi();
          const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
          metadata.preMessageAcknowledgedDelete(last.state, queueName, multi);
          multi.zrem(keyQueueAcknowledgedMessages, last.state.toString());
          this.requeueMessage(queueName, last?.state, withPriority, multi);
          this.redisClient.execMulti(multi, (err) => cb(err));
        } else cb(new Error('Message is not currently in acknowledged queue'));
      }
    });
  }

  enqueueMessageFromDLQueue(
    queueName: string,
    messageId: string,
    withPriority: boolean,
    cb: ICallback<void>,
  ): void {
    this.getMessageMetadata(messageId, (err, messageMetata) => {
      if (err) cb(err);
      else if (!messageMetata || !messageMetata.length)
        cb(new Error('Message does not exist'));
      else {
        const last = messageMetata.pop();
        if (last?.type === EMessageMetadataType.DEAD_LETTER) {
          const multi = this.redisClient.multi();
          const { keyQueueDL } = redisKeys.getKeys(queueName);
          metadata.preMessageDeadLetterDelete(last.state, queueName, multi);
          multi.zrem(keyQueueDL, last.state.toString());
          this.requeueMessage(queueName, last?.state, withPriority, multi);
          this.redisClient.execMulti(multi, (err) => cb(err));
        } else cb(new Error('Message is not currently in dead-letter queue'));
      }
    });
  }

  deleteDeadLetterMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.getMessageMetadata(messageId, (err, messageMetata) => {
      if (err) cb(err);
      else if (!messageMetata || !messageMetata.length)
        cb(new Error('Message does not exist'));
      else {
        const last = messageMetata.pop();
        if (last?.type === EMessageMetadataType.DEAD_LETTER) {
          const multi = this.redisClient.multi();
          const { keyQueueDL } = redisKeys.getKeys(queueName);
          metadata.preMessageDeadLetterDelete(last.state, queueName, multi);
          multi.zrem(keyQueueDL, last.state.toString());
          this.redisClient.execMulti(multi, (err) => cb(err));
        } else cb(new Error('Message is not currently in dead-letter queue'));
      }
    });
  }

  deleteAcknowledgedMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.getMessageMetadata(messageId, (err, messageMetata) => {
      if (err) cb(err);
      else if (!messageMetata || !messageMetata.length)
        cb(new Error('Message does not exist'));
      else {
        const last = messageMetata.pop();
        if (last?.type === EMessageMetadataType.ACKNOWLEDGED) {
          const multi = this.redisClient.multi();
          const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
          metadata.preMessageAcknowledgedDelete(last.state, queueName, multi);
          multi.zrem(keyQueueAcknowledgedMessages, last.state.toString());
          this.redisClient.execMulti(multi, (err) => cb(err));
        } else cb(new Error('Message is not currently in acknowledged queue'));
      }
    });
  }

  deletePendingMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.getMessageMetadata(messageId, (err, messageMetata) => {
      if (err) cb(err);
      else if (!messageMetata || !messageMetata.length)
        cb(new Error('Message does not exist'));
      else {
        const last = messageMetata.pop();
        if (last?.type === EMessageMetadataType.ENQUEUED) {
          const multi = this.redisClient.multi();
          const { keyQueue } = redisKeys.getKeys(queueName);
          metadata.preMessagePendingDelete(last.state, queueName, false, multi);
          multi.lrem(keyQueue, 1, last.state.toString());
          this.redisClient.execMulti(multi, (err) => cb(err));
        } else if (last?.type === EMessageMetadataType.ENQUEUED_WITH_PRIORITY) {
          const multi = this.redisClient.multi();
          const { keyQueuePriority } = redisKeys.getKeys(queueName);
          metadata.preMessagePendingDelete(last.state, queueName, true, multi);
          multi.zrem(keyQueuePriority, last.state.toString());
          this.redisClient.execMulti(multi, (err) => cb(err));
        } else cb(new Error('Message is not currently in pending queue'));
      }
    });
  }

  deleteScheduledMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    Scheduler.deleteScheduledMessage(
      this.redisClient,
      queueName,
      messageId,
      cb,
    );
  }

  enqueueMessage(
    queueName: string,
    message: Message,
    multi: TRedisClientMulti,
  ): void {
    const { keyQueue } = redisKeys.getKeys(queueName);
    metadata.preMessageEnqueued(message, queueName, multi);
    multi.lpush(keyQueue, message.toString());
  }

  enqueueMessageWithPriority(
    queueName: string,
    message: Message,
    multi: TRedisClientMulti,
  ): void {
    const priority = message.getPriority() ?? Message.MessagePriority.NORMAL;
    if (message.getPriority() !== priority) message.setPriority(priority);
    const { keyQueuePriority } = redisKeys.getKeys(queueName);
    metadata.preMessageWithPriorityEnqueued(message, queueName, multi);
    multi.zadd(keyQueuePriority, priority, message.toString());
  }

  ///

  getAcknowledgedMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(
        redisClient,
        queueName,
        'acknowledged',
        cb,
      );
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    this.redisClient.zRangePage(
      keyQueueAcknowledgedMessages,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getDeadLetterMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(redisClient, queueName, 'deadLetter', cb);
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    this.redisClient.zRangePage(
      keyQueueDL,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getPendingMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(redisClient, queueName, 'pending', cb);
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueue } = redisKeys.getKeys(queueName);
    this.redisClient.lRangePage(
      keyQueue,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getPendingMessagesWithPriority(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(
        redisClient,
        queueName,
        'pendingWithPriority',
        cb,
      );
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueuePriority } = redisKeys.getKeys(queueName);
    this.redisClient.zRangePage(
      keyQueuePriority,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getScheduledMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    Scheduler.getScheduledMessages(this.redisClient, queueName, skip, take, cb);
  }

  getMessageMetadata(
    messageId: string,
    cb: ICallback<IMessageMetadata[]>,
  ): void {
    metadata.getMessageMetadata(this.redisClient, messageId, cb);
  }

  quit(cb: ICallback<void>): void {
    this.redisClient.halt(() => {
      MessageManager.instance = null;
      cb();
    });
  }

  static getSingletonInstance(
    config: IConfig,
    cb: ICallback<MessageManager>,
  ): void {
    if (!MessageManager.instance) {
      RedisClient.getNewInstance(config, (redisClient) => {
        const instance = new MessageManager(redisClient);
        MessageManager.instance = instance;
        cb(null, instance);
      });
    } else cb(null, MessageManager.instance);
  }
}
