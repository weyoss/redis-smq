import { MessageManager as BaseMessageManager } from '../message-manager';
import {
  EMessageDeadLetterCause,
  ICallback,
  TConsumerOptions,
  TRedisClientMulti,
} from '../../types';
import { Broker } from './broker';
import { Message } from '../message';
import { events } from './events';
import { RedisClient } from './redis-client';
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

export class MessageManager extends BaseMessageManager {
  protected ticker: Ticker;
  protected dequeueScriptId: string | null | undefined = null;

  constructor(redisClient: RedisClient) {
    super(redisClient);

    // Initialize a dummy ticker. nextTickFn will be used instead of nextTick
    // A ticker is needed to pool priority queues
    this.ticker = new Ticker(() => void 0, 1000);
  }

  bootstrap(cb: ICallback<void>): void {
    this.redisClient.loadScript(dequeueScript, (err, sha) => {
      if (err) cb(err);
      else {
        this.dequeueScriptId = sha;
        cb();
      }
    });
  }

  moveMessageToDLQQueue(
    broker: Broker,
    message: Message,
    cause: EMessageDeadLetterCause,
    multi: TRedisClientMulti,
  ): void {
    const instance = broker.getInstance();
    const queueName = instance.getQueueName();
    const { keyQueueDL } = instance.getRedisKeys();
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
      .getRedisKeys();
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
    const { keyQueuePriority } = instance.getRedisKeys();
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
      const { keyQueuePriority, keyQueueProcessing } = instance.getRedisKeys();
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
    const { keyQueue } = instance.getRedisKeys();
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
    const { keyQueue, keyQueueProcessing } = instance.getRedisKeys();
    redisClient.brpoplpush(keyQueue, keyQueueProcessing, 0, (err, json) => {
      if (err) {
        instance.emit(events.ERROR, err);
      } else if (!json)
        instance.emit(events.ERROR, new Error('Expected a non empty string'));
      else broker.handleReceivedMessage(json, consumerOptions);
    });
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
}
