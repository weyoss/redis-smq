import { LockManager } from './lock-manager';
import { Consumer } from './consumer';
import { PowerManager } from './power-manager';
import * as Logger from 'bunyan';
import { TCompatibleRedisClient } from '../types';
import { Ticker } from './ticker';
import { events } from './events';
import { Message } from './message';
import { HeartBeat } from './heartbeat';
import { GCMessageCollector } from './gc-message-collector';
import { RedisClient } from './redis-client';
import { ConsumerRedisKeys } from './redis-keys/consumer-redis-keys';

const GC_INSPECTION_INTERVAL = 1000; // in ms

export class GarbageCollector {
  protected consumer: Consumer;
  protected instanceId: string;
  protected powerManager = new PowerManager();
  protected keyIndexQueueQueuesProcessing: string;
  protected keyLockGC: string;
  protected keyIndexQueueProcessing: string;
  protected logger: Logger;

  protected lockManagerInstance: LockManager | null = null;
  protected redisClientInstance: TCompatibleRedisClient | null = null;
  protected queues: string[] = [];
  protected ticker: Ticker | null = null;
  protected gcMessageCollector: GCMessageCollector | null = null;

  constructor(consumer: Consumer) {
    this.consumer = consumer;
    this.instanceId = consumer.getId();
    const {
      keyIndexQueueQueuesProcessing,
      keyLockGC,
      keyIndexQueueProcessing,
    } = consumer.getInstanceRedisKeys();
    this.keyIndexQueueQueuesProcessing = keyIndexQueueQueuesProcessing;
    this.keyLockGC = keyLockGC;
    this.keyIndexQueueProcessing = keyIndexQueueProcessing;
    this.logger = consumer.getLogger();
  }

  protected getRedisInstance() {
    if (!this.redisClientInstance) {
      throw new Error();
    }
    return this.redisClientInstance;
  }

  protected getLockManagerInstance(): LockManager {
    if (!this.lockManagerInstance) {
      throw new Error();
    }
    return this.lockManagerInstance;
  }

  protected getTicker(): Ticker {
    if (!this.ticker) {
      throw new Error();
    }
    return this.ticker;
  }

  protected debug(message: string): void {
    this.logger.debug({ gc: true }, message);
  }

  protected unregisterEvents(): void {
    this.consumer.removeAllListeners(events.GC_SM_QUEUE);
    this.consumer.removeAllListeners(events.GC_SM_CONSUMER_OFFLINE);
    this.consumer.removeAllListeners(events.GC_SM_EMPTY_QUEUE);
    this.consumer.removeAllListeners(events.GC_SM_MESSAGE);
    this.consumer.removeAllListeners(events.GC_SM_MESSAGE_COLLECTED);
    this.consumer.removeAllListeners(events.GC_SM_NEXT_QUEUE);
    this.consumer.removeAllListeners(events.GC_SM_NEXT_TICK);
    this.consumer.removeAllListeners(events.GC_SM_QUEUE_DESTROYED);
    this.consumer.removeAllListeners(events.GC_SM_TICK);
  }

  protected destroyQueue(processingQueueName: string): void {
    const multi = this.getRedisInstance().multi();
    multi.srem(this.keyIndexQueueProcessing, processingQueueName);
    multi.hdel(this.keyIndexQueueQueuesProcessing, processingQueueName);
    multi.del(processingQueueName);
    multi.exec((err) => {
      if (err) this.consumer.error(err);
      else
        this.consumer.emit(events.GC_SM_QUEUE_DESTROYED, processingQueueName);
    });
  }

  protected registerEvents(): void {
    this.unregisterEvents();
    this.consumer.on(events.GC_SM_QUEUE, (queue: string) => {
      this.debug(`Inspecting processing queue [${queue}]... `);
      const extractedData = ConsumerRedisKeys.extractData(queue);
      if (!extractedData || !extractedData.consumerId) {
        throw new Error();
      }
      const { queueName, consumerId } = extractedData;
      if (consumerId !== this.instanceId) {
        this.debug(`Is consumer ID [${consumerId}] alive?`);
        HeartBeat.isOnline(
          { client: this.getRedisInstance(), queueName, id: consumerId },
          (err, online) => {
            if (err) this.consumer.error(err);
            else if (online) {
              this.debug(`Consumer [${consumerId}]: The consumer is online.`);
              this.consumer.emit(events.GC_SM_NEXT_QUEUE);
            } else {
              this.debug(
                `Consumer [${consumerId}]: The consumer seems to be offline.`,
              );
              this.consumer.emit(
                events.GC_SM_CONSUMER_OFFLINE,
                consumerId,
                queue,
              );
            }
          },
        );
      } else {
        this.debug(`Consumer [${consumerId}]: The consumer is online.`);
        this.consumer.emit(events.GC_SM_NEXT_QUEUE);
      }
    });

    this.consumer.on(
      events.GC_SM_CONSUMER_OFFLINE,
      (consumerId: string, queue: string) => {
        this.debug(
          `Consumer [${consumerId}]: Trying to fetch a message from the processing queue ...`,
        );
        this.getRedisInstance().lrange(queue, 0, 0, (err, range) => {
          if (err) this.consumer.error(err);
          else if (range.length) {
            const msg = Message.createFromMessage(range[0]);
            this.debug(
              `Consumer [${consumerId}]: Fetched a message (ID [${msg.getId()}]) from the processing queue.`,
            );
            this.consumer.emit(events.GC_SM_MESSAGE, msg, queue);
          } else {
            this.debug(`Consumer [${consumerId}]: Processing queue is empty.`);
            this.consumer.emit(events.GC_SM_EMPTY_QUEUE, queue, consumerId);
          }
        });
      },
    );

    this.consumer.on(events.GC_SM_MESSAGE, (msg: Message, queue: string) => {
      this.getMessageCollector().collectMessage(msg, queue, (err) => {
        if (err) this.consumer.error(err);
        else this.consumer.emit(events.GC_SM_MESSAGE_COLLECTED, msg, queue);
      });
    });

    this.consumer.on(
      events.GC_SM_MESSAGE_COLLECTED,
      (message: Message, queue: string) => {
        this.debug(`Message [${message.getId()}]: Message collected.`);
        this.destroyQueue(queue);
      },
    );

    this.consumer.on(
      events.GC_SM_EMPTY_QUEUE,
      (queue: string, consumerId: string) => {
        this.debug(
          `Consumer [${consumerId}]: Deleting the processing queue...`,
        );
        this.destroyQueue(queue);
      },
    );

    this.consumer.on(events.GC_SM_QUEUE_DESTROYED, (queue: string) => {
      this.debug(
        `Queue [${queue}] has been deleted. Inspecting next processing queue...`,
      );
      this.consumer.emit(events.GC_SM_NEXT_QUEUE);
    });

    this.consumer.on(events.GC_SM_NEXT_QUEUE, () => {
      if (this.queues.length) {
        const processingQueueName = this.queues.pop();
        this.debug(`Got a new processing queue [${processingQueueName}].`);
        this.consumer.emit(events.GC_SM_QUEUE, processingQueueName);
      } else {
        this.debug(`All queues has been inspected. Next iteration...`);
        this.consumer.emit(events.GC_SM_NEXT_TICK);
      }
    });

    this.consumer.on(events.GC_SM_NEXT_TICK, () => {
      this.debug(
        `Waiting for ${GC_INSPECTION_INTERVAL} before the next iteration...`,
      );
      this.getTicker().nextTick();
    });

    this.consumer.on(events.GC_SM_TICK, () => {
      this.getLockManagerInstance().acquireLock(
        this.keyLockGC,
        10000,
        (error, extended) => {
          if (error) this.consumer.error(error);
          else {
            this.consumer.emit(
              events.GC_LOCK_ACQUIRED,
              this.instanceId,
              extended,
            );
            this.debug('Inspecting processing queues...');
            this.getRedisInstance().hkeys(
              this.keyIndexQueueQueuesProcessing,
              (e, result) => {
                if (e) this.consumer.error(e);
                else if (result) {
                  this.debug(`Fetched [${result.length}] processing queues`);
                  this.queues = result;
                  this.consumer.emit(events.GC_SM_NEXT_QUEUE);
                } else {
                  this.debug('No processing queues found');
                  this.consumer.emit(events.GC_SM_NEXT_TICK);
                }
              },
            );
          }
        },
      );
    });
  }

  protected setupMessageCollector(): void {
    this.gcMessageCollector = new GCMessageCollector(
      this.consumer,
      this.getRedisInstance(),
    );
  }

  start(): void {
    this.powerManager.goingUp();
    const config = this.consumer.getConfig();
    LockManager.getInstance(config, (lockManager) => {
      this.lockManagerInstance = lockManager;
      RedisClient.getNewInstance(config, (client: TCompatibleRedisClient) => {
        this.redisClientInstance = client;
        this.ticker = new Ticker(
          () => this.consumer.emit(events.GC_SM_TICK),
          GC_INSPECTION_INTERVAL,
        );
        this.registerEvents();
        this.setupMessageCollector();
        this.powerManager.commit();
        this.consumer.emit(events.GC_SM_TICK);
        this.consumer.emit(events.GC_UP);
      });
    });
  }

  stop(): void {
    this.powerManager.goingDown();
    const shutdownFn = () => {
      this.getLockManagerInstance().quit(() => {
        this.lockManagerInstance = null;
        this.getRedisInstance().end(true);
        this.redisClientInstance = null;
        this.gcMessageCollector = null;
        this.ticker = null;
        this.powerManager.commit();
        this.consumer.emit(events.GC_DOWN);
      });
    };
    if (!this.getLockManagerInstance().isLocked()) shutdownFn();
    else this.getTicker().shutdown(shutdownFn);
  }

  getMessageCollector(): GCMessageCollector {
    if (!this.gcMessageCollector) {
      throw new Error();
    }
    return this.gcMessageCollector;
  }
}
