import {
  EMessageDeadLetterCause,
  ICallback,
  IConfig,
  TConsumerOptions,
  TGetAcknowledgedMessagesReply,
  TMessageMetadata,
  TRedisClientMulti,
} from '../types';
import { Broker } from './broker';
import { RedisClient } from './redis-client';
import { Scheduler } from './scheduler';
import { Metadata } from './metadata';
import { Message } from './message';
import { redisKeys } from './redis-keys';
import { events } from './events';
import { Ticker } from './ticker';

const dequeueScript = `
if redis.call("EXISTS", KEYS[1]) == 1 then 
    local result = redis.call("ZRANGE", KEYS[1], 0, 0)
	if #(result) then 
	    local message = result[1]
	    redis.call("RPUSH", KEYS[2], message)
	    redis.call("ZREM", KEYS[1], message)
	    return message
    end
end 
return nil
`;

export class MessageManager {
  protected static instance: MessageManager | null = null;
  protected redisClient: RedisClient;
  protected ticker: Ticker;
  protected dequeueScriptId: string | null | undefined = null;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;

    // Initialize a dummy ticker. nextTickFn will be used instead of nextTick
    // A ticker is needed to pool priority queues
    this.ticker = new Ticker(() => void 0, 1000);
  }

  ///

  bootstrap(cb: ICallback<void>): void {
    this.redisClient.loadScript(dequeueScript, (err, sha) => {
      if (err) cb(err);
      else {
        this.dequeueScriptId = sha;
        cb();
      }
    });
  }

  ///

  moveMessageToDLQQueue(
    broker: Broker,
    message: Message,
    cause: EMessageDeadLetterCause,
    multi: TRedisClientMulti,
  ): void {
    const instance = broker.getInstance();
    const queueName = instance.getQueueName();
    const { keyQueueDL } = instance.getInstanceRedisKeys();
    instance.emit(
      events.PRE_MESSAGE_DEAD_LETTER,
      message,
      queueName,
      cause,
      multi,
    );
    multi.zadd(keyQueueDL, Date.now(), message.toString());
  }

  moveMessageToAcknowledgmentQueue(
    broker: Broker,
    message: Message,
    multi: TRedisClientMulti,
  ): void {
    const { keyQueueAcknowledgedMessages } = broker
      .getInstance()
      .getInstanceRedisKeys();
    multi.zadd(keyQueueAcknowledgedMessages, Date.now(), message.toString());
  }

  enqueueMessageWithPriority(
    broker: Broker,
    message: Message,
    multi: TRedisClientMulti,
  ): void {
    const instance = broker.getInstance();
    const queueName = instance.getQueueName();
    instance.emit(
      events.PRE_MESSAGE_WITH_PRIORITY_ENQUEUED,
      message,
      queueName,
      multi,
    );
    const priority = message.getPriority() ?? Message.MessagePriority.NORMAL;
    if (message.getPriority() !== priority) message.setPriority(priority);
    const { keyQueuePriority } = instance.getInstanceRedisKeys();
    multi.zadd(keyQueuePriority, priority, message.toString());
  }

  // Requires an exclusive RedisClient client
  dequeueMessageWithPriority(
    broker: Broker,
    redisClient: RedisClient,
    consumerOptions: TConsumerOptions,
  ): void {
    const instance = broker.getInstance();
    if (!this.dequeueScriptId)
      instance.emit(events.ERROR, new Error('dequeueScriptSha is required'));
    else {
      const { keyQueuePriority, keyQueueProcessing } =
        instance.getInstanceRedisKeys();
      redisClient.evalsha(
        this.dequeueScriptId,
        [2, keyQueuePriority, keyQueueProcessing],
        (err, json) => {
          if (err) instance.emit(events.ERROR, err);
          else if (typeof json === 'string')
            broker.handleReceivedMessage(json, consumerOptions);
          else
            this.ticker.nextTickFn(() =>
              this.dequeueMessageWithPriority(
                broker,
                redisClient,
                consumerOptions,
              ),
            );
        },
      );
    }
  }

  enqueueMessage(
    broker: Broker,
    message: Message,
    multi: TRedisClientMulti,
  ): void {
    const instance = broker.getInstance();
    const queueName = instance.getQueueName();
    const { keyQueue } = instance.getInstanceRedisKeys();
    instance.emit(events.PRE_MESSAGE_ENQUEUED, message, queueName, multi);
    multi.lpush(keyQueue, message.toString());
  }

  // Requires an exclusive RedisClient client
  dequeueMessage(
    broker: Broker,
    redisClient: RedisClient,
    consumerOptions: TConsumerOptions,
  ): void {
    const instance = broker.getInstance();
    const { keyQueue, keyQueueProcessing } = instance.getInstanceRedisKeys();
    redisClient.brpoplpush(keyQueue, keyQueueProcessing, 0, (err, json) => {
      if (err) {
        instance.emit(events.ERROR, err);
      } else if (!json)
        instance.emit(events.ERROR, new Error('Expected a non empty string'));
      else broker.handleReceivedMessage(json, consumerOptions);
    });
  }

  ///

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
