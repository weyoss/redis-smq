import * as async from 'neo-async';
import { LockManager } from './lock-manager';
import { Consumer } from './consumer';
import { PowerManager } from './power-manager';
import * as Logger from 'bunyan';
import { Ticker } from './ticker';
import { events } from './events';
import { Message } from './message';
import { HeartBeat } from './heartbeat';
import { GCMessageCollector } from './gc-message-collector';
import { RedisClient } from './redis-client';
import { TCallback } from '../types';
import { Queue } from './queue';
import { redisKeys } from './redis-keys';

const GC_INSPECTION_INTERVAL = 1000; // in ms

export class GarbageCollector {
  protected consumer: Consumer;
  protected instanceId: string;
  protected queueName: string;
  protected keyLockGC: string;
  protected logger: Logger;
  protected powerManager: PowerManager;

  protected lockManagerInstance: LockManager | null = null;
  protected redisClientInstance: RedisClient | null = null;
  protected ticker: Ticker | null = null;
  protected gcMessageCollector: GCMessageCollector | null = null;
  protected queue: Queue | null = null;

  constructor(consumer: Consumer) {
    this.consumer = consumer;
    this.instanceId = consumer.getId();
    this.queueName = consumer.getQueueName();
    const { keyLockGC } = consumer.getInstanceRedisKeys();
    this.keyLockGC = keyLockGC;
    this.logger = consumer.getLogger();
    this.powerManager = new PowerManager();
  }

  protected getRedisInstance() {
    if (!this.redisClientInstance) {
      throw new Error(`Expected an instance of RedisClient`);
    }
    return this.redisClientInstance;
  }

  protected getLockManagerInstance(): LockManager {
    if (!this.lockManagerInstance) {
      throw new Error(`Expected an instance of LockManager`);
    }
    return this.lockManagerInstance;
  }

  protected getQueueInstance() {
    if (!this.queue) {
      throw new Error(`Expected an instance of Queue`);
    }
    return this.queue;
  }

  protected getTicker(): Ticker {
    if (!this.ticker) {
      throw new Error(`Expected an instance of Ticker`);
    }
    return this.ticker;
  }

  protected debug(message: string): void {
    this.logger.debug({ gc: true }, message);
  }

  protected destroyQueue(
    processingQueueName: string,
    cb: TCallback<void>,
  ): void {
    this.getQueueInstance().deleteProcessingQueue(
      this.queueName,
      processingQueueName,
      (err?: Error | null) => {
        if (err) this.consumer.error(err);
        else {
          this.debug(`Processing queue [${processingQueueName}] deleted.`);
          this.consumer.emit(events.GC_SM_QUEUE_DESTROYED, processingQueueName);
          cb();
        }
      },
    );
  }

  protected handleOfflineConsumer(
    consumerId: string,
    queue: string,
    cb: TCallback<void>,
  ): void {
    this.debug(
      `Inspecting consumer [${consumerId}] processing queue [${queue}] ...`,
    );
    this.getRedisInstance().lrange(
      queue,
      0,
      0,
      (err?: Error | null, range?: string[] | null) => {
        if (err) cb(err);
        else if (range && range.length) {
          const msg = Message.createFromMessage(range[0]);
          this.debug(
            `Fetched message ID [${msg.getId()}] from consumer [${consumerId}] processing queue [${queue}].`,
          );
          this.getMessageCollector().collectMessage(msg, queue, (err) => {
            if (err) cb(err);
            else {
              this.consumer.emit(events.GC_SM_MESSAGE_COLLECTED, msg, queue);
              this.debug(`Message ID ${msg.getId()} collected.`);
              this.destroyQueue(queue, cb);
            }
          });
        } else {
          this.destroyQueue(queue, cb);
        }
      },
    );
  }

  protected handleProcessingQueue(queue: string, cb: TCallback<void>): void {
    this.debug(`Inspecting processing queue [${queue}]... `);
    const extractedData = redisKeys.extractData(queue);
    if (!extractedData || !extractedData.consumerId) {
      throw new Error(`Invalid extracted consumer data`);
    }
    const { queueName, consumerId } = extractedData;
    if (consumerId !== this.instanceId) {
      this.debug(`Is consumer ID [${consumerId}] alive?`);
      HeartBeat.isOnline(
        { client: this.getRedisInstance(), queueName, id: consumerId },
        (err, online) => {
          if (err) this.consumer.error(err);
          else if (online) {
            this.debug(`Consumer [${consumerId}] is online.`);
            cb();
          } else {
            this.debug(`Consumer ID [${consumerId}] seems to be offline.`);
            this.consumer.emit(
              events.GC_SM_CONSUMER_OFFLINE,
              consumerId,
              queue,
            );
            this.handleOfflineConsumer(consumerId, queue, cb);
          }
        },
      );
    } else {
      this.debug(`Consumer [${consumerId}]: The consumer is online.`);
      cb();
    }
  }

  protected handleProcessingQueues(
    queues: string[],
    cb: TCallback<void>,
  ): void {
    async.each(
      queues,
      (queue: string, index, cb) => {
        this.handleProcessingQueue(queue, cb);
      },
      (err) => {
        cb(err);
      },
    );
  }

  protected onTick() {
    if (this.powerManager.isRunning()) {
      this.getLockManagerInstance().acquireLock(
        this.keyLockGC,
        10000,
        false,
        (error, acquired) => {
          if (error) this.consumer.error(error);
          else {
            if (acquired) {
              this.consumer.emit(events.GC_LOCK_ACQUIRED, this.instanceId);
              this.debug('Inspecting processing queues...');
              this.getQueueInstance().getProcessingQueues(
                this.queueName,
                (e?: Error | null, result?: string[] | null) => {
                  if (e) this.consumer.error(e);
                  else if (result) {
                    this.debug(`Fetched [${result.length}] processing queues`);
                    this.handleProcessingQueues(result, (err) => {
                      if (err) this.consumer.error(err);
                      else {
                        this.getTicker().nextTick();
                      }
                    });
                  } else {
                    this.debug(
                      'No processing queues found. Waiting for next tick...',
                    );
                    this.getTicker().nextTick();
                  }
                },
              );
            } else {
              this.getTicker().nextTick();
            }
          }
        },
      );
    }
    if (this.powerManager.isGoingDown()) {
      this.consumer.emit(events.GC_READY_TO_SHUTDOWN);
    }
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
    this.redisClientInstance = new RedisClient(config);
    this.lockManagerInstance = new LockManager(this.redisClientInstance);
    this.queue = new Queue(this.redisClientInstance);
    this.setupMessageCollector();
    this.ticker = new Ticker(() => {
      this.onTick();
    }, GC_INSPECTION_INTERVAL);
    this.powerManager.commit();
    this.consumer.emit(events.GC_UP);
    this.onTick();
  }

  stop(): void {
    this.powerManager.goingDown();
    this.consumer.once(events.GC_READY_TO_SHUTDOWN, () => {
      this.getTicker().shutdown();
      this.getLockManagerInstance().quit(() => {
        this.getRedisInstance().end(true);
        this.lockManagerInstance = null;
        this.redisClientInstance = null;
        this.gcMessageCollector = null;
        this.queue = null;
        this.ticker = null;
        this.powerManager.commit();
        this.consumer.emit(events.GC_DOWN);
      });
    });
  }

  getMessageCollector(): GCMessageCollector {
    if (!this.gcMessageCollector) {
      throw new Error(`Expected an instance of GCMessageCollector`);
    }
    return this.gcMessageCollector;
  }
}
