import {
  ICallback,
  IConfig,
  TGetAcknowledgedMessagesReply,
  TMessageMetadata,
} from '../types';
import { RedisClient } from './system/redis-client';
import { Scheduler } from './scheduler';
import { Metadata } from './system/metadata';
import { Message } from './message';
import { redisKeys } from './system/redis-keys';

export class MessageManager {
  protected static instance: MessageManager | null = null;
  protected redisClient: RedisClient;

  protected constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  getAcknowledgedMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      Metadata.getQueueMetadataByKey(
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
      Metadata.getQueueMetadataByKey(redisClient, queueName, 'deadLetter', cb);
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
      Metadata.getQueueMetadataByKey(redisClient, queueName, 'pending', cb);
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
      Metadata.getQueueMetadataByKey(
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
    cb: ICallback<TMessageMetadata[]>,
  ): void {
    Metadata.getMessageMetadata(this.redisClient, messageId, cb);
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
