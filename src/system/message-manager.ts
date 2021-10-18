import { MessageManager as BaseMessageManager } from '../message-manager';
import {
  EMessageDeadLetterCause,
  ICallback,
  TRedisClientMulti,
} from '../../types';
import { Message } from '../message';
import { events } from './events';
import { RedisClient } from './redis-client';
import { Ticker } from './ticker';
import { redisKeys } from './redis-keys';
import { metadata } from './metadata';

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
    // A ticker is needed for pooling priority queues
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
    if (!this.dequeueScriptId) throw new Error('dequeueScriptSha is required');
    else {
      redisClient.evalsha(
        this.dequeueScriptId,
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
}
