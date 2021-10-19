import {
  EMessageDeadLetterCause,
  EMessageMetadataType,
  ICallback,
  IConfig,
  IMessageMetadata,
  TGetAcknowledgedMessagesReply,
  TGetScheduledMessagesReply,
  TRedisClientMulti,
} from '../types';
import { RedisClient } from './system/redis-client';
import { Message } from './message';
import { redisKeys } from './system/redis-keys';
import { metadata } from './system/metadata';
import {
  ELuaScriptName,
  getScriptId,
  loadScripts,
} from './system/message-manager/lua-scripts';
import { events } from './system/events';
import { Ticker } from './system/ticker';
import { RequeueMessageHandler } from './system/message-manager/requeue-message-handler';
import { DeleteMessageHandler } from './system/message-manager/delete-message-handler';

export class MessageManager {
  protected static instance: MessageManager | null = null;
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected requeueManagerHandler: RequeueMessageHandler;
  protected deleteMessageHandler: DeleteMessageHandler;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.requeueManagerHandler = new RequeueMessageHandler();
    this.deleteMessageHandler = new DeleteMessageHandler();

    // Initialize a dummy ticker. nextTickFn will be used instead of nextTick
    // A ticker is needed for pooling priority queues
    this.ticker = new Ticker(() => void 0, 1000);
  }

  ///

  deletePendingMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.deleteMessageHandler.deleteMessage(
      this.redisClient,
      queueName,
      messageId,
      [
        EMessageMetadataType.ENQUEUED,
        EMessageMetadataType.ENQUEUED_WITH_PRIORITY,
      ],
      cb,
    );
  }

  deleteAcknowledgedMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.deleteMessageHandler.deleteMessage(
      this.redisClient,
      queueName,
      messageId,
      [EMessageMetadataType.ACKNOWLEDGED],
      cb,
    );
  }

  deleteScheduledMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.deleteMessageHandler.deleteMessage(
      this.redisClient,
      queueName,
      messageId,
      [EMessageMetadataType.SCHEDULED],
      cb,
    );
  }

  deleteDeadLetterMessage(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.deleteMessageHandler.deleteMessage(
      this.redisClient,
      queueName,
      messageId,
      [EMessageMetadataType.DEAD_LETTER],
      cb,
    );
  }

  ///

  requeueMessageFromAcknowledgedQueue(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.requeueManagerHandler.requeueMessage(
      this.redisClient,
      queueName,
      messageId,
      false,
      undefined,
      [EMessageMetadataType.ACKNOWLEDGED],
      this.deleteMessageHandler,
      cb,
    );
  }

  requeueMessageWithPriorityFromAcknowledgedQueue(
    queueName: string,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.requeueManagerHandler.requeueMessage(
      this.redisClient,
      queueName,
      messageId,
      true,
      priority,
      [EMessageMetadataType.ACKNOWLEDGED],
      this.deleteMessageHandler,
      cb,
    );
  }

  requeueMessageFromDLQueue(
    queueName: string,
    messageId: string,
    cb: ICallback<void>,
  ): void {
    this.requeueManagerHandler.requeueMessage(
      this.redisClient,
      queueName,
      messageId,
      false,
      undefined,
      [EMessageMetadataType.DEAD_LETTER],
      this.deleteMessageHandler,
      cb,
    );
  }

  requeueMessageWithPriorityFromDLQueue(
    queueName: string,
    messageId: string,
    priority: number | undefined,
    cb: ICallback<void>,
  ): void {
    this.requeueManagerHandler.requeueMessage(
      this.redisClient,
      queueName,
      messageId,
      true,
      priority,
      [EMessageMetadataType.DEAD_LETTER],
      this.deleteMessageHandler,
      cb,
    );
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
    cb: ICallback<TGetScheduledMessagesReply>,
  ): void {
    const getTotalFn = (redisClient: RedisClient, cb: ICallback<number>) =>
      metadata.getQueueMetadataByKey(redisClient, queueName, 'scheduled', cb);
    const transformFn = (msgStr: string) => Message.createFromMessage(msgStr);
    const { keyQueueScheduledMessages } = redisKeys.getKeys(queueName);
    this.redisClient.zRangePage(
      keyQueueScheduledMessages,
      skip,
      take,
      getTotalFn,
      transformFn,
      cb,
    );
  }

  getMessageMetadata(
    messageId: string,
    cb: ICallback<IMessageMetadata[]>,
  ): void {
    metadata.getMessageMetadata(this.redisClient, messageId, cb);
  }

  ///

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

  bootstrap(cb: ICallback<void>): void {
    loadScripts(this.redisClient, cb);
  }

  moveMessageToDLQQueue(
    queueName: string,
    message: Message,
    cause: EMessageDeadLetterCause,
    multi: TRedisClientMulti,
  ): void {
    const { keyQueueDL } = redisKeys.getKeys(queueName);
    metadata.preMessageDeadLetter(message, queueName, cause, multi);
    multi.zadd(keyQueueDL, Date.now(), message.toString());
  }

  moveMessageToAcknowledgmentQueue(
    queueName: string,
    message: Message,
    multi: TRedisClientMulti,
  ): void {
    const { keyQueueAcknowledgedMessages } = redisKeys.getKeys(queueName);
    metadata.preMessageAcknowledged(message, queueName, multi);
    multi.zadd(keyQueueAcknowledgedMessages, Date.now(), message.toString());
  }

  // Requires an exclusive RedisClient client
  dequeueMessageWithPriority(
    redisClient: RedisClient,
    keyQueuePriority: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    redisClient.evalsha(
      getScriptId(ELuaScriptName.DEQUEUE_MESSAGE_WITH_PRIORITY),
      [2, keyQueuePriority, keyQueueProcessing],
      (err, json) => {
        if (err) cb(err);
        else if (typeof json === 'string') cb(null, json);
        else
          this.ticker.nextTickFn(() =>
            this.dequeueMessageWithPriority(
              redisClient,
              keyQueuePriority,
              keyQueueProcessing,
              cb,
            ),
          );
      },
    );
  }

  // Requires an exclusive RedisClient client
  dequeueMessage(
    redisClient: RedisClient,
    keyQueue: string,
    keyQueueProcessing: string,
    cb: ICallback<string>,
  ): void {
    redisClient.brpoplpush(keyQueue, keyQueueProcessing, 0, cb);
  }

  quit(cb: ICallback<void>): void {
    this.ticker.once(events.DOWN, () => {
      if (this === MessageManager.instance) {
        this.redisClient.halt(() => {
          MessageManager.instance = null;
          cb();
        });
      } else cb();
    });
    this.ticker.quit();
  }

  ///

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
