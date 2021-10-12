import {
  ICallback,
  IConfig,
  TGetAcknowledgedMessagesReply,
  TMessageMetadata,
  TUnaryFunction,
} from '../types';
import { Broker } from './broker';
import { RedisClient } from './redis-client';
import { Scheduler } from './scheduler';
import { Metadata } from './metadata';

export class MessageProvider {
  protected static instance: MessageProvider | null = null;
  protected client: RedisClient;

  protected constructor(client: RedisClient) {
    this.client = client;
  }

  getAcknowledgedMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    Broker.getAcknowledgedMessages(this.client, queueName, skip, take, cb);
  }

  getDeadLetterMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    Broker.getDeadLetterMessages(this.client, queueName, skip, take, cb);
  }

  getPendingMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    Broker.getPendingMessages(this.client, queueName, skip, take, cb);
  }

  getPendingMessagesWithPriority(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    Broker.getPendingMessagesWithPriority(
      this.client,
      queueName,
      skip,
      take,
      cb,
    );
  }

  getScheduledMessages(
    queueName: string,
    skip: number,
    take: number,
    cb: ICallback<TGetAcknowledgedMessagesReply>,
  ): void {
    Scheduler.getScheduledMessages(this.client, queueName, skip, take, cb);
  }

  getMessageMetadata(
    messageId: string,
    cb: ICallback<TMessageMetadata[]>,
  ): void {
    Metadata.getMessageMetadata(this.client, messageId, cb);
  }

  quit(): void {
    this.client.end(true);
    MessageProvider.instance = null;
  }

  static getInstance(
    config: IConfig,
    cb: TUnaryFunction<MessageProvider>,
  ): void {
    if (!MessageProvider.instance) {
      RedisClient.getInstance(config, (client) => {
        MessageProvider.instance = new MessageProvider(client);
        cb(MessageProvider.instance);
      });
    } else cb(MessageProvider.instance);
  }
}
