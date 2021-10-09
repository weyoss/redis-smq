import { RedisClient } from './redis-client';
import {
  ICallback,
  IConfig,
  TConsumerOptions,
  TRedisClientMulti,
  TUnaryFunction,
} from '../types';
import { redisKeys } from './redis-keys';
import { Message } from './message';
import { Instance } from './instance';
import { events } from './events';
import { Consumer } from './consumer';
import { Scheduler } from './scheduler';
import BLogger from 'bunyan';
import { Logger } from './logger';
import { PowerManager } from './power-manager';

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

export class Broker {
  protected instance: Instance;
  protected queueName: string;
  protected config: IConfig;
  protected logger: BLogger;
  protected powerManager: PowerManager;
  protected schedulerInstance: Scheduler | null = null;
  protected redisClient: RedisClient | null = null;
  protected dequeueScriptId: string | null | undefined = null;

  constructor(instance: Instance) {
    this.instance = instance;
    this.queueName = instance.getQueueName();
    this.config = instance.getConfig();
    this.logger = Logger(
      `broker (${instance.getQueueName()}/${instance.getId()})`,
      instance.getConfig().log,
    );
    this.powerManager = new PowerManager();
  }

  protected getRedisClient(cb: TUnaryFunction<RedisClient>): void {
    if (!this.redisClient)
      this.instance.emit(
        events.ERROR,
        new Error('Expected an instance of RedisClient'),
      );
    else cb(this.redisClient);
  }

  getScheduler(cb: ICallback<Scheduler>): void {
    if (!this.schedulerInstance) {
      Scheduler.getInstance(this.queueName, this.config, (scheduler) => {
        this.schedulerInstance = scheduler;
        this.schedulerInstance.once(events.SCHEDULER_QUIT, () => {
          this.schedulerInstance = null;
        });
        cb(null, this.schedulerInstance);
      });
    } else cb(null, this.schedulerInstance);
  }

  bootstrap(cb: ICallback<void>): void {
    this.getRedisClient((client) => {
      const multi = client.multi();
      const { keyIndexQueue, keyQueue, keyQueueDLQ, keyIndexQueueDLQ } =
        this.instance.getInstanceRedisKeys();
      multi.sadd(keyIndexQueueDLQ, keyQueueDLQ);
      multi.sadd(keyIndexQueue, keyQueue);
      if (this.instance instanceof Consumer) {
        const {
          keyConsumerProcessingQueue,
          keyIndexQueueProcessing,
          keyIndexQueueQueuesProcessing,
        } = this.instance.getInstanceRedisKeys();
        multi.hset(
          keyIndexQueueQueuesProcessing,
          keyConsumerProcessingQueue,
          this.instance.getId(),
        );
        multi.sadd(keyIndexQueueProcessing, keyConsumerProcessingQueue);
      }
      client.execMulti(multi, (err) => {
        if (err) cb(err);
        else this.loadScripts(cb);
      });
    });
  }

  protected loadScripts(cb: ICallback<void>): void {
    this.getRedisClient((client) => {
      client.loadScript(dequeueScript, (err, sha) => {
        if (err) cb(err);
        else {
          this.dequeueScriptId = sha;
          cb();
        }
      });
    });
  }

  handleMessageWithExpiredTTL(
    message: Message,
    processingQueue: string,
    cb: ICallback<void>,
  ): void {
    this.getRedisClient((client) => {
      const multi = client.multi();
      multi.rpop(processingQueue);
      this.moveMessageToDLQQueue(message, multi);
      client.execMulti(multi, (err) => {
        if (err) cb(err);
        else {
          this.instance.emit(events.MESSAGE_DEAD_LETTER, message);
          cb();
        }
      });
    });
  }

  deleteProcessingQueue(
    queueName: string,
    processingQueueName: string,
    cb: ICallback<void>,
  ): void {
    this.getRedisClient((client) => {
      const multi = client.multi();
      const { keyIndexQueueProcessing, keyIndexQueueQueuesProcessing } =
        this.instance.getInstanceRedisKeys();
      multi.srem(keyIndexQueueProcessing, processingQueueName);
      multi.hdel(keyIndexQueueQueuesProcessing, processingQueueName);
      multi.del(processingQueueName);
      multi.exec((err) => cb(err));
    });
  }

  moveMessageToDLQQueue(message: Message, multi: TRedisClientMulti): void {
    const { keyQueueDLQ } = this.instance.getInstanceRedisKeys();
    this.logger.debug(`Moving message [${message.getId()}] to DLQ...`);
    multi.lpush(keyQueueDLQ, message.toString());
  }

  protected enqueueMessageAfterDelay(
    message: Message,
    delay: number,
    multi: TRedisClientMulti,
  ): void {
    this.getScheduler((err, scheduler) => {
      if (err) this.instance.emit(events.ERROR, err);
      else if (!scheduler)
        this.instance.emit(
          events.ERROR,
          new Error('Expected an instance of Scheduler'),
        );
      else {
        this.logger.debug(
          `Scheduling message ID [${message.getId()}]  (delay: [${delay}])...`,
        );
        message.setScheduledDelay(delay);
        scheduler.schedule(message, multi);
      }
    });
  }

  protected enqueueMessageWithPriority(
    message: Message,
    mixed: TRedisClientMulti | ICallback<void>,
  ): void {
    const { keyQueuePriorityQueue } = this.instance.getInstanceRedisKeys();
    const priority = message.getPriority() ?? Message.MessagePriority.NORMAL;
    if (typeof mixed === 'function') {
      this.getRedisClient((client) => {
        client.zadd(
          keyQueuePriorityQueue,
          priority,
          message.toString(),
          (err?: Error | null) => mixed(err),
        );
      });
    } else mixed.zadd(keyQueuePriorityQueue, priority, message.toString());
  }

  protected dequeueMessageWithPriority(
    redisClient: RedisClient,
    consumerOptions: TConsumerOptions,
  ): void {
    if (!this.dequeueScriptId)
      this.instance.emit(
        events.ERROR,
        new Error('dequeueScriptSha is required'),
      );
    else {
      const { keyQueuePriorityQueue, keyConsumerProcessingQueue } =
        this.instance.getInstanceRedisKeys();
      redisClient.evalsha(
        this.dequeueScriptId,
        [2, keyQueuePriorityQueue, keyConsumerProcessingQueue],
        (err, json) => {
          if (err) this.instance.emit(events.ERROR, err);
          else if (typeof json === 'string')
            this.handleReceivedMessage(json, consumerOptions);
          else
            setTimeout(
              () =>
                this.dequeueMessageWithPriority(redisClient, consumerOptions),
              1000,
            );
        },
      );
    }
  }

  enqueueMessage(
    message: Message,
    mixed: TRedisClientMulti | ICallback<void>,
  ): void {
    if (this.config.priorityQueue === true)
      this.enqueueMessageWithPriority(message, mixed);
    else {
      const { keyQueue } = this.instance.getInstanceRedisKeys();
      if (typeof mixed === 'function') {
        this.getRedisClient((client) => {
          client.lpush(keyQueue, message.toString(), (err?: Error | null) =>
            mixed(err),
          );
        });
      } else mixed.lpush(keyQueue, message.toString());
    }
  }

  // Requires an exclusive RedisClient client as brpoplpush will block the connection until a message is received.
  dequeueMessage(
    redisClient: RedisClient,
    consumerOptions: TConsumerOptions,
  ): void {
    if (this.config.priorityQueue === true) {
      this.dequeueMessageWithPriority(redisClient, consumerOptions);
    } else {
      const { keyQueue, keyConsumerProcessingQueue } =
        this.instance.getInstanceRedisKeys();
      redisClient.brpoplpush(
        keyQueue,
        keyConsumerProcessingQueue,
        0,
        (err, json) => {
          if (err) this.instance.emit(events.ERROR, err);
          else if (!json)
            this.instance.emit(
              events.ERROR,
              new Error('Expected a non empty string'),
            );
          else this.handleReceivedMessage(json, consumerOptions);
        },
      );
    }
  }

  protected handleReceivedMessage(
    json: string,
    consumerOptions: TConsumerOptions,
  ): void {
    const message = Message.createFromMessage(json);
    this.applyConsumerOptions(message, consumerOptions);
    if (message.hasExpired())
      this.instance.emit(events.MESSAGE_EXPIRED, message);
    else this.instance.emit(events.MESSAGE_RECEIVED, message);
  }

  acknowledgeMessage(cb: ICallback<void>): void {
    this.getRedisClient((client) => {
      const { keyConsumerProcessingQueue } =
        this.instance.getInstanceRedisKeys();
      client.rpop(keyConsumerProcessingQueue, (err?: Error | null) => cb(err));
    });
  }

  protected applyConsumerOptions(
    msg: Message,
    consumerOptions: TConsumerOptions,
  ): void {
    const {
      messageConsumeTimeout,
      messageRetryDelay,
      messageRetryThreshold,
      messageTTL,
    } = consumerOptions;
    if (msg.getTTL() === null) {
      msg.setTTL(messageTTL);
    }
    if (msg.getRetryDelay() === null) {
      msg.setRetryDelay(messageRetryDelay);
    }
    if (msg.getConsumeTimeout() === null) {
      msg.setConsumeTimeout(messageConsumeTimeout);
    }
    if (msg.getRetryThreshold() === null) {
      msg.setRetryThreshold(messageRetryThreshold);
    }
  }

  /**
   * Move the message to DLQ queue when max attempts threshold is reached or otherwise re-queue it again.
   * Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such messages
   * are periodically scheduled for delivery.
   */
  retry(
    message: Message,
    processingQueue: string,
    consumerOptions: TConsumerOptions,
    cb: ICallback<void | string>,
  ): void {
    this.applyConsumerOptions(message, consumerOptions);
    this.getRedisClient((client) => {
      this.getScheduler((err, scheduler) => {
        if (err) cb(err);
        else if (!scheduler) cb(new Error('Expected an instance of Scheduler'));
        else {
          if (message.hasExpired()) {
            this.logger.debug(`Message ID [${message.getId()}] has expired.`);
            this.handleMessageWithExpiredTTL(message, processingQueue, cb);
          } else if (scheduler.isPeriodic(message)) {
            this.logger.debug(
              `Message ID [${message.getId()}] has a periodic schedule. Cleaning processing queue...`,
            );
            client.rpop(processingQueue, cb);
          } else {
            let delayed = false;
            let requeued = false;
            const multi = client.multi();
            multi.rpop(processingQueue);
            if (!message.hasRetryThresholdExceeded()) {
              message.incrAttempts();
              this.logger.debug(
                `Message ID [${message.getId()}] is valid (threshold not exceeded) for re-queuing...`,
              );
              const delay = message.getRetryDelay();
              if (delay) {
                this.logger.debug(
                  `Delaying message ID [${message.getId()}] before re-queuing...`,
                );
                delayed = true;
                this.enqueueMessageAfterDelay(message, delay, multi);
              } else {
                this.logger.debug(
                  `Re-queuing message ID [${message.getId()}] for one more time...`,
                );
                requeued = true;
                this.enqueueMessage(message, multi);
              }
            } else {
              this.logger.debug(
                `Message ID [${message.getId()}] retry threshold exceeded. Moving message to DLQ...`,
              );
              this.moveMessageToDLQQueue(message, multi);
            }
            client.execMulti(multi, (err) => {
              if (err) cb(err);
              else {
                if (requeued) {
                  this.instance.emit(events.MESSAGE_REQUEUED, message);
                } else if (delayed) {
                  this.instance.emit(events.MESSAGE_DELAYED, message);
                } else {
                  this.instance.emit(events.MESSAGE_DEAD_LETTER, message);
                }
                cb();
              }
            });
          }
        }
      });
    });
  }

  start(): void {
    this.powerManager.goingUp();
    RedisClient.getInstance(this.config, (client) => {
      this.redisClient = client;
      this.bootstrap((err) => {
        if (err) this.instance.emit(events.ERROR, err);
        else {
          this.powerManager.commit();
          this.instance.emit(events.BROKER_UP);
        }
      });
    });
  }

  stop(): void {
    this.powerManager.goingDown();
    if (this.schedulerInstance) {
      this.schedulerInstance.quit();
      this.schedulerInstance = null;
    }
    if (this.redisClient) {
      this.redisClient.end(true);
      this.redisClient = null;
    }
    this.powerManager.commit();
    this.instance.emit(events.BROKER_DOWN);
  }

  static getProcessingQueues(
    client: RedisClient,
    queueName: string,
    cb: ICallback<string[]>,
  ): void {
    const { keyIndexQueueQueuesProcessing } = redisKeys.getKeys(queueName);
    client.hkeys(keyIndexQueueQueuesProcessing, cb);
  }

  static getMessageQueues(
    redisClient: RedisClient,
    cb: ICallback<string[]>,
  ): void {
    const { keyIndexQueue } = redisKeys.getGlobalKeys();
    redisClient.smembers(keyIndexQueue, cb);
  }

  static getDLQQueues(redisClient: RedisClient, cb: ICallback<string[]>): void {
    const { keyIndexQueueDLQ } = redisKeys.getGlobalKeys();
    redisClient.smembers(keyIndexQueueDLQ, cb);
  }
}
